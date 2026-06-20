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
  | 'Business & Finance'
  | 'Education'
  | 'Health & Fitness'
  | 'Everyday'

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
  'Business & Finance',
  'Education',
  'Health & Fitness',
  'Everyday',
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
  'Business & Finance': 'FIN',
  Education: 'EDU',
  'Health & Fitness': 'FIT',
  Everyday: 'DAY',
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

  // ── Developer (batch 4, pure JS) ───────────────────────────
  {
    slug: 'ulid-generator',
    name: 'ULID & UUIDv7 Generator',
    category: 'Generators',
    blurb: 'Generate time-sortable ULID and UUID v7 identifiers in bulk.',
    keywords: ['ulid', 'uuid v7', 'uuidv7', 'sortable id', 'identifier'],
  },
  {
    slug: 'base58-base32',
    name: 'Base58 & Base32 Encoder',
    category: 'Data Tools',
    blurb: 'Encode and decode text with Base58 and Base32.',
    keywords: ['base58', 'base32', 'encode', 'decode'],
  },
  {
    slug: 'json-diff',
    name: 'JSON Diff',
    category: 'Data Tools',
    blurb: 'Compare two JSON documents and see what was added, removed or changed.',
    keywords: ['json', 'diff', 'compare', 'difference'],
  },
  {
    slug: 'query-string-to-json',
    name: 'Query String to JSON',
    category: 'Converters',
    blurb: 'Convert URL query strings to JSON and back.',
    keywords: ['query string', 'querystring', 'json', 'url params'],
  },
  {
    slug: 'url-parser',
    name: 'URL Parser',
    category: 'Data Tools',
    blurb: 'Break a URL into protocol, host, path, query parameters and hash.',
    keywords: ['url', 'parse', 'parser', 'query params'],
  },
  {
    slug: 'json-to-go',
    name: 'JSON to Go Struct',
    category: 'Converters',
    blurb: 'Generate Go structs with json tags from a JSON sample.',
    keywords: ['json', 'go', 'golang', 'struct', 'codegen'],
  },
  {
    slug: 'box-shadow-generator',
    name: 'CSS Box Shadow Generator',
    category: 'Web & CSS',
    blurb: 'Design CSS box-shadows with a live preview and copyable code.',
    keywords: ['box shadow', 'css', 'shadow', 'generator'],
  },
  {
    slug: 'border-radius-generator',
    name: 'CSS Border Radius Generator',
    category: 'Web & CSS',
    blurb: 'Craft CSS border-radius with per-corner control and a live preview.',
    keywords: ['border radius', 'css', 'rounded corners', 'generator'],
  },
  {
    slug: 'gitignore-generator',
    name: '.gitignore Generator',
    category: 'Generators',
    blurb: 'Build a .gitignore from common language and tool templates.',
    keywords: ['gitignore', 'git', 'ignore', 'template'],
  },

  // ── Business & Finance (batch 4, pure-math calculators) ────
  {
    slug: 'loan-calculator',
    name: 'Loan & EMI Calculator',
    category: 'Business & Finance',
    blurb: 'Calculate monthly payments, total interest and a full amortization schedule.',
    keywords: ['loan', 'emi', 'mortgage', 'repayment', 'amortization'],
  },
  {
    slug: 'compound-interest',
    name: 'Compound Interest Calculator',
    category: 'Business & Finance',
    blurb: 'Project savings growth with compounding and regular contributions.',
    keywords: ['compound interest', 'savings', 'investment', 'growth'],
  },
  {
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    category: 'Business & Finance',
    blurb: 'Work out percentages, percentage change and ratios.',
    keywords: ['percentage', 'percent', 'change', 'calculator'],
  },
  {
    slug: 'margin-calculator',
    name: 'Profit Margin & Markup Calculator',
    category: 'Business & Finance',
    blurb: 'Compute profit margin, markup, profit and selling price.',
    keywords: ['margin', 'markup', 'profit', 'pricing'],
  },
  {
    slug: 'sales-tax-calculator',
    name: 'Sales Tax & VAT Calculator',
    category: 'Business & Finance',
    blurb: 'Add or extract sales tax / VAT from any amount.',
    keywords: ['sales tax', 'vat', 'gst', 'tax'],
  },
  {
    slug: 'discount-calculator',
    name: 'Discount Calculator',
    category: 'Business & Finance',
    blurb: 'Find the sale price and amount saved for any discount.',
    keywords: ['discount', 'sale', 'percent off', 'savings'],
  },
  {
    slug: 'break-even-calculator',
    name: 'Break-even Calculator',
    category: 'Business & Finance',
    blurb: 'Find the units and revenue needed to cover your costs.',
    keywords: ['break even', 'fixed cost', 'variable cost', 'units'],
  },
  {
    slug: 'roi-calculator',
    name: 'ROI & CAGR Calculator',
    category: 'Business & Finance',
    blurb: 'Measure return on investment and compound annual growth rate.',
    keywords: ['roi', 'cagr', 'return', 'investment', 'growth'],
  },
  {
    slug: 'tip-calculator',
    name: 'Tip & Bill Split Calculator',
    category: 'Business & Finance',
    blurb: 'Split a bill and calculate the tip per person.',
    keywords: ['tip', 'gratuity', 'bill split', 'restaurant'],
  },

  // ── Education (batch 5, pure JS) ───────────────────────────
  {
    slug: 'gpa-calculator',
    name: 'GPA Calculator',
    category: 'Education',
    blurb: 'Calculate your weighted GPA from course grades and credit hours.',
    keywords: ['gpa', 'grade point average', 'college', 'credits', 'semester'],
  },
  {
    slug: 'grade-calculator',
    name: 'Grade Calculator',
    category: 'Education',
    blurb: 'Work out your weighted course grade and the score you need on the final.',
    keywords: ['grade', 'weighted grade', 'final grade', 'exam', 'class'],
  },
  {
    slug: 'statistics-calculator',
    name: 'Statistics Calculator',
    category: 'Education',
    blurb: 'Find mean, median, mode, range, variance and standard deviation of a data set.',
    keywords: ['statistics', 'mean', 'median', 'mode', 'standard deviation', 'variance'],
  },
  {
    slug: 'fraction-calculator',
    name: 'Fraction Calculator',
    category: 'Education',
    blurb: 'Add, subtract, multiply and divide fractions, with simplified results.',
    keywords: ['fraction', 'fractions', 'simplify', 'math'],
  },
  {
    slug: 'quadratic-solver',
    name: 'Quadratic Equation Solver',
    category: 'Education',
    blurb: 'Solve ax² + bx + c = 0 with real or complex roots and the discriminant.',
    keywords: ['quadratic', 'equation', 'roots', 'discriminant', 'solver'],
  },
  {
    slug: 'citation-generator',
    name: 'Citation Generator',
    category: 'Education',
    blurb: 'Build APA, MLA and Chicago citations for books and websites.',
    keywords: ['citation', 'apa', 'mla', 'chicago', 'bibliography', 'reference'],
  },
  {
    slug: 'readability-score',
    name: 'Readability Score',
    category: 'Education',
    blurb: 'Measure Flesch reading ease and grade level for your text.',
    keywords: ['readability', 'flesch', 'reading level', 'grade level'],
  },
  {
    slug: 'random-name-picker',
    name: 'Random Name Picker',
    category: 'Education',
    blurb: 'Shuffle a list and pick random names or winners.',
    keywords: ['random name picker', 'raffle', 'winner', 'draw', 'shuffle'],
  },

  // ── Health & Fitness (batch 5, pure JS) ────────────────────
  {
    slug: 'bmi-calculator',
    name: 'BMI Calculator',
    category: 'Health & Fitness',
    blurb: 'Calculate Body Mass Index in metric or imperial units, with category.',
    keywords: ['bmi', 'body mass index', 'weight', 'height'],
  },
  {
    slug: 'calorie-calculator',
    name: 'Calorie & TDEE Calculator',
    category: 'Health & Fitness',
    blurb: 'Estimate BMR and daily calorie needs with the Mifflin-St Jeor formula.',
    keywords: ['calorie', 'tdee', 'bmr', 'maintenance calories', 'mifflin'],
  },
  {
    slug: 'pace-calculator',
    name: 'Running Pace Calculator',
    category: 'Health & Fitness',
    blurb: 'Convert between pace, distance and time for your runs.',
    keywords: ['pace', 'running', 'marathon', 'split', 'speed'],
  },
  {
    slug: 'water-intake',
    name: 'Water Intake Calculator',
    category: 'Health & Fitness',
    blurb: 'Estimate how much water to drink per day from your body weight.',
    keywords: ['water intake', 'hydration', 'daily water', 'drink'],
  },

  // ── Everyday (batch 5, pure JS) ────────────────────────────
  {
    slug: 'age-calculator',
    name: 'Age Calculator',
    category: 'Everyday',
    blurb: 'Find your exact age in years, months and days from a date of birth.',
    keywords: ['age', 'age calculator', 'birthday', 'how old'],
  },
  {
    slug: 'date-difference',
    name: 'Date Difference Calculator',
    category: 'Everyday',
    blurb: 'Count the days, weeks, months and years between two dates.',
    keywords: ['date difference', 'days between', 'duration', 'date calculator'],
  },
  {
    slug: 'date-calculator',
    name: 'Date Add / Subtract',
    category: 'Everyday',
    blurb: 'Add or subtract days, weeks or months from a date.',
    keywords: ['date', 'add days', 'subtract days', 'future date'],
  },
  {
    slug: 'random-number-generator',
    name: 'Random Number Generator',
    category: 'Everyday',
    blurb: 'Generate random numbers in a range, with optional uniqueness.',
    keywords: ['random number', 'rng', 'generator', 'lottery', 'dice'],
  },
]

/** stable display index, e.g. 001, 002 … in registry order */
export const toolIndex = (slug: string): string => {
  const i = tools.findIndex((t) => t.slug === slug)
  return String(i + 1).padStart(3, '0')
}

export const toolsByCategory = (category: Category): Tool[] =>
  tools.filter((t) => t.category === category)
