/** A calm Arabic screen instead of a blank page when a screen fails to render; one tap back to the events. */
import { Component, type ReactNode } from 'react';

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(error: unknown) { console.error('[doyofy] screen failed to render', error); }
  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="app-crash" role="alert">
        <h1>حدث خلل في عرض هذه الصفحة.</h1>
        <p>بياناتك محفوظة على هذا الجهاز. ارجع إلى مناسباتك وجرّب مرة أخرى.</p>
        <a className="btn btn-primary" href="/app/events" onClick={() => this.setState({ failed: false })}>العودة إلى مناسباتي</a>
      </main>
    );
  }
}
