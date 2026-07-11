// Server component: emits a JSON-LD <script> for structured data (SEO).
// Rendered into the static HTML at build time.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
