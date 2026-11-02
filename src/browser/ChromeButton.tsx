import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'type'> & {
  label: string;
  children: ReactNode;
};

/** A small square icon button in the browser chrome, named for screen readers and on hover. */
export default function ChromeButton({ label, className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.07] hover:text-ink disabled:pointer-events-none disabled:opacity-30 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
