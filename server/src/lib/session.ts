import { randomBytes } from 'node:crypto';
import type { SessionUser, UserRole } from '@ham/shared';
import { and, eq, gt } from 'drizzle-orm';
import type { CookieOptions, RequestHandler, Response } from 'express';
import { db } from '../db/client.js';
import { serviceCenters, sessions, users } from '../db/schema.js';
import { HttpError } from './http.js';

export const SESSION_COOKIE = 'sid';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export async function startSession(res: Response, userId: string): Promise<void> {
  const id = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id, userId, expiresAt });
  res.cookie(SESSION_COOKIE, id, { ...cookieOptions, expires: expiresAt });
}

export async function endSession(res: Response, sessionId: string | undefined): Promise<void> {
  if (sessionId) await db.delete(sessions).where(eq(sessions.id, sessionId));
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

export async function getSessionUser(userId: string): Promise<SessionUser | undefined> {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      centerId: serviceCenters.id,
      centerName: serviceCenters.name,
      centerClosedAt: serviceCenters.closedAt,
    })
    .from(users)
    .leftJoin(serviceCenters, eq(users.serviceCenterId, serviceCenters.id))
    .where(eq(users.id, userId));
  if (!row) return undefined;
  const { centerId, centerName, centerClosedAt, ...user } = row;
  return {
    ...user,
    serviceCenter: centerId && centerName ? { id: centerId, name: centerName, closed: centerClosedAt !== null } : null,
  };
}

/** Attaches req.user when the request carries a valid session cookie. */
export const loadUser: RequestHandler = async (req, _res, next) => {
  const sessionId: string | undefined = req.cookies?.[SESSION_COOKIE];
  if (sessionId) {
    const [session] = await db
      .select({ userId: sessions.userId })
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())));
    if (session) {
      const user = await getSessionUser(session.userId);
      // Technicians of a closed center are treated as signed out (docs/DECISIONS.md #37).
      if (!(user?.role === 'technician' && user.serviceCenter?.closed)) req.user = user;
    }
  }
  next();
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw new HttpError(401, 'Please sign in.');
    if (roles.length && !roles.includes(req.user.role)) throw new HttpError(403, 'You do not have access to this.');
    next();
  };
}
