import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This tool converts URL query strings to JSON and back. Paste a query string like a=1&b=hello, one starting with ?, or a complete URL, and you get a readable JSON object of its parameters with percent-encoding decoded. It is useful for inspecting tracking links, debugging API requests, or reading long search URLs that are hard to scan by eye.',
    'In the other direction it builds a properly encoded query string from a JSON object, ready to append to a URL. Parsing uses the browser\'s own URL and URLSearchParams handling, and the conversion runs in your browser, so the links you paste are processed on your device.',
  ],
  steps: [
    'Choose "Query → JSON" or "JSON → Query" at the top.',
    'For Query → JSON, paste a full URL or just the query string into the input box.',
    'For JSON → Query, paste a JSON object whose keys are the parameter names.',
    'Copy the converted result from the output panel.',
  ],
  faq: [
    {
      q: 'How are repeated parameters handled?',
      a: 'A key that appears more than once, such as tag=a&tag=b, becomes a JSON array ["a","b"]. A key that appears once stays a single string. In the other direction, an array value is written as the same key repeated once per item.',
    },
    {
      q: 'Are numbers and booleans converted?',
      a: 'No. Query strings carry only text, so every value in the JSON output is a string, including 1 or true. Plus signs are decoded as spaces and percent-encoded characters are decoded, following the standard form-encoding rules.',
    },
    {
      q: 'Does it understand bracket syntax like user[name]=x?',
      a: 'No. Bracket-style names are kept as literal keys, so user[name] stays a key called "user[name]" rather than becoming a nested object. Likewise, when building a query string, nested objects are not expanded into brackets, so keep the JSON flat.',
    },
    {
      q: 'What happens to the rest of the URL?',
      a: 'When you paste a complete URL, only the part after ? is read. The domain, path and any #fragment are ignored.',
    },
    {
      q: 'How are special characters encoded in JSON → Query mode?',
      a: 'Keys and values are encoded with encodeURIComponent, so spaces become %20 and characters such as &, = and / are escaped, which keeps each value intact when the string is pasted into a URL.',
    },
  ],
}

export default content
