import type { FormEvent } from 'react';
import { LoginForm } from '../LoginForm';
import { Notice } from '../Notice';
import './AuthSection.scss';

type AuthSectionProps = {
  formError: string | null;
  isLoggingIn: boolean;
  verificationRequired: boolean;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
};

export function AuthSection({ formError, isLoggingIn, verificationRequired, onLogin }: AuthSectionProps) {
  if (verificationRequired) {
    return (
      <section className="auth-layout">
        <Notice error>
          Smarkets accepted the credentials but requires another verification step. TOTP is not completed in this task.
        </Notice>
      </section>
    );
  }

  return (
    <section className="auth-layout">
      <LoginForm formError={formError} isLoggingIn={isLoggingIn} onSubmit={onLogin} />
    </section>
  );
}
