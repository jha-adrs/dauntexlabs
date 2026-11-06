import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This date calculator adds or subtracts a number of days, weeks, months or years from any date and tells you the resulting date and the day of the week it falls on. Use it to find a deadline 90 days from today, the end of a 6-month notice period, a due date 40 weeks out, or what date it was 30 days ago.',
    'Switch to Business days to count working days instead: it skips weekends (Saturday and Sunday, Friday and Saturday, or Sunday only) and any holiday dates you paste in. Month and year maths follows the calendar, so adding one month to 31 January lands on the last day of February rather than spilling into March. Everything is calculated in your browser.',
  ],
  steps: [
    'Choose Add or Subtract, then Calendar or Business days.',
    'Pick the Start date, or press Today to use the current date.',
    'In Calendar mode, enter the Amount as a whole number and choose the Unit: Days, Weeks, Months or Years.',
    'In Business days mode, enter the number of working days, choose which days are the Weekend and optionally paste your holidays, one date per line in YYYY-MM-DD form.',
    'Read the result date, written out in full with its weekday, and copy it if you need it.',
  ],
  faq: [
    {
      q: 'How do I add working days to a date?',
      a: 'Choose Business days, pick the start date and type the number of working days. With a Saturday and Sunday weekend, 2 business days after Thursday 5 November 2026 is Monday 9 November. Paste public holidays into the Holidays box and they are skipped too; the line under the box tells you how many dates were read and lists any line it could not read.',
    },
    {
      q: 'Does the start date count as day one?',
      a: 'No, in either mode. Adding 1 day to 1 March gives 2 March, and adding 1 business day to a Thursday gives the Friday. Adding 0 returns the start date. If your rule says the start date counts as day one, subtract one from the amount you enter.',
    },
    {
      q: 'What happens when I add a month to the 31st?',
      a: 'If the target month is shorter, the result is clamped to its last day. For example 31 January plus 1 month gives 28 February (or 29 February in a leap year), and 29 February plus 1 year gives 28 February.',
    },
    {
      q: 'Does it know my country’s public holidays?',
      a: 'No. There are no built-in holiday calendars, because they differ by country, state and employer. Paste the dates that apply to you: any YYYY-MM-DD date in the text is read, so a list such as "2026-01-26 Republic Day" works as it is.',
    },
    {
      q: 'Will the result change with my time zone?',
      a: 'No. The calculation works on calendar dates in UTC, so a daylight-saving change or your device’s time zone cannot shift the answer by a day. Only the Today button reads your device clock, to fill in your local date.',
    },
    {
      q: 'How do I find the number of days between two dates?',
      a: 'That is the opposite question. Use the Date Difference Calculator, which takes a start and end date and returns the days, weeks, months and years between them.',
    },
  ],
}

export default content
