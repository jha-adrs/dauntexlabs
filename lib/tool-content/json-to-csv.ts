import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This JSON to CSV converter takes a list of records, such as an API response or a database export, and turns it into a table you can open in Excel or Google Sheets. Paste a JSON array of objects and every object becomes one row. The columns are the union of every key found across all objects, in the order they first appear, so records with missing fields simply get empty cells.',
    'Nested data is handled in one of two ways. By default a nested object is written into its cell as a JSON string. Turn on "Flatten nested objects" and it is spread into separate columns with dotted names such as address.city. The conversion runs in your browser, so the records are processed on your device.',
  ],
  steps: [
    'Paste a JSON array of objects (or a single object) into the JSON input box.',
    'Pick the output Delimiter: Comma, Semicolon, Tab or Pipe.',
    'Keep "Include header row" on to get the column names as the first line, or switch it off for data rows only.',
    'Turn on "Flatten nested objects" if you want nested fields as their own dotted columns.',
    'Copy the CSV output, or download it as data.csv.',
  ],
  faq: [
    {
      q: 'How is this different from the JSON object to CSV tool?',
      a: 'This tool is for a list of records: each object in the array becomes a row and its keys become columns. The JSON object to CSV tool is for a single dictionary of key and value pairs, such as a settings object or a translation file, and lays those pairs out as two columns or two rows.',
    },
    {
      q: 'What happens to arrays inside my objects?',
      a: 'Arrays are not split into columns. They are written into a single cell as JSON text, for example ["red","blue"], even with flattening switched on. Nested objects are written the same way unless you enable "Flatten nested objects".',
    },
    {
      q: 'Can I paste a single object instead of an array?',
      a: 'Yes. A single object is treated as a one-row array. If the array contains plain values such as numbers or strings instead of objects, they are placed in a column called value.',
    },
    {
      q: 'How are commas, quotes and line breaks in values handled?',
      a: 'Any value that contains the chosen delimiter, a double quote or a line break is wrapped in double quotes, and quotes inside it are doubled. Null values become empty cells.',
    },
    {
      q: 'Why do I see a parse error?',
      a: 'The input must be valid JSON. Common causes are trailing commas, single quotes around strings or unquoted keys, which JavaScript allows but JSON does not. The error message shows what the browser parser reported.',
    },
  ],
}

export default content
