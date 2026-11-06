import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This tool converts between dotenv files and JSON in both directions. In ".env → JSON" mode it reads KEY=value lines and produces a JSON object, which is handy for pasting environment settings into a cloud console, a secrets manager import, a test fixture or a config file. In "JSON → .env" mode it turns a flat JSON object back into a .env file you can drop into a project.',
    '.env files often hold API keys, database passwords and tokens. The conversion is designed to run in your browser, so the text is processed on your device rather than on a conversion server. Even so, treat any page you paste secrets into with care, and consider replacing real secrets with placeholders when you only need the structure.',
  ],
  steps: [
    'Choose the direction at the top: ".env → JSON" or "JSON → .env".',
    'Paste the contents of your .env file, or a JSON object, into the input box.',
    'Check the output panel; if something cannot be converted, an error message explains why.',
    'Copy the result, or download it as output.json or as a file named .env.',
  ],
  faq: [
    {
      q: 'Which .env syntax is supported?',
      a: 'Each KEY=value line becomes one entry. Blank lines and lines starting with # are skipped, as are lines without an equals sign. A value wrapped in matching single or double quotes has those quotes removed. If a key appears twice, the last value wins.',
    },
    {
      q: 'Are there .env features it does not handle?',
      a: 'Yes. It does not expand ${VAR} references, process escape sequences such as \\n, read multi-line values, or strip a trailing # comment after a value. A leading export keyword is kept as part of the key name. All values come out as JSON strings, including numbers and true or false.',
    },
    {
      q: 'What JSON can I convert to a .env file?',
      a: 'A flat object whose values are strings, numbers or booleans. Nested objects, arrays and null are rejected with an error naming the key, because .env files have no way to represent them.',
    },
    {
      q: 'How are values quoted in the .env output?',
      a: 'Values containing spaces, #, quotes or backslashes are wrapped in double quotes, and double quotes inside them are escaped with a backslash. Other values are written without quotes, for example PORT=3000.',
    },
  ],
}

export default content
