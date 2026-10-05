import type { ReminderType } from './enums.js';

export interface ReminderItem {
  id: string;
  type: ReminderType;
  /** Warranty end date or maintenance due date. */
  dueDate: string;
  read: boolean;
  createdAt: string;
  asset: { id: string; name: string | null; category: string; brand: string; model: string | null; homeName: string };
  /** Set for maintenance reminders. */
  scheduleTitle: string | null;
  /** Set for warranty reminders. */
  warrantyDetails: string | null;
}

export interface ReminderList {
  items: ReminderItem[];
  unreadCount: number;
}
