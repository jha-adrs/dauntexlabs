import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This date calculator adds or subtracts a number of days, weeks, months or years from any date and tells you the resulting date and the day of the week it falls on. Use it to find a deadline 90 days from today, the end of a 6-month notice period, a due date 40 weeks out, or what date it was 30 days ago.',
    'Month and year maths follows the calendar, so adding one month to 31 January lands on the last day of February rather than spilling into March. Everything is calculated in your browser.',
  ],
  steps: [
    'Choose Add or Subtract at the top.',
    'Pick the Start date.',
    'Enter the Amount as a whole number.',
    'Choose the Unit: Days, Weeks, Months or Years.',
    'Read the result date, written out in full with its weekday, and copy it if you need it.',
  ],
  faq: [
    {
      q: 'How do I add days to a date?',
      a: 'Leave the mode on Add, pick your start date, type the number of days in Amount and keep the unit on Days. The result updates straight away. To count backwards, switch to Subtract.',
    },
    {
      q: 'Does the start date count as day one?',
      a: 'No. Adding 1 day to 1 March gives 2 March. If your rule says the start date counts as day one, subtract one from the amount you enter.',
    },
    {
      q: 'What happens when I add a month to the 31st?',
      a: 'If the target month is shorter, the result is clamped to its last day. For example 31 January plus 1 month gives 28 February (or 29 February in a leap year), and 29 February plus 1 year gives 28 February.',
    },
    {
      q: 'Can it count business days only?',
      a: 'No. The calculator counts calendar days, including weekends and public holidays. For working-day deadlines you will need to adjust the amount yourself.',
    },
    {
      q: 'How do I find the number of days between two dates?',
      a: 'That is the opposite question. Use the Date Difference Calculator, which takes a start and end date and returns the days, weeks, months and years between them.',
    },
  ],
}

export default content
