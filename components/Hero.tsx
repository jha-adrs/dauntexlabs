import { tools } from '@/lib/tools'

// Plain-English intro above the tool grid. Privacy wording stays hedged
// ("designed to run on your device") — see CLAUDE.md › Privacy.
export default function Hero() {
  const live = tools.filter((t) => t.status !== 'maintenance').length
  const rounded = Math.floor(live / 10) * 10 // 106 → 100

  return (
    <section className="hero">
      <h1>Free online tools that run in your browser.</h1>
      <p className="lede">
        {rounded}+ tools for PDFs, images, text, code and everyday maths — designed to run on your
        device. No sign-up.
      </p>
    </section>
  )
}
