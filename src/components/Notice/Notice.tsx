import type { ReactNode } from 'react';
import './Notice.scss';

type NoticeProps = {
  children: ReactNode;
  className?: string;
  error?: boolean;
  role?: string;
};

export function Notice({ children, className, error, role }: NoticeProps) {
  const classes = ['notice', error ? 'error' : null, className].filter(Boolean).join(' ');

  return (
    <p className={classes} role={role ?? (error ? 'alert' : undefined)}>
      {children}
    </p>
  );
}
