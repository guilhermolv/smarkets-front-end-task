import './LoginCopy.scss';

export function LoginCopy() {
  return (
    <section className="panel login-copy">
      <p className="section-label">Live exchange data</p>
      <h2>Markets, contracts and prices through a secure proxy.</h2>
      <p>
        Sign in once, then browse upcoming events, inspect event markets and follow bid, ask and last-traded movement
        without exposing the Smarkets session token to the browser.
      </p>
      <div className="feature-list">
        <span>HTTP-only local session</span>
        <span>Validated API responses</span>
        <span>Polling price trends</span>
      </div>
    </section>
  );
}
