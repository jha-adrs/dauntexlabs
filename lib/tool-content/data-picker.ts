import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Data Picker pulls just the fields you need out of a dataset. Paste CSV, TSV, a JSON array of objects or a simple YAML list, and the tool detects every field name and lists it with a toggle. Switch off the columns you do not want, or type an exact list, and the output contains only those fields, as JSON or as CSV.',
    'It is a quick way to trim an export before sharing it, drop sensitive columns such as emails or phone numbers, reorder fields for an import, or convert a filtered slice between formats in one step. The data is processed in your browser as you change the selection.',
  ],
  steps: [
    'Choose the Input format: CSV, TSV, JSON (array of objects) or YAML (simple list).',
    'Paste your data into the Input data box; the first row of CSV or TSV is read as the header.',
    'In the Pick fields panel, switch off any fields you want to leave out. All fields start switched on.',
    'To control the order, type the field names into "Or override with a comma-separated list" instead. This list takes priority over the toggles.',
    'Pick JSON or CSV as the Output format, then copy the result or download picked.json or picked.csv.',
  ],
  faq: [
    {
      q: 'Which YAML does it support?',
      a: 'Only a simple subset: a top-level list where each item starts with "- " and contains flat key: value lines. Nested structures, anchors and multi-line values are not supported, and every value is read as text.',
    },
    {
      q: 'Are values converted to numbers?',
      a: 'Values from CSV, TSV and YAML stay as strings, so the JSON output shows "30" rather than 30. JSON input keeps its original types, including numbers, booleans and nested objects, when you output JSON.',
    },
    {
      q: 'What if I type a field name that does not exist?',
      a: 'In CSV output it becomes a column with empty cells. In JSON output the key is left out of each object. Field names are matched exactly, including capitalisation.',
    },
    {
      q: 'Can a CSV value span several lines?',
      a: 'No. The CSV and TSV reader works line by line, so quoted fields with commas and doubled quotes are handled, but a line break inside a quoted value starts a new row. Blank lines are skipped.',
    },
    {
      q: 'What happens to nested JSON values in CSV output?',
      a: 'CSV output writes each value as plain text, so a nested object or array does not convert cleanly. Pick JSON as the output format if the fields you keep contain nested data.',
    },
  ],
}

export default content
