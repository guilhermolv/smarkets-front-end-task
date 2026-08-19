import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('marks email and password as required', () => {
    render(<LoginForm formError={null} isLoggingIn={false} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Password')).toBeRequired();
  });

  it('announces form errors to assistive tech', () => {
    render(<LoginForm formError="The username or password was not accepted by Smarkets." isLoggingIn={false} onSubmit={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('The username or password was not accepted by Smarkets.');
  });
});
