'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { tools } from '@/lib/tools'

interface Props {
  /** Homepage only: controlled search that filters the deck live. */
  query?: string
  setQuery?: (q: string) => void
  /** Where a search from another page goes. Injectable for tests. */
  navigate?: (url: string) => void
}

const goTo = (url: string) => window.location.assign(url)

/** True when a keystroke is going into a text field or rich editor. */
export function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  if (/^(input|textarea|select)$/i.test(el.tagName)) return true
  return el.closest('[contenteditable]:not([contenteditable="false"])') !== null
}

// Site-wide header: brand, search, links. On the homepage the search is
// controlled and filters live; elsewhere it opens /#q=<term>. The term goes in
// the URL fragment, which browsers never send to a server.
export default function SiteHeader({ query, setQuery, navigate = goTo }: Props) {
  const live = tools.filter((t) => t.status !== 'maintenance').length
  const rounded = Math.floor(live / 10) * 10
  const inputRef = useRef<HTMLInputElement>(null)

  // Press "/" anywhere (when not already typing) to jump to search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="site-header">
      <div className="shell site-header-row">
        <Link href="/" className="brand" aria-label="dauntexlabs home">
          dauntex<b>labs</b>
        </Link>

        <form
          className="site-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            if (setQuery) return
            const q = inputRef.current?.value.trim() ?? ''
            navigate(q ? `/#q=${encodeURIComponent(q)}` : '/')
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            {...(setQuery
              ? { value: query ?? '', onChange: (e) => setQuery(e.target.value) }
              : {})}
            placeholder={`Search ${rounded}+ tools — pdf, bmi, json…`}
            aria-label="Search tools"
            autoComplete="off"
            spellCheck={false}
          />
          {setQuery && query ? (
            <button
              type="button"
              className="site-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear"
            >
              ✕
            </button>
          ) : (
            <kbd className="site-search-kbd" aria-hidden>
              /
            </kbd>
          )}
        </form>

        <nav className="site-links" aria-label="Site">
          <Link href="/">All tools</Link>
          <Link href="/convert/">Conversions</Link>
          <Link href="/privacy/">Privacy</Link>
        </nav>
      </div>
    </header>
  )
}
