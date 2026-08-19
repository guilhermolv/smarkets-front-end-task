import type { FormEvent } from 'react';
import { Notice } from '../Notice';
import './LoginForm.scss';

type LoginFormProps = {
  formError: string | null;
  isLoggingIn: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginForm({ formError, isLoggingIn, onSubmit }: LoginFormProps) {
  return (
    <form className="panel login-panel" onSubmit={onSubmit}>
      <div>
        <p className="section-label">Smarkets account</p>
        <h2>Log in</h2>
      </div>

      <label>
        Email
        <input name="username" type="email" autoComplete="username" placeholder="you@example.com" required />
      </label>

      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>

      {formError ? (
        <Notice error role="alert">
          {formError}
        </Notice>
      ) : null}

      <button type="submit" disabled={isLoggingIn}>
        {isLoggingIn ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  );
}
