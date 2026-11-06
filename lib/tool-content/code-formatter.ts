import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This code formatter beautifies or minifies four languages: JSON, CSS, HTML/XML and JavaScript. Paste your source, pick the language and mode, and the formatted result appears straight away with a character count showing how much it grew or shrank. You can copy it or download it as a file with the right extension.',
    'It is a quick way to make a minified stylesheet readable, tidy a messy HTML snippet, or squeeze a small script before pasting it somewhere. Formatting runs in your browser.',
    'Be aware of how each language is handled. JSON is fully parsed and re-serialised, so invalid JSON shows an error. CSS, HTML/XML and JavaScript use lightweight best-effort formatters rather than a full parser: JavaScript formatting is heuristic and can lay out complex one-liners imperfectly, minifying JavaScript only removes comments and whitespace (it does not rename variables), and CSS comments are dropped.',
  ],
  steps: [
    'Choose a Language: JSON, CSS, HTML/XML or JavaScript.',
    'Pick Beautify to indent the code or Minify to strip whitespace and comments.',
    'For Beautify, choose an Indent of 2 spaces, 4 spaces or Tab.',
    'Paste your code into the source panel.',
    'Copy the formatted output or download it as a file.',
  ],
  faq: [
    {
      q: 'Which languages does the code formatter support?',
      a: 'JSON, CSS, HTML (which also works for simple XML) and JavaScript. Other languages such as TypeScript, SQL, Python or YAML are not supported; TypeScript may partly work in JavaScript mode, but type syntax is not understood.',
    },
    {
      q: 'Is the JavaScript minifier a replacement for Terser or esbuild?',
      a: 'No. It removes comments and collapses whitespace while keeping strings, template literals and regular expressions intact, but it does not rename variables, remove dead code or check syntax. For production bundles, use a real build-tool minifier.',
    },
    {
      q: 'Will beautifying HTML change my page?',
      a: 'It re-indents tags based on nesting and collapses whitespace between tags. That also applies inside pre, script, style and textarea elements: their contents are re-indented, and inline script containing a less-than sign can be split apart, so check those blocks by hand. Inline elements that relied on whitespace between tags can render slightly differently too. Minifying HTML also removes comments.',
    },
    {
      q: 'Why does JSON mode show an error?',
      a: 'JSON is parsed strictly, so trailing commas, single quotes, comments or unquoted keys cause a "Formatting failed" message. For relaxed JS-style objects, the separate JSON formatter tool has a loose parsing option.',
    },
    {
      q: 'Does the formatter highlight syntax?',
      a: 'No. Input and output are plain text areas without colour highlighting; the tool focuses on indentation and minification.',
    },
  ],
}

export default content
