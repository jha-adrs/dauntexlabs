import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This SQL to CSV converter turns the result table you get from a database client into a clean CSV file you can open in Excel, Google Sheets or any other spreadsheet. It understands the MySQL-style ASCII tables with +----+ borders that the mysql command line prints, as well as rows separated by pipes or tabs, which covers most copy-and-paste output from SQL consoles.',
    'It also works the other way round. In "Data → INSERT" mode you paste CSV with a header row and get ready-to-run INSERT statements for a table name you choose. The conversion happens in your browser, which is handy when the rows contain customer or internal data you would rather not paste into a random website.',
  ],
  steps: [
    'Pick a mode at the top: "Result → CSV" to convert a query result, or "Data → INSERT" to build SQL from CSV.',
    'For Result → CSV, paste the result set into the SQL result set box, including the header row.',
    'For Data → INSERT, paste CSV whose first row is the column names, then set the Table name.',
    'Turn on "Multi-row INSERT" if you want a single INSERT with many VALUES groups instead of one statement per row.',
    'Copy the output, or use the download button to save it as result.csv or inserts.sql.',
  ],
  faq: [
    {
      q: 'Does this tool run my SQL query?',
      a: 'No. It does not connect to a database. Run the query in your own client, then paste the printed result here to convert it to CSV.',
    },
    {
      q: 'Which result formats can it read?',
      a: 'MySQL command-line tables with +---+ border lines, pipe-separated rows (with or without leading and trailing pipes), and tab-separated rows such as those copied from many GUI clients. The first row is always treated as the column headers.',
    },
    {
      q: 'How are commas and quotes handled in the CSV?',
      a: 'Any value that contains a comma, a double quote or a line break is wrapped in double quotes, and quotes inside it are doubled, following the usual CSV convention so spreadsheets read it correctly.',
    },
    {
      q: 'How are values typed in the generated INSERT statements?',
      a: 'Empty cells and the word NULL become NULL, plain numbers are left unquoted, and everything else is written as a single-quoted string with single quotes escaped. Column and table names are wrapped in backticks, which is MySQL syntax; adjust them if your database expects double quotes.',
    },
  ],
}

export default content
