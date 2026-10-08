import Link from 'next/link'
import { tools, CATEGORY_ORDER, toolsByCategory, type Category } from '@/lib/tools'
import { categoryHref } from '@/lib/hubs'

export type CategoryFilter = 'All' | Category

interface Props {
  active: CategoryFilter
  /** Homepage: filter in place. Omit on other pages to render links (hub page or /?cat=). */
  onSelect?: (c: CategoryFilter) => void
}

const ITEMS: CategoryFilter[] = ['All', ...CATEGORY_ORDER]

// Category sidebar (desktop) / swipeable chip row (phones — CSS only).
export default function CategoryNav({ active, onSelect }: Props) {
  return (
    <nav className="cat-nav" aria-label="Categories">
      <ul>
        {ITEMS.map((c) => {
          const isActive = active === c
          const cls = `cat-nav-item${isActive ? ' active' : ''}`
          const inner = (
            <>
              <span>{c === 'All' ? 'All tools' : c}</span>
              <em>{c === 'All' ? tools.length : toolsByCategory(c).length}</em>
            </>
          )
          return (
            <li key={c}>
              {onSelect ? (
                <button
                  type="button"
                  className={cls}
                  aria-pressed={isActive}
                  onClick={() => onSelect(c)}
                >
                  {inner}
                </button>
              ) : (
                <Link
                  className={cls}
                  href={c === 'All' ? '/' : categoryHref(c)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {inner}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
