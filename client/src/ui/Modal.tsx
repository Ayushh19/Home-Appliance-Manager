import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

/** Native <dialog> (focus trap, Esc to close, top layer). Renders nothing when closed. */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="modal-title"
      className={
        'm-auto w-[calc(100%-2rem)] max-w-lg animate-fade-up rounded-sm border border-white/60 bg-surface p-0 text-ink ' +
        'shadow-card backdrop:bg-ink/30 backdrop:backdrop-blur-[2px]'
      }
    >
      <div className="flex items-center justify-between gap-4 px-6 pt-6 sm:px-8">
        <h2 id="modal-title" className="text-[1.5rem] font-bold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-9 place-items-center rounded-sm text-muted transition-colors duration-200 hover:bg-surface-raised"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="px-6 pt-5 pb-6 sm:px-8 sm:pb-8">{children}</div>
    </dialog>
  );
}
