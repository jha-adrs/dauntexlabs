import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This JSON pivot tool reshapes an array of JSON objects without writing any code. Paste rows like [{ "name": "Alice", "dept": "Eng" }, ...] and turn them into columns, a lookup keyed by one field, or groups of rows that share a value. It is the kind of transformation you would normally write a quick JavaScript reduce for when you need to pivot JSON data for a chart, a report or an API payload.',
    'The tool detects every field present in your data, lets you pick the one to pivot on, and gives you pretty-printed JSON to copy or download. The reshaping happens in your browser.',
  ],
  steps: [
    'Paste a JSON array of objects into the Input JSON box.',
    'Choose an operation: Transpose, Key by field or Group by field.',
    'For Key by field and Group by field, choose the field from the Field menu; it lists every key found in your data.',
    'Check the Output JSON panel, then copy it or download it as pivoted.json.',
  ],
  faq: [
    {
      q: 'What does each operation do?',
      a: 'Transpose turns rows into columns: you get one array per field, e.g. { "name": ["Alice", "Bob"], "dept": ["Eng", "HR"] }. Key by field builds an object whose keys are the values of the chosen field, each pointing at its row. Group by field does the same but always collects rows into arrays, so several rows can share a key.',
    },
    {
      q: 'What happens with duplicate keys in Key by field?',
      a: 'If two rows have the same value for the chosen field, that key becomes an array holding both rows, so nothing is dropped. Use Group by field if you want every key to be an array consistently.',
    },
    {
      q: 'What if some objects are missing a field?',
      a: 'Transpose fills the gap with null so every column has the same length as the number of rows. When keying or grouping, rows without the field are collected under an empty-string key.',
    },
    {
      q: 'How would I do this in JavaScript?',
      a: 'Group by is roughly rows.reduce((acc, r) => ((acc[r[field]] ??= []).push(r), acc), {}), and transpose maps each field over the rows. This tool runs equivalent logic so you can preview the shape before writing the code, or skip writing it.',
    },
    {
      q: 'Can it aggregate values, like a spreadsheet pivot table?',
      a: 'No. It reshapes data but does not sum, count or average values. The input must be a JSON array of plain objects; anything else shows an error.',
    },
  ],
}

export default content
