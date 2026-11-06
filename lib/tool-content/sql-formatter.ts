import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This SQL formatter turns a long, single-line or messy query into readable SQL. Paste a query and it puts each major clause (SELECT, FROM, WHERE, JOIN, ON, GROUP BY, ORDER BY, HAVING, LIMIT, UNION, INSERT INTO, VALUES, UPDATE, SET, DELETE FROM) on its own line, pushes AND and OR onto indented lines, and indents by two spaces inside parentheses. It is a quick way to format an SQL query online before reading it, reviewing it or pasting it into a ticket.',
    'It is a lightweight, heuristic SQL beautifier rather than a full parser. There is no dialect setting and it does not validate syntax, so it treats MySQL, PostgreSQL, SQL Server and SQLite queries the same way and will happily format a query that would fail to run. The formatting runs in your browser as you type.',
  ],
  steps: [
    'Paste your query into the sql input box.',
    'Leave Uppercase keywords switched on to capitalise recognised keywords, or switch it off to keep your original casing.',
    'Read the result in the formatted sql panel; it updates as you type or edit.',
    'Use copy to put the formatted SQL on your clipboard, or download to save it as formatted.sql.',
  ],
  faq: [
    {
      q: 'What options does the formatter have?',
      a: 'Just one: the Uppercase keywords toggle. Indentation is fixed at two spaces and the line-break rules are built in. There are no dialect, indent-width or comma-style settings.',
    },
    {
      q: 'Does it support MySQL, PostgreSQL or SQL Server syntax?',
      a: 'There is no dialect option. The formatter recognises common keywords shared by most SQL dialects and treats everything else as plain words, which it leaves as written. Dialect-specific keywords are not uppercased or moved onto new lines.',
    },
    {
      q: 'Will it change my string values?',
      a: "No. Text inside single or double quotes, including doubled-quote escapes such as 'it''s', is kept exactly as written and never re-cased or split.",
    },
    {
      q: 'Does it check that my SQL is valid?',
      a: 'No. It only rearranges whitespace and keyword casing. It does not run, parse or validate the query, so syntax errors pass through unchanged.',
    },
    {
      q: 'Are there any known limits?',
      a: 'Comments are not treated specially, so a -- line comment can swallow the code after it once line breaks are rewritten; remove comments first if that matters. Backtick or bracket-quoted identifiers are treated as ordinary words, and the output is meant for reading rather than as a canonical style.',
    },
  ],
}

export default content
