export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={
        'animate-shimmer rounded-sm bg-[linear-gradient(90deg,#e1e1e3_25%,#efeff1_50%,#e1e1e3_75%)] bg-[length:200%_100%] ' +
        className
      }
    />
  );
}
