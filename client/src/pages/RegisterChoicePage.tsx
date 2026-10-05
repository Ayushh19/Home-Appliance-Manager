import { ChevronRight, House, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import { AuthLayout } from '../layouts/AuthLayout';

const OPTIONS = [
  {
    to: '/register/customer',
    icon: House,
    title: 'I own a home',
    description: 'Keep track of your appliances, warranties, maintenance and service history.',
  },
  {
    to: '/register/service-center',
    icon: Wrench,
    title: 'I run a service center',
    description: 'Receive service requests from customers and assign them to your technicians.',
  },
];

export function RegisterChoicePage() {
  return (
    <AuthLayout
      title="Create an account"
      subtitle="Technician accounts are created by their service center, so technicians don't need to register."
    >
      <div className="mx-auto w-full max-w-md space-y-4">
        {OPTIONS.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className={
              'flex items-center gap-4 rounded-sm bg-surface p-5 shadow-neu transition-[box-shadow,transform] duration-200 ' +
              'ease-out hover:-translate-y-0.5 active:translate-y-px active:shadow-neu-inset active:duration-150'
            }
          >
            <div className="grid size-12 shrink-0 place-items-center rounded-sm bg-accent">
              <Icon className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{title}</div>
              <div className="text-sm text-muted">{description}</div>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
          </Link>
        ))}
        <p className="pt-2 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ink underline decoration-accent-strong underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
