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
  | 'Marketing & SEO'
  | 'Aviation'
  | 'India'

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
  'Marketing & SEO',
  'Aviation',
  'India',
]

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
    blurb: 'Compute SHA-256, SHA-512, MD5 and more, right in your browser.',
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
    blurb: 'Shrink JPG, PNG and WebP images right in your browser, with a quality slider.',
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
    blurb: 'Resize and crop images right in your browser.',
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
    blurb: 'Combine multiple PDF files into one, right in your browser.',
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
    blurb: 'Free QR code designer: custom shapes, colours, logo and frame. Wi-Fi, vCard, UPI and more. PNG, SVG or JPEG, no watermark.',
    keywords: ['qr code generator', 'qr code with logo', 'custom qr code', 'qr code svg', 'wifi qr code', 'vcard qr code', 'free qr code no watermark', 'qr code designer', 'qr', 'barcode'],
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
    blurb: 'Translate text to and from International Morse code — letters A–Z and digits 0–9.',
    keywords: ['morse', 'code', 'translator', 'encode', 'decode'],
  },
  {
    slug: 'markdown-to-pdf',
    name: 'Markdown to PDF',
    category: 'Text Tools',
    blurb: 'Write or paste Markdown, preview it live, and export to PDF or HTML — all in your browser.',
    keywords: ['markdown', 'pdf', 'md to pdf', 'html', 'export', 'preview'],
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

  // ── Marketing & SEO (batch 6, pure JS) ─────────────────────
  {
    slug: 'meta-tag-generator',
    name: 'Meta Tag Generator',
    category: 'Marketing & SEO',
    blurb: 'Generate SEO meta tags — title, description, keywords, robots, canonical and viewport.',
    keywords: ['meta tags', 'seo', 'html head', 'meta description'],
  },
  {
    slug: 'open-graph-generator',
    name: 'Open Graph Generator',
    category: 'Marketing & SEO',
    blurb: 'Build Open Graph and card tags for rich link previews on social platforms.',
    keywords: ['open graph', 'og tags', 'social', 'link preview'],
  },
  {
    slug: 'utm-builder',
    name: 'UTM Campaign Builder',
    category: 'Marketing & SEO',
    blurb: 'Build trackable campaign URLs with UTM parameters.',
    keywords: ['utm', 'campaign url', 'tracking', 'marketing'],
  },
  {
    slug: 'serp-preview',
    name: 'SERP Snippet Preview',
    category: 'Marketing & SEO',
    blurb: 'Preview how your title and description appear in search results, with length limits.',
    keywords: ['serp', 'snippet', 'search preview', 'title length', 'meta description'],
  },
  {
    slug: 'keyword-density',
    name: 'Keyword Density Analyzer',
    category: 'Marketing & SEO',
    blurb: 'Analyze keyword frequency and density in your content.',
    keywords: ['keyword density', 'seo', 'word frequency', 'content'],
  },
  {
    slug: 'robots-txt-generator',
    name: 'Robots.txt Generator',
    category: 'Marketing & SEO',
    blurb: 'Create a robots.txt with allow / disallow rules and a sitemap reference.',
    keywords: ['robots.txt', 'crawler', 'seo', 'disallow'],
  },
  {
    slug: 'sitemap-generator',
    name: 'XML Sitemap Generator',
    category: 'Marketing & SEO',
    blurb: 'Turn a list of URLs into a valid XML sitemap.',
    keywords: ['sitemap', 'xml sitemap', 'seo', 'urls'],
  },
  {
    slug: 'hashtag-generator',
    name: 'Hashtag Generator',
    category: 'Marketing & SEO',
    blurb: 'Turn keywords into clean, deduplicated hashtags.',
    keywords: ['hashtag', 'social media', 'tags'],
  },
  {
    slug: 'social-character-counter',
    name: 'Social Character Counter',
    category: 'Marketing & SEO',
    blurb: 'Count characters against common post, caption and bio length limits.',
    keywords: ['character counter', 'social media', 'post length', 'caption'],
  },
  {
    slug: 'ctr-calculator',
    name: 'CTR Calculator',
    category: 'Marketing & SEO',
    blurb: 'Calculate click-through rate from clicks and impressions.',
    keywords: ['ctr', 'click through rate', 'ads', 'marketing'],
  },
  {
    slug: 'conversion-rate-calculator',
    name: 'Conversion Rate Calculator',
    category: 'Marketing & SEO',
    blurb: 'Work out conversion rate from conversions and visits.',
    keywords: ['conversion rate', 'cvr', 'funnel', 'marketing'],
  },
  {
    slug: 'cpm-calculator',
    name: 'CPM, CPC & CPA Calculator',
    category: 'Marketing & SEO',
    blurb: 'Calculate CPM, CPC and CPA from spend, impressions, clicks and conversions.',
    keywords: ['cpm', 'cpc', 'cpa', 'ad cost', 'advertising'],
  },
  {
    slug: 'roas-calculator',
    name: 'ROAS Calculator',
    category: 'Marketing & SEO',
    blurb: 'Measure return on ad spend from revenue and cost.',
    keywords: ['roas', 'return on ad spend', 'advertising', 'roi'],
  },
  {
    slug: 'engagement-rate-calculator',
    name: 'Engagement Rate Calculator',
    category: 'Marketing & SEO',
    blurb: 'Compute engagement rate from interactions and audience size.',
    keywords: ['engagement rate', 'social media', 'reach', 'followers'],
  },
  {
    slug: 'ab-test-calculator',
    name: 'A/B Test Significance Calculator',
    category: 'Marketing & SEO',
    blurb: 'Check whether an A/B test conversion result is statistically significant.',
    keywords: ['ab test', 'significance', 'conversion', 'statistics'],
  },
  {
    slug: 'email-signature-generator',
    name: 'Email Signature Generator',
    category: 'Marketing & SEO',
    blurb: 'Create a clean HTML email signature you can copy into your mail client.',
    keywords: ['email signature', 'html signature', 'branding'],
  },
  {
    slug: 'cron-to-systemd-timer',
    name: 'Cron to systemd Timer Converter',
    category: 'Utilities',
    blurb: 'Turn a cron line into a systemd OnCalendar= value plus .timer and .service files. Runs in your browser.',
    keywords: ['cron to systemd timer', 'convert cron to systemd', 'oncalendar cron equivalent', 'systemd timer generator', 'crontab to systemd', 'systemd oncalendar examples', 'persistent systemd timer', 'replace cron with systemd'],
  },
  {
    slug: 'gpx-converter',
    name: 'GPX Converter',
    category: 'Data Tools',
    blurb: 'Convert GPX, KML and GeoJSON tracks, or export to CSV, with distance and elevation stats. Runs in your browser.',
    keywords: ['gpx to geojson', 'kml to gpx', 'gpx to kml', 'geojson to gpx', 'gpx to csv', 'convert gpx file', 'gpx distance calculator', 'gpx elevation gain', 'kml to geojson'],
  },
  {
    slug: 'density-altitude-calculator',
    name: 'Density Altitude Calculator',
    category: 'Aviation',
    blurb: 'Density altitude from pressure altitude, temperature and optional dewpoint — runs in your browser.',
    keywords: ['density altitude calculator', 'how to calculate density altitude', 'density altitude formula', 'pressure altitude to density altitude', 'isa temperature calculator', 'density altitude with dewpoint', 'high density altitude'],
  },
  {
    slug: 'wind-correction-angle',
    name: 'Wind Correction Angle Calculator',
    category: 'Aviation',
    blurb: 'Solve the wind triangle: wind correction angle, true heading and ground speed from TAS, course and wind.',
    keywords: ['wind correction angle calculator', 'how to calculate wind correction angle', 'wind triangle calculator', 'ground speed calculator aviation', 'heading calculator', 'e6b wind side', 'wca formula'],
  },
  {
    slug: 'true-airspeed-calculator',
    name: 'True Airspeed (TAS) Calculator',
    category: 'Aviation',
    blurb: 'Convert calibrated airspeed to true airspeed and Mach from pressure altitude and temperature.',
    keywords: ['true airspeed calculator', 'tas calculator', 'cas to tas', 'how to calculate true airspeed', 'calibrated airspeed to true airspeed', 'ias cas tas', 'mach number calculator'],
  },
  {
    slug: 'crosswind-component',
    name: 'Crosswind Component Calculator',
    category: 'Aviation',
    blurb: 'Headwind, tailwind and crosswind components for any runway and wind — runs in your browser.',
    keywords: ['crosswind component calculator', 'how to calculate crosswind component', 'headwind component calculator', 'runway crosswind calculator', 'tailwind component', 'crosswind chart'],
  },
  {
    slug: 'aadhaar-masker',
    name: 'Aadhaar Masker',
    category: 'India',
    blurb: 'Cover your Aadhaar number on a photo or scan with solid boxes — you choose what to hide. Runs in your browser.',
    keywords: ['mask aadhaar', 'masked aadhaar', 'hide aadhaar number', 'aadhaar masking tool', 'mask aadhaar number online', 'redact aadhaar card', 'black out id card', 'blur aadhaar number'],
  },
  {
    slug: 'photo-date-stamp',
    name: 'Photo with Name & Date',
    category: 'India',
    blurb: 'Add a name and date strip to an exam photo, join your signature and resize to 200×230 px. Runs in your browser.',
    keywords: ['photo with name and date', 'add name and date on photo', 'exam photo with name and date', 'photo signature joiner', 'ssc photo resize', 'photo resize 200x230', 'signature resize 140x60', 'name and date on photo online'],
  },
  {
    slug: 'vcf-to-csv',
    name: 'VCF to CSV Converter',
    category: 'Data Tools',
    blurb: 'Convert vCard (.vcf) contacts to CSV for Excel, Google Contacts or Outlook — runs in your browser.',
    keywords: ['vcf to csv', 'vcard to csv', 'convert vcf to excel', 'vcf to google contacts', 'vcf to outlook csv', 'iphone contacts to csv', 'android vcf to csv', 'vcf file converter'],
  },
  {
    slug: 'ics-viewer',
    name: 'ICS File Viewer',
    category: 'Data Tools',
    blurb: 'Open an .ics calendar file as a table in your time zone and export it to CSV — runs in your browser.',
    keywords: ['ics viewer', 'open ics file', 'ics to csv', 'ics file reader', 'view ics online', 'ical viewer', 'convert ics to excel', 'calendar file viewer'],
  },
  {
    slug: 'amount-in-words-rupees',
    name: 'Amount in Words (Rupees)',
    category: 'India',
    blurb: 'Write any rupee amount in words with lakh, crore and paise, in English or Hindi. Runs in your browser.',
    keywords: ['amount in words', 'rupees in words', 'number to words indian rupees', 'cheque amount in words', 'lakh crore in words', 'amount in words in hindi', 'rupees to words converter', 'invoice amount in words'],
  },
  {
    slug: 'pdf-metadata-remover',
    name: 'PDF Metadata Remover',
    category: 'PDF Tools',
    blurb: 'View, edit or remove PDF title, author, dates and XMP metadata. Processed on your device.',
    keywords: ['remove pdf metadata', 'pdf metadata remover', 'remove author from pdf', 'edit pdf metadata', 'pdf properties editor', 'strip pdf metadata', 'clean pdf metadata', 'pdf xmp remove'],
  },
  {
    slug: 'homoglyph-detector',
    name: 'Homoglyph Detector',
    category: 'Text Tools',
    blurb: 'Spot lookalike Unicode letters (Cyrillic а, Greek Η) and invisible characters in text. Runs in your browser.',
    keywords: ['homoglyph detector', 'confusable characters checker', 'detect cyrillic letters', 'zero width space detector', 'remove invisible characters', 'unicode lookalike checker', 'idn homograph check', 'punycode phishing check'],
  },
  {
    slug: 'krutidev-to-unicode',
    name: 'Kruti Dev to Unicode Converter',
    category: 'India',
    blurb: 'Convert Kruti Dev 010 Hindi text to Unicode and back. Runs in your browser.',
    keywords: ['kruti dev to unicode', 'krutidev to unicode converter', 'unicode to kruti dev', 'mangal to kruti dev', 'kruti dev 010 converter', 'hindi font converter', 'kruti dev to mangal'],
  },
  {
    slug: 'devlys-to-unicode',
    name: 'DevLys to Unicode Converter',
    category: 'India',
    blurb: 'Convert DevLys 010 Hindi text to Unicode and back. Same layout as Kruti Dev. Runs in your browser.',
    keywords: ['devlys to unicode', 'devlys 010 to unicode', 'unicode to devlys', 'devlys converter', 'devlys to mangal', 'hindi font converter'],
  },
  {
    slug: 'chanakya-to-unicode',
    name: 'Chanakya to Unicode Converter',
    category: 'India',
    blurb: 'Convert Chanakya font Hindi text to Unicode and back. Runs in your browser.',
    keywords: ['chanakya to unicode', 'chanakya font converter', 'unicode to chanakya', 'chanakya to mangal', 'hindi font converter', 'chanakya hindi font'],
  },
  {
    slug: 'shivaji-to-unicode',
    name: 'Shivaji to Unicode Converter (Marathi)',
    category: 'India',
    blurb: 'Convert Shivaji font Marathi text to Unicode — being finished; the mapping is still being verified.',
    keywords: ['shivaji to unicode', 'shivaji font converter', 'marathi font converter', 'shivaji to unicode marathi', 'shivaji01 font', 'marathi legacy font to unicode'],
    status: 'maintenance',
  },
  {
    slug: 'gstin-validator',
    name: 'GSTIN Validator',
    category: 'India',
    blurb: 'Check a GST number\'s format, state code, PAN and check digit — one at a time or in bulk, with CSV export. Runs in your browser.',
    keywords: ['gstin validator', 'gst number check', 'gstin check digit', 'verify gstin format', 'gst number validation', 'bulk gstin validator', 'gstin to pan', 'gst state code'],
  },
  {
    slug: 'aadhaar-validator',
    name: 'Aadhaar Number Validator',
    category: 'India',
    blurb: 'Check an Aadhaar number\'s format and Verhoeff check digit to catch typing mistakes. Shows only the last 4 digits by default.',
    keywords: ['aadhaar number validator', 'aadhaar verhoeff', 'check aadhaar number format', 'aadhaar check digit', 'validate aadhaar number', 'aadhaar number checker'],
  },
  {
    slug: 'hindi-typing-keyboard',
    name: 'Hindi Typing Keyboard',
    category: 'India',
    blurb: 'Type Hindi on an English keyboard with the Remington (Gail) or InScript layout and copy Unicode Devanagari text.',
    keywords: ['hindi typing', 'remington gail keyboard', 'inscript keyboard', 'hindi typing online', 'type in hindi', 'kruti dev typing', 'hindi keyboard layout', 'remington hindi typing'],
  },
  {
    slug: 'metar-decoder',
    name: 'METAR Decoder',
    category: 'Aviation',
    blurb: 'Paste a METAR or SPECI and read it in plain English: wind, visibility, weather, clouds, temperature, altimeter and flight category.',
    keywords: ['metar decoder', 'decode metar', 'metar translator', 'how to read metar', 'metar to plain english', 'speci decoder', 'flight category vfr ifr'],
  },
  {
    slug: 'taf-decoder',
    name: 'TAF Decoder',
    category: 'Aviation',
    blurb: 'Paste a TAF forecast and see each FM, TEMPO, BECMG and PROB period decoded into a plain-English timeline.',
    keywords: ['taf decoder', 'decode taf', 'taf translator', 'how to read taf', 'terminal aerodrome forecast decoder', 'tempo becmg meaning'],
  },
  {
    slug: 'cloud-base-calculator',
    name: 'Cloud Base Calculator',
    category: 'Aviation',
    blurb: 'Estimate the cloud base from temperature and dew point (°C or °F), with relative humidity. For training and planning.',
    keywords: ['cloud base calculator', 'estimate cloud base', 'temperature dew point spread', 'cloud base formula', 'cumulus base height', 'relative humidity dew point'],
  },
  {
    slug: 'pressure-altitude-calculator',
    name: 'Pressure Altitude Calculator',
    category: 'Aviation',
    blurb: 'Work out pressure altitude from field elevation and altimeter setting in inHg or hPa (QNH), with the rule-of-thumb check.',
    keywords: ['pressure altitude calculator', 'pressure altitude formula', 'qnh to pressure altitude', 'altimeter setting calculator', 'calculate pressure altitude', 'inhg hpa altitude'],
  },
  {
    slug: 'flight-time-fuel-calculator',
    name: 'Flight Time & Fuel Calculator',
    category: 'Aviation',
    blurb: 'Distance and ground speed to flight time, plus trip fuel and 30 or 45 minute reserve in gallons, litres or pounds.',
    keywords: ['flight time calculator', 'aviation fuel calculator', 'fuel required calculator', 'flight fuel planning', 'fuel reserve 45 minutes', 'avgas weight calculator'],
  },
  {
    slug: 'weight-and-balance-calculator',
    name: 'Weight & Balance Calculator',
    category: 'Aviation',
    blurb: 'Enter weights and arms from your POH to get total weight, moment and centre of gravity, checked against your limits.',
    keywords: ['weight and balance calculator', 'aircraft weight and balance', 'cg calculator aircraft', 'moment arm calculator', 'center of gravity calculator aviation', 'cessna weight and balance'],
  },
  {
    slug: 'subtitle-sync-fixer',
    name: 'Subtitle Sync Fixer',
    category: 'Converters',
    blurb: 'Fix out-of-sync subtitles: shift all cues, correct drift with two reference points, and convert between SRT and VTT.',
    keywords: ['subtitle sync', 'fix subtitle timing', 'srt shift', 'subtitle delay fixer', 'srt to vtt', 'vtt to srt', 'resync subtitles', 'subtitle drift fix'],
  },
  {
    slug: 'har-sanitizer',
    name: 'HAR File Sanitizer',
    category: 'Data Tools',
    blurb: 'Remove cookies, tokens, API keys and JWTs from a HAR file before you share it with support. Processed on your device.',
    keywords: ['har sanitizer', 'sanitize har file', 'remove cookies from har', 'har file redact', 'clean har file', 'har token remover', 'share har file safely'],
  },
  {
    slug: 'eml-viewer',
    name: 'EML Viewer',
    category: 'Utilities',
    blurb: 'Open .eml email files to read headers, text and HTML and save attachments. Remote images and trackers are blocked.',
    keywords: ['eml viewer', 'open eml file', 'eml file reader', 'view eml online', 'eml to text', 'eml attachment extractor', 'read email file'],
  },
  {
    slug: 'upi-qr-code-generator',
    name: 'UPI QR Code Generator',
    category: 'India',
    blurb: 'Make a free UPI payment QR code with your UPI ID, name and optional amount — add a logo and colours, download PNG or SVG.',
    keywords: ['upi qr code generator', 'upi qr code', 'create upi qr code', 'upi payment qr', 'upi qr with amount', 'free upi qr code', 'shop upi qr code', 'bhim upi qr generator'],
  },
  {
    slug: 'walkman-chanakya-to-unicode',
    name: 'Walkman-Chanakya to Unicode Converter',
    category: 'India',
    blurb: 'Convert Walkman-Chanakya 901/905 Hindi text (used in government documents) to Unicode Devanagari, and back. Runs in your browser.',
    keywords: ['walkman chanakya to unicode', 'walkman chanakya 901 to unicode', 'chanakya 905 to unicode', 'walkman chanakya converter', 'unicode to walkman chanakya', 'hindi font converter government'],
  },
]

export const toolsByCategory = (category: Category): Tool[] =>
  tools.filter((t) => t.category === category)
