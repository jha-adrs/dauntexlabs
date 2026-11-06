import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This text to CSV converter reshapes loosely structured text into proper comma-separated values. Each line of input becomes one CSV row, and you tell the tool what separates the columns: runs of whitespace, commas, tabs, semicolons or a custom string of your own. It is useful for terminal output such as ls -l or ps, columns copied out of a PDF or web page, log lines, or a list pasted from a chat.',
    'The output is always standard comma-separated CSV. Any field that contains a comma, a double quote or a line break is wrapped in double quotes with inner quotes doubled, so it opens cleanly in a spreadsheet. The text is processed on your device as you type.',
  ],
  steps: [
    'Paste your text into the text input box, one row per line.',
    'Pick the "Input column delimiter": Whitespace, Comma, Tab, Semicolon or Custom.',
    'If you chose Custom, type the separator into the "Custom delimiter" box. It can be more than one character, such as " | " or ::.',
    'Turn on "Quote all fields" if the program you are importing into expects every value in quotes.',
    'Copy the CSV output, or download it as output.csv.',
  ],
  faq: [
    {
      q: 'How does the Whitespace option split lines?',
      a: 'Leading and trailing spaces are removed, then the line is split on any run of spaces or tabs, so aligned columns with uneven padding come out cleanly. The catch is that a value containing a space, such as a full name, is split into two columns. Use Tab or a custom delimiter for data like that.',
    },
    {
      q: 'Does it understand quoted values in my input?',
      a: 'No. The input is split literally on the delimiter you pick, so a comma inside "Smith, John" still starts a new column. If your input is already valid CSV with quoted fields, a dedicated CSV parser such as the CSV to JSON tool will read it correctly.',
    },
    {
      q: 'What if rows have different numbers of columns?',
      a: 'Each line is converted on its own, so rows keep however many fields they had. The tool does not pad short rows, and most spreadsheets will simply show the missing cells as empty.',
    },
    {
      q: 'What happens to blank lines?',
      a: 'Blank lines at the end of the input are dropped. Blank lines in the middle are kept as empty rows, so you may want to remove them first if your import does not expect them.',
    },
    {
      q: 'Can I output tab- or semicolon-separated values instead?',
      a: 'Not with this tool. The delimiter setting only controls how your input is split; the output is always comma-separated.',
    },
  ],
}

export default content
