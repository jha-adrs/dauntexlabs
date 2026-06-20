// Single source of truth for every tool.
// The homepage, category index, search, per-tool pages, sitemap and robots
// all derive from this array. Add a tool here first, then build its page/component.

export type Category =
  | 'Utilities'
  | 'Converters'
  | 'Formatters'
  | 'Generators'
  | 'Data Tools'
  | 'Image Tools'
  | 'PDF Tools'
  | 'Text Tools'
  | 'Web & CSS'

export interface Tool {
  /** url segment: /tools/<slug> */
  slug: string
  name: string
  category: Category
  /** one-line description shown on the card + used as the page meta description */
  blurb: string
  /** search + SEO keywords */
  keywords: string[]
  /** 'maintenance' renders an "under maintenance" page instead of the tool body */
  status?: 'live' | 'maintenance'
}

export const CATEGORY_ORDER: Category[] = [
  'Utilities',
  'Converters',
  'Formatters',
  'Generators',
  'Data Tools',
  'Image Tools',
  'PDF Tools',
  'Text Tools',
  'Web & CSS',
]

/** short instrument-style code per category, used in labels */
export const CATEGORY_CODE: Record<Category, string> = {
  Utilities: 'UTL',
  Converters: 'CNV',
  Formatters: 'FMT',
  Generators: 'GEN',
  'Data Tools': 'DAT',
  'Image Tools': 'IMG',
  'PDF Tools': 'PDF',
  'Text Tools': 'TXT',
  'Web & CSS': 'WEB',
}

export const tools: Tool[] = [
  // ── Utilities ──────────────────────────────────────────────
  {
    slug: 'list-utilities',
    name: 'List Utilities',
    category: 'Utilities',
    blurb: 'Union, intersection, flatten, dedupe, sort and filter lists — line by line.',
    keywords: ['list', 'set', 'union', 'intersection', 'dedupe', 'sort', 'filter'],
  },
  {
    slug: 'string-utilities',
    name: 'String Utilities',
    category: 'Utilities',
    blurb: 'Match, transform, run regex and analyse strings in a single pass.',
    keywords: ['string', 'regex', 'transform', 'replace', 'analyse'],
  },
  {
    slug: 'case-converter',
    name: 'Case Converter',
    category: 'Utilities',
    blurb: 'Switch between camelCase, snake_case, PascalCase, kebab-case and more.',
    keywords: ['case', 'camel', 'snake', 'pascal', 'kebab', 'naming'],
  },

  // ── Converters ─────────────────────────────────────────────
  {
    slug: 'csv-to-json',
    name: 'CSV to JSON',
    category: 'Converters',
    blurb: 'Turn CSV data into clean JSON arrays with automatic type inference.',
    keywords: ['csv', 'json', 'convert', 'parse', 'type inference'],
  },
  {
    slug: 'json-to-csv',
    name: 'JSON to CSV',
    category: 'Converters',
    blurb: 'Flatten nested JSON arrays into spreadsheet-ready CSV.',
    keywords: ['json', 'csv', 'flatten', 'export', 'spreadsheet'],
  },
  {
    slug: 'text-to-csv',
    name: 'Text to CSV',
    category: 'Converters',
    blurb: 'Reshape raw text into CSV with any delimiter — comma, tab, newline.',
    keywords: ['text', 'csv', 'delimiter', 'tab', 'split'],
  },
  {
    slug: 'json-object-to-csv',
    name: 'JSON Object to CSV',
    category: 'Converters',
    blurb: 'Map key–value objects and data pairs straight to CSV rows.',
    keywords: ['json', 'object', 'csv', 'key value', 'pairs'],
  },
  {
    slug: 'json-pivot',
    name: 'JSON Pivot',
    category: 'Converters',
    blurb: 'Pivot and transpose JSON arrays around the key fields you pick.',
    keywords: ['json', 'pivot', 'transpose', 'reshape'],
  },
  {
    slug: 'sql-to-csv',
    name: 'SQL to CSV',
    category: 'Converters',
    blurb: 'Export SQL result sets to CSV or rebuild INSERT statements.',
    keywords: ['sql', 'csv', 'insert', 'query', 'export'],
  },
  {
    slug: 'data-picker',
    name: 'Data Picker',
    category: 'Converters',
    blurb: 'Pull specific fields and columns out of CSV, JSON, TSV and YAML.',
    keywords: ['extract', 'fields', 'csv', 'json', 'tsv', 'yaml'],
  },

  // ── Formatters ─────────────────────────────────────────────
  {
    slug: 'code-formatter',
    name: 'Code Formatter',
    category: 'Formatters',
    blurb: 'Format, minify and prettify code with live syntax highlighting.',
    keywords: ['format', 'minify', 'prettify', 'beautify', 'highlight'],
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    category: 'Formatters',
    blurb: 'Validate, beautify and minify JSON — including loose JS objects.',
    keywords: ['json', 'format', 'validate', 'minify', 'stringify'],
  },

  // ── Generators ─────────────────────────────────────────────
  {
    slug: 'random-data',
    name: 'Random Data',
    category: 'Generators',
    blurb: 'Spin up random strings, words, names, emails, numbers and JSON.',
    keywords: ['random', 'mock', 'fake', 'name', 'email', 'json'],
  },
  {
    slug: 'hash-generator',
    name: 'Hash Generator',
    category: 'Generators',
    blurb: 'Compute SHA-256, SHA-512, MD5 and more, entirely on-device.',
    keywords: ['hash', 'sha256', 'sha512', 'md5', 'checksum'],
  },
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    category: 'Generators',
    blurb: 'Mint RFC-4122 UUID v4 identifiers on demand.',
    keywords: ['uuid', 'guid', 'v4', 'identifier', 'random'],
  },
  {
    slug: 'timestamp-converter',
    name: 'Timestamp Converter',
    category: 'Generators',
    blurb: 'Translate Unix timestamps to human-readable dates and back.',
    keywords: ['timestamp', 'unix', 'epoch', 'date', 'time'],
  },
  {
    slug: 'file-generators',
    name: 'File Generators',
    category: 'Generators',
    blurb: 'Produce sample CSV, JSON, XML, HTML, markdown and image files.',
    keywords: ['file', 'sample', 'csv', 'json', 'xml', 'image', 'markdown'],
  },

  // ── Data Tools ─────────────────────────────────────────────
  {
    slug: 'base64',
    name: 'Base64 Encode / Decode',
    category: 'Data Tools',
    blurb: 'Encode and decode Base64 strings with built-in validation.',
    keywords: ['base64', 'encode', 'decode', 'btoa', 'atob'],
  },
  {
    slug: 'url-encode-decode',
    name: 'URL Encode / Decode',
    category: 'Data Tools',
    blurb: 'Percent-encode URLs and untangle query parameters.',
    keywords: ['url', 'encode', 'decode', 'percent', 'query'],
  },
  {
    slug: 'jwt-tool',
    name: 'JWT / JWS Token Tool',
    category: 'Data Tools',
    blurb: 'Decode, verify and sign JWT / JWS with HS256, HS384 and HS512.',
    keywords: ['jwt', 'jws', 'token', 'sign', 'verify', 'decode'],
  },
  {
    slug: 'file-viewer',
    name: 'File Viewer & Previewer',
    category: 'Data Tools',
    blurb: 'Preview Markdown, HTML, JSON, XML, CSV and YAML in real time.',
    keywords: ['viewer', 'preview', 'markdown', 'html', 'json', 'yaml'],
  },
  {
    slug: 'encryption',
    name: 'Encryption & Decryption',
    category: 'Data Tools',
    blurb: 'AES, PGP/RSA, HMAC, SHA, ROT13 and Caesar — all client-side.',
    keywords: ['encrypt', 'decrypt', 'aes', 'pgp', 'rsa', 'hmac', 'cipher'],
  },

  // ── Image Tools (native Canvas, no libraries) ──────────────
  {
    slug: 'image-compressor',
    name: 'Image Compressor',
    category: 'Image Tools',
    blurb: 'Shrink JPG, PNG and WebP images in your browser — no upload, no quality sent anywhere.',
    keywords: ['image', 'compress', 'compressor', 'optimize', 'jpg', 'png', 'webp'],
  },
  {
    slug: 'image-converter',
    name: 'Image Converter',
    category: 'Image Tools',
    blurb: 'Convert images between PNG, JPG and WebP locally on your device.',
    keywords: ['image', 'convert', 'png', 'jpg', 'jpeg', 'webp', 'format'],
  },
  {
    slug: 'image-resizer',
    name: 'Image Resizer',
    category: 'Image Tools',
    blurb: 'Resize and crop images in your browser, with no upload.',
    keywords: ['image', 'resize', 'crop', 'scale', 'dimensions'],
  },
  {
    slug: 'image-to-base64',
    name: 'Image to Base64',
    category: 'Image Tools',
    blurb: 'Turn an image into a Base64 data-URI for inline embedding.',
    keywords: ['image', 'base64', 'data uri', 'inline', 'encode'],
  },
  {
    slug: 'favicon-generator',
    name: 'Favicon Generator',
    category: 'Image Tools',
    blurb: 'Generate favicon PNGs and a multi-size .ico from any image.',
    keywords: ['favicon', 'ico', 'icon', 'generator', 'image'],
  },

  // ── PDF Tools (bundled pdf-lib, lazy-loaded) ───────────────
  {
    slug: 'merge-pdf',
    name: 'Merge PDF',
    category: 'PDF Tools',
    blurb: 'Combine multiple PDF files into one — entirely in your browser.',
    keywords: ['pdf', 'merge', 'combine', 'join'],
  },
  {
    slug: 'split-pdf',
    name: 'Split PDF',
    category: 'PDF Tools',
    blurb: 'Split a PDF or extract page ranges, locally on your device.',
    keywords: ['pdf', 'split', 'extract', 'pages', 'separate'],
  },
  {
    slug: 'organize-pdf',
    name: 'Organize PDF',
    category: 'PDF Tools',
    blurb: 'Reorder, rotate and delete PDF pages in your browser.',
    keywords: ['pdf', 'organize', 'reorder', 'rotate', 'delete', 'pages'],
  },
  {
    slug: 'images-to-pdf',
    name: 'Images to PDF',
    category: 'PDF Tools',
    blurb: 'Combine JPG and PNG images into a single PDF document.',
    keywords: ['images', 'pdf', 'jpg', 'png', 'convert', 'combine'],
  },
  {
    slug: 'pdf-to-images',
    name: 'PDF to Images',
    category: 'PDF Tools',
    blurb: 'Render PDF pages to PNG images, all on your device.',
    keywords: ['pdf', 'images', 'png', 'convert', 'render'],
    status: 'maintenance',
  },

  // ── Converters (pure JS) ───────────────────────────────────
  {
    slug: 'unit-converter',
    name: 'Unit Converter',
    category: 'Converters',
    blurb: 'Convert length, mass, temperature, data, speed, area and more.',
    keywords: ['unit', 'converter', 'length', 'weight', 'temperature', 'metric', 'imperial'],
  },
  {
    slug: 'number-base-converter',
    name: 'Number Base Converter',
    category: 'Converters',
    blurb: 'Convert between binary, octal, decimal, hexadecimal and any base.',
    keywords: ['number', 'base', 'binary', 'octal', 'decimal', 'hex', 'radix'],
  },
  {
    slug: 'timezone-converter',
    name: 'Time Zone Converter',
    category: 'Converters',
    blurb: 'Convert a date and time across world time zones.',
    keywords: ['timezone', 'time zone', 'utc', 'convert', 'world clock'],
  },

  // ── Generators (pure JS / tiny lazy lib) ───────────────────
  {
    slug: 'password-generator',
    name: 'Password Generator',
    category: 'Generators',
    blurb: 'Generate strong random passwords and passphrases on-device.',
    keywords: ['password', 'passphrase', 'random', 'secure', 'generator'],
  },
  {
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    category: 'Generators',
    blurb: 'Create QR codes for text, URLs and Wi-Fi — rendered in your browser.',
    keywords: ['qr', 'qr code', 'generator', 'url', 'wifi', 'barcode'],
  },
  {
    slug: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    category: 'Generators',
    blurb: 'Generate placeholder lorem ipsum paragraphs, sentences and words.',
    keywords: ['lorem', 'ipsum', 'placeholder', 'dummy', 'text', 'filler'],
  },

  // ── Text Tools (pure JS) ───────────────────────────────────
  {
    slug: 'word-counter',
    name: 'Word & Character Counter',
    category: 'Text Tools',
    blurb: 'Count words, characters, sentences, paragraphs and reading time as you type.',
    keywords: ['word count', 'character count', 'letter count', 'reading time', 'text counter'],
  },
  {
    slug: 'slug-generator',
    name: 'Slug Generator',
    category: 'Text Tools',
    blurb: 'Turn any text or title into a clean, URL-safe slug.',
    keywords: ['slug', 'slugify', 'url', 'permalink', 'seo'],
  },
  {
    slug: 'text-diff',
    name: 'Text Diff Checker',
    category: 'Text Tools',
    blurb: 'Compare two blocks of text and highlight added and removed lines.',
    keywords: ['diff', 'compare', 'text difference', 'changes'],
  },
  {
    slug: 'morse-code',
    name: 'Morse Code Translator',
    category: 'Text Tools',
    blurb: 'Translate text to and from Morse code, with optional audio dots and dashes.',
    keywords: ['morse', 'code', 'translator', 'encode', 'decode'],
  },

  // ── Web & CSS (pure JS) ────────────────────────────────────
  {
    slug: 'color-converter',
    name: 'HEX, RGB & HSL Converter',
    category: 'Web & CSS',
    blurb: 'Convert colors between HEX, RGB and HSL with a live swatch.',
    keywords: ['hex', 'rgb', 'hsl', 'color', 'convert', 'css'],
  },
  {
    slug: 'contrast-checker',
    name: 'Color Contrast Checker',
    category: 'Web & CSS',
    blurb: 'Check the WCAG contrast ratio between text and background colors.',
    keywords: ['contrast', 'wcag', 'accessibility', 'a11y', 'color ratio'],
  },
  {
    slug: 'css-gradient',
    name: 'CSS Gradient Generator',
    category: 'Web & CSS',
    blurb: 'Design linear and radial CSS gradients with a live preview and copyable code.',
    keywords: ['css', 'gradient', 'linear', 'radial', 'background'],
  },
  {
    slug: 'html-entities',
    name: 'HTML Entity Encoder / Decoder',
    category: 'Web & CSS',
    blurb: 'Encode and decode HTML entities and numeric character references.',
    keywords: ['html', 'entity', 'entities', 'encode', 'escape', 'decode'],
  },

  // ── Utilities (pure JS) ────────────────────────────────────
  {
    slug: 'regex-tester',
    name: 'Regex Tester',
    category: 'Utilities',
    blurb: 'Test regular expressions with live match highlighting and capture groups.',
    keywords: ['regex', 'regular expression', 'test', 'match', 'pattern'],
  },
  {
    slug: 'cron-explainer',
    name: 'Cron Expression Explainer',
    category: 'Utilities',
    blurb: 'Translate a cron expression into plain English and preview upcoming run times.',
    keywords: ['cron', 'crontab', 'schedule', 'expression', 'job'],
  },
  {
    slug: 'cidr-calculator',
    name: 'CIDR / Subnet Calculator',
    category: 'Utilities',
    blurb: 'Compute network, broadcast, netmask and host range from an IPv4 CIDR block.',
    keywords: ['cidr', 'subnet', 'ip', 'netmask', 'network', 'ipv4'],
  },
  {
    slug: 'chmod-calculator',
    name: 'Chmod Calculator',
    category: 'Utilities',
    blurb: 'Convert Unix file permissions between symbolic (rwx) and octal notation.',
    keywords: ['chmod', 'permissions', 'octal', 'unix', 'file mode'],
  },

  // ── Converters (pure JS) ───────────────────────────────────
  {
    slug: 'json-to-typescript',
    name: 'JSON to TypeScript',
    category: 'Converters',
    blurb: 'Generate TypeScript interfaces from a sample JSON object.',
    keywords: ['json', 'typescript', 'interface', 'types', 'codegen'],
  },
  {
    slug: 'env-to-json',
    name: '.env to JSON',
    category: 'Converters',
    blurb: 'Convert between .env files and JSON in both directions.',
    keywords: ['env', 'dotenv', 'json', 'environment', 'variables'],
  },
  {
    slug: 'roman-numerals',
    name: 'Roman Numeral Converter',
    category: 'Converters',
    blurb: 'Convert between numbers and Roman numerals.',
    keywords: ['roman', 'numeral', 'number', 'convert'],
  },
  {
    slug: 'number-to-words',
    name: 'Number to Words',
    category: 'Converters',
    blurb: 'Spell out numbers as English words, including currency style.',
    keywords: ['number', 'words', 'spell', 'cardinal', 'amount'],
  },

  // ── Formatters (pure JS) ───────────────────────────────────
  {
    slug: 'sql-formatter',
    name: 'SQL Formatter',
    category: 'Formatters',
    blurb: 'Format and beautify SQL queries with consistent keyword casing and indentation.',
    keywords: ['sql', 'format', 'beautify', 'query', 'prettify'],
  },

  // ── Generators (pure JS) ───────────────────────────────────
  {
    slug: 'markdown-table',
    name: 'Markdown Table Generator',
    category: 'Generators',
    blurb: 'Build Markdown tables from rows, or convert CSV into a Markdown table.',
    keywords: ['markdown', 'table', 'generator', 'csv', 'md'],
  },
]

/** stable display index, e.g. 001, 002 … in registry order */
export const toolIndex = (slug: string): string => {
  const i = tools.findIndex((t) => t.slug === slug)
  return String(i + 1).padStart(3, '0')
}

export const toolsByCategory = (category: Category): Tool[] =>
  tools.filter((t) => t.category === category)
