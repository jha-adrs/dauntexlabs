'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// Each tool is a client-only island, lazy-loaded so one tool's code never
// bloats another page. The server page (app/tools/[slug]/page.tsx) still
// renders the SEO content (title, description, headline) statically.
const loading = () => <div className="tool-loading">initialising module…</div>

const REGISTRY: Record<string, ComponentType> = {
  // Utilities
  'list-utilities': dynamic(() => import('@/components/tools/ListUtilities'), { ssr: false, loading }),
  'string-utilities': dynamic(() => import('@/components/tools/StringUtilities'), { ssr: false, loading }),
  'case-converter': dynamic(() => import('@/components/tools/CaseConverter'), { ssr: false, loading }),
  // Converters
  'csv-to-json': dynamic(() => import('@/components/tools/CsvToJson'), { ssr: false, loading }),
  'json-to-csv': dynamic(() => import('@/components/tools/JsonToCsv'), { ssr: false, loading }),
  'text-to-csv': dynamic(() => import('@/components/tools/TextToCsv'), { ssr: false, loading }),
  'json-object-to-csv': dynamic(() => import('@/components/tools/JsonObjectToCsv'), { ssr: false, loading }),
  'json-pivot': dynamic(() => import('@/components/tools/JsonPivot'), { ssr: false, loading }),
  'sql-to-csv': dynamic(() => import('@/components/tools/SqlToCsv'), { ssr: false, loading }),
  'data-picker': dynamic(() => import('@/components/tools/DataPicker'), { ssr: false, loading }),
  // Formatters
  'code-formatter': dynamic(() => import('@/components/tools/CodeFormatter'), { ssr: false, loading }),
  'json-formatter': dynamic(() => import('@/components/tools/JsonFormatter'), { ssr: false, loading }),
  // Generators
  'random-data': dynamic(() => import('@/components/tools/RandomData'), { ssr: false, loading }),
  'hash-generator': dynamic(() => import('@/components/tools/HashGenerator'), { ssr: false, loading }),
  'uuid-generator': dynamic(() => import('@/components/tools/UuidGenerator'), { ssr: false, loading }),
  'timestamp-converter': dynamic(() => import('@/components/tools/TimestampConverter'), { ssr: false, loading }),
  'file-generators': dynamic(() => import('@/components/tools/FileGenerators'), { ssr: false, loading }),
  // Data Tools
  base64: dynamic(() => import('@/components/tools/Base64'), { ssr: false, loading }),
  'url-encode-decode': dynamic(() => import('@/components/tools/UrlEncodeDecode'), { ssr: false, loading }),
  'jwt-tool': dynamic(() => import('@/components/tools/JwtTool'), { ssr: false, loading }),
  'file-viewer': dynamic(() => import('@/components/tools/FileViewer'), { ssr: false, loading }),
  encryption: dynamic(() => import('@/components/tools/Encryption'), { ssr: false, loading }),
  // Image Tools (native Canvas)
  'image-compressor': dynamic(() => import('@/components/tools/ImageCompressor'), { ssr: false, loading }),
  'image-converter': dynamic(() => import('@/components/tools/ImageConverter'), { ssr: false, loading }),
  'image-resizer': dynamic(() => import('@/components/tools/ImageResizer'), { ssr: false, loading }),
  'image-to-base64': dynamic(() => import('@/components/tools/ImageToBase64'), { ssr: false, loading }),
  'favicon-generator': dynamic(() => import('@/components/tools/FaviconGenerator'), { ssr: false, loading }),
  // PDF Tools (bundled pdf-lib, lazy)
  'merge-pdf': dynamic(() => import('@/components/tools/MergePdf'), { ssr: false, loading }),
  'split-pdf': dynamic(() => import('@/components/tools/SplitPdf'), { ssr: false, loading }),
  'organize-pdf': dynamic(() => import('@/components/tools/OrganizePdf'), { ssr: false, loading }),
  'images-to-pdf': dynamic(() => import('@/components/tools/ImagesToPdf'), { ssr: false, loading }),
  // pdf-to-images is under maintenance (heavy pdf.js) — no component mounted
  // Converters
  'unit-converter': dynamic(() => import('@/components/tools/UnitConverter'), { ssr: false, loading }),
  'number-base-converter': dynamic(() => import('@/components/tools/NumberBaseConverter'), { ssr: false, loading }),
  'timezone-converter': dynamic(() => import('@/components/tools/TimezoneConverter'), { ssr: false, loading }),
  // Generators
  'password-generator': dynamic(() => import('@/components/tools/PasswordGenerator'), { ssr: false, loading }),
  'qr-code-generator': dynamic(() => import('@/components/tools/QrCodeGenerator'), { ssr: false, loading }),
  'lorem-ipsum': dynamic(() => import('@/components/tools/LoremIpsum'), { ssr: false, loading }),
}

export default function ToolMount({ slug }: { slug: string }) {
  const Tool = REGISTRY[slug]
  if (!Tool) {
    return (
      <div className="tool-loading">this module is not available yet — check back soon.</div>
    )
  }
  return (
    <div className="tool">
      <Tool />
    </div>
  )
}
