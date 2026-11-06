import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    "This JSON formatter beautifies, minifies and validates JSON. Paste a payload and it is parsed and re-serialised with your chosen indentation, collapsed onto one line, or simply checked. When the JSON is invalid you get the parser's error message, with a line and column where the browser reports a position.",
    'Two extras help with real-world data: sorting keys alphabetically to make objects easier to compare, and a loose mode that accepts JavaScript-style object literals with unquoted keys, single quotes, trailing commas and comments. Loose input is converted to JSON, not run as code. All parsing happens in your browser.',
  ],
  steps: [
    'Choose Beautify, Minify or Validate.',
    'For Beautify, pick an Indent of 2 spaces, 4 spaces or Tab.',
    'Optionally turn on "Sort keys" to order object keys alphabetically at every level, or "Parse JS objects (loose)" for relaxed input.',
    'Paste your JSON into the json input panel.',
    'Copy the output or download it as formatted.json, or read the "Valid JSON" message in Validate mode.',
  ],
  faq: [
    {
      q: 'How do I check whether my JSON is valid?',
      a: 'Switch to Validate and paste your JSON. A green "Valid JSON" notice confirms it parses; otherwise the error message explains what the parser hit and, when available, the line and column so you can find the problem quickly.',
    },
    {
      q: 'What are the most common JSON errors?',
      a: 'Trailing commas after the last item, single-quoted strings, unquoted keys, comments, and unescaped line breaks inside strings. Strict JSON allows none of these. Loose mode accepts the first four and converts them to valid JSON for you.',
    },
    {
      q: 'What does loose mode accept, and what does it reject?',
      a: 'It accepts // and /* */ comments, single-quoted strings, unquoted keys and trailing commas. It rejects anything else that is not JSON, such as variables, function calls, undefined or NaN, and it does not evaluate the text as JavaScript.',
    },
    {
      q: 'Does sorting keys change array order?',
      a: 'No. "Sort keys" sorts the keys of every object recursively, including objects nested inside arrays, but arrays keep their original order because order in an array is meaningful.',
    },
    {
      q: 'Will very large numbers stay exact?',
      a: 'Numbers are parsed as standard JavaScript numbers, so integers larger than 9007199254740991 (such as some 64-bit IDs) can lose precision when reformatted, and values like 1.0 come out as 1. Keep such IDs as strings if exact digits matter.',
    },
    {
      q: 'Can it handle JSON Lines or several documents at once?',
      a: 'No. The input must be a single JSON value. For newline-delimited JSON, format each line separately.',
    },
  ],
}

export default content
