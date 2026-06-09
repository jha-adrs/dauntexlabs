import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell foot-row">
        <span className="brand sm">
          <span className="mark">◇</span> dauntex<b>labs</b>
        </span>
        <p className="foot-note">
          all computation performed locally · no telemetry · open for public use
        </p>
        <span className="foot-meta">
          <Link href="/privacy/" className="foot-link">
            privacy
          </Link>
          <span className="foot-sep">·</span>© 2026 · build proto-0.1
        </span>
      </div>
    </footer>
  )
}
