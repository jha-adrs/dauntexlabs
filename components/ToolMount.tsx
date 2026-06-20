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
  // Text Tools
  'word-counter': dynamic(() => import('@/components/tools/WordCounter'), { ssr: false, loading }),
  'slug-generator': dynamic(() => import('@/components/tools/SlugGenerator'), { ssr: false, loading }),
  'text-diff': dynamic(() => import('@/components/tools/TextDiff'), { ssr: false, loading }),
  'morse-code': dynamic(() => import('@/components/tools/MorseCode'), { ssr: false, loading }),
  // Web & CSS
  'color-converter': dynamic(() => import('@/components/tools/ColorConverter'), { ssr: false, loading }),
  'contrast-checker': dynamic(() => import('@/components/tools/ContrastChecker'), { ssr: false, loading }),
  'css-gradient': dynamic(() => import('@/components/tools/CssGradient'), { ssr: false, loading }),
  'html-entities': dynamic(() => import('@/components/tools/HtmlEntities'), { ssr: false, loading }),
  // Utilities (batch 3)
  'regex-tester': dynamic(() => import('@/components/tools/RegexTester'), { ssr: false, loading }),
  'cron-explainer': dynamic(() => import('@/components/tools/CronExplainer'), { ssr: false, loading }),
  'cidr-calculator': dynamic(() => import('@/components/tools/CidrCalculator'), { ssr: false, loading }),
  'chmod-calculator': dynamic(() => import('@/components/tools/ChmodCalculator'), { ssr: false, loading }),
  // Converters (batch 3)
  'json-to-typescript': dynamic(() => import('@/components/tools/JsonToTypescript'), { ssr: false, loading }),
  'env-to-json': dynamic(() => import('@/components/tools/EnvToJson'), { ssr: false, loading }),
  'roman-numerals': dynamic(() => import('@/components/tools/RomanNumerals'), { ssr: false, loading }),
  'number-to-words': dynamic(() => import('@/components/tools/NumberToWords'), { ssr: false, loading }),
  // Formatters / Generators (batch 3)
  'sql-formatter': dynamic(() => import('@/components/tools/SqlFormatter'), { ssr: false, loading }),
  'markdown-table': dynamic(() => import('@/components/tools/MarkdownTable'), { ssr: false, loading }),
  // Developer (batch 4)
  'ulid-generator': dynamic(() => import('@/components/tools/UlidGenerator'), { ssr: false, loading }),
  'base58-base32': dynamic(() => import('@/components/tools/Base58Base32'), { ssr: false, loading }),
  'json-diff': dynamic(() => import('@/components/tools/JsonDiff'), { ssr: false, loading }),
  'query-string-to-json': dynamic(() => import('@/components/tools/QueryStringToJson'), { ssr: false, loading }),
  'url-parser': dynamic(() => import('@/components/tools/UrlParser'), { ssr: false, loading }),
  'json-to-go': dynamic(() => import('@/components/tools/JsonToGo'), { ssr: false, loading }),
  'box-shadow-generator': dynamic(() => import('@/components/tools/BoxShadowGenerator'), { ssr: false, loading }),
  'border-radius-generator': dynamic(() => import('@/components/tools/BorderRadiusGenerator'), { ssr: false, loading }),
  'gitignore-generator': dynamic(() => import('@/components/tools/GitignoreGenerator'), { ssr: false, loading }),
  // Business & Finance (batch 4)
  'loan-calculator': dynamic(() => import('@/components/tools/LoanCalculator'), { ssr: false, loading }),
  'compound-interest': dynamic(() => import('@/components/tools/CompoundInterest'), { ssr: false, loading }),
  'percentage-calculator': dynamic(() => import('@/components/tools/PercentageCalculator'), { ssr: false, loading }),
  'margin-calculator': dynamic(() => import('@/components/tools/MarginCalculator'), { ssr: false, loading }),
  'sales-tax-calculator': dynamic(() => import('@/components/tools/SalesTaxCalculator'), { ssr: false, loading }),
  'discount-calculator': dynamic(() => import('@/components/tools/DiscountCalculator'), { ssr: false, loading }),
  'break-even-calculator': dynamic(() => import('@/components/tools/BreakEvenCalculator'), { ssr: false, loading }),
  'roi-calculator': dynamic(() => import('@/components/tools/RoiCalculator'), { ssr: false, loading }),
  'tip-calculator': dynamic(() => import('@/components/tools/TipCalculator'), { ssr: false, loading }),
  // Education (batch 5)
  'gpa-calculator': dynamic(() => import('@/components/tools/GpaCalculator'), { ssr: false, loading }),
  'grade-calculator': dynamic(() => import('@/components/tools/GradeCalculator'), { ssr: false, loading }),
  'statistics-calculator': dynamic(() => import('@/components/tools/StatisticsCalculator'), { ssr: false, loading }),
  'fraction-calculator': dynamic(() => import('@/components/tools/FractionCalculator'), { ssr: false, loading }),
  'quadratic-solver': dynamic(() => import('@/components/tools/QuadraticSolver'), { ssr: false, loading }),
  'citation-generator': dynamic(() => import('@/components/tools/CitationGenerator'), { ssr: false, loading }),
  'readability-score': dynamic(() => import('@/components/tools/ReadabilityScore'), { ssr: false, loading }),
  'random-name-picker': dynamic(() => import('@/components/tools/RandomNamePicker'), { ssr: false, loading }),
  // Health & Fitness (batch 5)
  'bmi-calculator': dynamic(() => import('@/components/tools/BmiCalculator'), { ssr: false, loading }),
  'calorie-calculator': dynamic(() => import('@/components/tools/CalorieCalculator'), { ssr: false, loading }),
  'pace-calculator': dynamic(() => import('@/components/tools/PaceCalculator'), { ssr: false, loading }),
  'water-intake': dynamic(() => import('@/components/tools/WaterIntake'), { ssr: false, loading }),
  // Everyday (batch 5)
  'age-calculator': dynamic(() => import('@/components/tools/AgeCalculator'), { ssr: false, loading }),
  'date-difference': dynamic(() => import('@/components/tools/DateDifference'), { ssr: false, loading }),
  'date-calculator': dynamic(() => import('@/components/tools/DateCalculator'), { ssr: false, loading }),
  'random-number-generator': dynamic(() => import('@/components/tools/RandomNumberGenerator'), { ssr: false, loading }),
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
