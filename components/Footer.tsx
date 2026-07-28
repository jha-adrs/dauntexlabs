import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell foot-row">
        <span className="brand sm">
          <span className="mark">◇</span> dauntex<b>labs</b>
        </span>
        <p className="foot-note">
          your tool data stays on your device · open for personal and public use
        </p>
        <span className="foot-meta">
          <Link href="/" className="foot-link">
            tools
          </Link>
          <span className="foot-sep">·</span>
          <Link href="/convert/" className="foot-link">
            conversions
          </Link>
          <span className="foot-sep">·</span>
          <Link href="/privacy/" className="foot-link">
            privacy
          </Link>
          <span className="foot-sep">·</span>© 2026
        </span>
      </div>
    </footer>
  )
}
