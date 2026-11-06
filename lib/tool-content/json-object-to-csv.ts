import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This JSON object to CSV converter is built for key and value data rather than lists of records. Paste a single object such as {"name":"Asha","plan":"pro"}, a feature flag map or a translation file, and each property becomes a pair in the CSV. It also accepts an array of [key, value] pairs, the shape you get from Object.entries or from many configuration exports.',
    'You choose the layout. Rows puts a key, value header on top and then one line per pair, which is easy to read and sort in a spreadsheet. Columns turns the keys into a single header row with the values in the row below, which suits importing one record into a template. The conversion runs in your browser, so the data is processed on your device.',
  ],
  steps: [
    'Paste a JSON object, or an array of [key, value] pairs, into the JSON input box.',
    'Choose "Rows (key/value per line)" for a two-column table, or "Columns (keys / values)" for a two-row table.',
    'Check the CSV output panel, which updates as you type.',
    'Copy the result, or download it as object.csv.',
  ],
  faq: [
    {
      q: 'How is this different from the JSON to CSV tool?',
      a: 'JSON to CSV expects an array of records and turns each object into a row with one column per field. This tool treats one object as a set of pairs and only ever produces two columns (in Rows mode) or two rows (in Columns mode), whatever the number of keys.',
    },
    {
      q: 'What happens to nested objects or arrays in the values?',
      a: 'Only the top level is split into pairs. A value that is itself an object or an array is written into its cell as JSON text, so nothing is lost, but it is not flattened into extra columns.',
    },
    {
      q: 'Why do I get an error when I paste an array?',
      a: 'When the input is an array, every element must be a two-item array in the form [key, value]. If you have an array of objects, use the JSON to CSV tool instead.',
    },
    {
      q: 'Can I change the delimiter?',
      a: 'No, the output is always comma-separated. Values that contain a comma, a double quote or a line break are wrapped in double quotes with inner quotes doubled, so spreadsheets read them correctly. Null values become empty cells.',
    },
  ],
}

export default content
