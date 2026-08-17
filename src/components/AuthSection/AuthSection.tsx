import type { FormEvent } from 'react';
import type { LoginResponse, SessionResponse } from '../../lib/schemas';
import { LoginCopy } from '../LoginCopy';
import { LoginForm } from '../LoginForm';
import { SessionPanel } from '../SessionPanel';
import './AuthSection.scss';

type AuthSectionProps = {
  activeSession: LoginResponse | SessionResponse | null;
  formError: string | null;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
};

export function AuthSection({ activeSession, formError, isLoggingIn, isLoggingOut, onLogin, onLogout }: AuthSectionProps) {
  return (
    <section className={activeSession ? 'auth-layout auth-layout-compact' : 'auth-layout'}>
      {!activeSession ? <LoginForm formError={formError} isLoggingIn={isLoggingIn} onSubmit={onLogin} /> : null}

      {!activeSession ? (
        <LoginCopy />
      ) : (
        <SessionPanel session={activeSession} isLoggingOut={isLoggingOut} onLogout={onLogout} />
      )}
    </section>
  );
}
