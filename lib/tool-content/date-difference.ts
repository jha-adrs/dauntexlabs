import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This date difference calculator tells you how many days are between two dates. Along with the total number of days it shows the gap in weeks plus leftover days, and a calendar breakdown in years, months and days. It is useful for counting down to an event, working out someone\'s exact age, checking how long a contract or project ran, or measuring the gap between two invoices.',
    'The calculation runs in your browser, and the order of the dates does not matter: if the end date is earlier than the start date, the tool simply swaps them.',
  ],
  steps: [
    'Pick the Start date.',
    'Pick the End date.',
    'Read the total days, the weeks-and-days figure and the years, months and days breakdown.',
    'Click the copy button to copy a one-line summary, such as "45 days (0y 1m 14d)".',
  ],
  faq: [
    {
      q: 'How do I calculate the number of days between two dates?',
      a: 'Enter both dates and the total appears straight away. It counts the days from the start date to the end date, so 1 March to 2 March is 1 day.',
    },
    {
      q: 'Does it include the end date?',
      a: 'No. The count is exclusive of the end date, which is the usual way to measure a duration. If you need an inclusive count, for example for a hotel stay counted in nights versus days, add one to the result.',
    },
    {
      q: 'How are months and years counted in the breakdown?',
      a: 'The breakdown follows the calendar rather than averaging month lengths. From 15 January to 20 March is 2 months and 5 days, whatever the number of days in February. Leap years are handled automatically.',
    },
    {
      q: 'Can it count weekdays or business days only?',
      a: 'No. All results are in calendar days, including weekends and holidays.',
    },
    {
      q: 'Can I add a number of days to a date instead?',
      a: 'Yes, with the Date Add / Subtract tool. Give it a start date and an amount of days, weeks, months or years, and it returns the resulting date and weekday.',
    },
  ],
}

export default content
