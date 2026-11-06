import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This CSV to JSON converter turns spreadsheet exports and comma-separated files into a JSON array of objects, one object per row. With a header row, the column names become the object keys; without one, the keys are col1, col2 and so on. The output updates as you type, so you can adjust the options and see the effect straight away.',
    'The parser follows the usual CSV quoting rules: a field wrapped in double quotes can contain the delimiter, line breaks and doubled quotes ("") for a literal quote. You can switch the delimiter to semicolon, tab or pipe for European Excel exports, TSV files or database dumps. The conversion runs in your browser, which is convenient when the file holds customer lists or other internal data.',
  ],
  steps: [
    'Choose the Delimiter your file uses: Comma, Semicolon, Tab or Pipe.',
    'Paste your data into the CSV input box.',
    'Leave "First row is header" on if the first line holds column names, or turn it off to get col1, col2 style keys.',
    'Decide whether to keep "Type inference" and "Trim values" switched on (both are on by default).',
    'Copy the JSON output, or download it as data.json.',
  ],
  faq: [
    {
      q: 'What does type inference do?',
      a: 'With Type inference on, empty cells and the word null become null, true and false become booleans, and anything JavaScript reads as a number becomes a number. Everything else stays a string. Turn it off to keep every value as the exact text from the file.',
    },
    {
      q: 'Why did my ZIP codes or IDs lose their leading zeros?',
      a: 'Type inference converts values such as 00742 to the number 742, and it also reads forms like 1e3 or 0x1A as numbers. If a column holds codes, phone numbers or IDs that must stay as text, switch Type inference off.',
    },
    {
      q: 'What happens if two columns have the same header?',
      a: 'Each row becomes a JSON object, and an object can only hold one value per key, so the later column overwrites the earlier one. Rename duplicate headers before converting if you need both.',
    },
    {
      q: 'What if a row has fewer or more cells than the header?',
      a: 'Missing cells are treated as empty, which becomes null when Type inference is on. Extra cells beyond the last header are dropped. With no header row, the number of keys follows the longest row.',
    },
    {
      q: 'Does it produce nested JSON?',
      a: 'No. Each row becomes a flat object with one key per column. Column names containing dots are kept as plain keys and are not expanded into nested objects.',
    },
  ],
}

export default content
