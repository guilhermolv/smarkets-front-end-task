import type { LoginResponse, SessionResponse } from '../../lib/schemas';
import './SessionPanel.scss';

type SessionPanelProps = {
  session: LoginResponse | SessionResponse;
  isLoggingOut: boolean;
  onLogout: () => void;
};

export function SessionPanel({ session, isLoggingOut, onLogout }: SessionPanelProps) {
  return (
    <section className="panel session-panel" aria-live="polite">
      <div className="session-header">
        <p className="section-label">Session state</p>
        <button className="secondary-button" type="button" onClick={onLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Logging out...' : 'Log out'}
        </button>
      </div>
      <h2>{session.status === 'authenticated' ? 'Authenticated' : 'Verification required'}</h2>
      <p>{session.message}</p>
      <dl className="health-grid session-grid">
        <div>
          <dt>Factor</dt>
          <dd>{session.factor ?? 'complete'}</dd>
        </div>
        <div>
          <dt>Token expiry</dt>
          <dd>{session.expiresAt ? new Date(session.expiresAt).toLocaleString() : 'Not supplied'}</dd>
        </div>
      </dl>
    </section>
  );
}
