import { createTeamMemberSchema, type CreateTeamMemberInput } from '@ham/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useMe } from '../../auth/useAuth';
import { api, fieldErrorsOf } from '../../lib/api';
import { validate } from '../../lib/form';
import { keys, type Technician as TeamMember } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { PageHeader } from '../../ui/PageHeader';
import { Skeleton } from '../../ui/Skeleton';
import { TextField } from '../../ui/TextField';

type Kind = 'technicians' | 'staff';

const COPY: Record<Kind, { title: string; singular: string; hint: string; empty: string }> = {
  technicians: {
    title: 'Technicians',
    singular: 'technician',
    hint: 'Technicians see the requests you assign to them.',
    empty: 'Add your first technician so you can assign requests.',
  },
  staff: {
    title: 'Staff',
    singular: 'staff member',
    hint: 'Staff have the same access as you: they can manage requests and add team members.',
    empty: 'No other staff yet.',
  },
};

const EMPTY_FORM = { name: '', email: '', phone: '', password: '' };
const queryKey = (kind: Kind) => (kind === 'technicians' ? keys.technicians : (['center', 'staff'] as const));

function MemberList({ kind }: { kind: Kind }) {
  const { data: me } = useMe();
  const members = useQuery({ queryKey: queryKey(kind), queryFn: () => api<TeamMember[]>(`/center/${kind}`) });

  if (members.isPending) return <Skeleton className="m-6 h-14" />;
  if (members.isError) return <div className="p-6"><FormError message="Could not load the team." /></div>;
  if (!members.data.length) return <EmptyState icon={Users} title={`No ${COPY[kind].title.toLowerCase()} yet`} description={COPY[kind].empty} />;
  return (
    <ul className="divide-y divide-line/70">
      {members.data.map((m, i) => (
        <li key={m.id} className="flex animate-fade-up flex-wrap items-center gap-x-4 gap-y-1 px-6 py-4" style={{ animationDelay: `${i * 80}ms` }}>
          <div className={`grid size-10 place-items-center rounded-sm text-sm font-semibold ${kind === 'staff' ? 'bg-accent' : 'bg-blush'}`}>
            {m.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 font-medium">
              {m.name}
              {m.id === me?.id && <Badge>You</Badge>}
            </div>
            <div className="truncate font-mono text-xs text-muted">{m.email}</div>
          </div>
          {m.phone && <div className="font-mono text-xs text-muted">{m.phone}</div>}
        </li>
      ))}
    </ul>
  );
}

function AddMemberForm({ kind }: { kind: Kind }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const copy = COPY[kind];

  const create = useMutation({
    mutationFn: (input: CreateTeamMemberInput) => api<TeamMember>(`/center/${kind}`, { method: 'POST', body: input }),
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: queryKey(kind) });
      setForm(EMPTY_FORM);
      setJustAdded(member.email);
    },
    onError: (err) => setErrors(fieldErrorsOf(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setJustAdded(null);
    const result = validate(createTeamMemberSchema, form);
    setErrors(result.errors ?? {});
    if (result.data) create.mutate(result.data);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormError message={create.error?.message} />
      {justAdded && (
        <p role="status" className="rounded-sm bg-accent px-4 py-3 text-sm">
          Added. They can now sign in as <span className="font-mono">{justAdded}</span>.
        </p>
      )}
      <TextField label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
      <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
      <TextField label="Phone (optional)" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint={`At least 8 characters. Share it with the ${copy.singular}.`}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        error={errors.password}
      />
      <Button type="submit" className="w-full" loading={create.isPending}>
        Add {copy.singular}
      </Button>
    </form>
  );
}

export function TeamPage() {
  const [kind, setKind] = useState<Kind>('technicians');
  return (
    <>
      <PageHeader title="Team" subtitle="Accounts for your center. Each person signs in with the email and password you set." />
      <div className="grid items-start gap-6 md:grid-cols-[7fr_5fr]">
        <div className="space-y-6">
          {(['technicians', 'staff'] as const).map((k) => (
            <Card key={k} padded={false} className="animate-fade-up overflow-hidden">
              <div className="px-6 pt-6 pb-3">
                <h2 className="text-lg font-bold">{COPY[k].title}</h2>
                <p className="text-sm text-muted">{COPY[k].hint}</p>
              </div>
              <div className="border-t border-line/70">
                <MemberList kind={k} />
              </div>
            </Card>
          ))}
        </div>
        <Card className="animate-fade-up [animation-delay:80ms]">
          <h2 className="mb-4 flex items-center gap-2 text-[1.5rem] font-bold">
            <UserPlus className="size-5" aria-hidden />
            Add someone
          </h2>
          <fieldset className="mb-5">
            <legend className="mb-2 text-sm font-medium tracking-wide">Account type</legend>
            <div className="grid grid-cols-2 gap-2">
              {(['technicians', 'staff'] as const).map((k) => (
                <label
                  key={k}
                  className={
                    'cursor-pointer rounded-sm px-3 py-2 text-center text-sm transition-[box-shadow,background-color] duration-200 ' +
                    'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-strong ' +
                    (kind === k ? 'bg-accent font-medium shadow-neu-inset' : 'bg-surface shadow-neu-sm hover:bg-surface-raised')
                  }
                >
                  <input type="radio" name="kind" className="sr-only" checked={kind === k} onChange={() => setKind(k)} />
                  {k === 'technicians' ? 'Technician' : 'Staff'}
                </label>
              ))}
            </div>
          </fieldset>
          <AddMemberForm key={kind} kind={kind} />
        </Card>
      </div>
    </>
  );
}
