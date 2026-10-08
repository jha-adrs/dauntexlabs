import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell foot-row">
        <span className="brand sm">
          dauntex<b>labs</b>
        </span>
        <p className="foot-note">
          Your tool data is designed to stay on your device. Free for personal and public use.
        </p>
        <nav className="foot-meta" aria-label="Footer">
          <Link href="/" className="foot-link">
            All tools
          </Link>
          <Link href="/category/india/" className="foot-link">
            India tools
          </Link>
          <Link href="/category/aviation/" className="foot-link">
            Aviation tools
          </Link>
          <Link href="/convert/" className="foot-link">
            Conversions
          </Link>
          <Link href="/privacy/" className="foot-link">
            Privacy
          </Link>
          <span>© 2026</span>
        </nav>
      </div>
    </footer>
  )
}
