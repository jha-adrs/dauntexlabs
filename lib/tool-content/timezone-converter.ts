import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This time zone converter shows what a given date and time in one place is in several other places at once. Use it to schedule a meeting across offices, check when a launch or live stream starts for your audience, or work out a flight arrival in local time.',
    'You pick zones by their IANA names, such as America/New_York or Asia/Kolkata. The zone list comes from your browser and usually includes every zone it knows about; older browsers fall back to a short list of major cities. Because it uses named zones rather than fixed offsets, daylight saving time is applied for the date you choose, not just for today. The conversion runs in your browser using its built-in time zone data.',
  ],
  steps: [
    'Set the Date & time field to the wall-clock time you want to convert, or click now for the current time.',
    'Choose where that time applies in Source timezone; the line below confirms how it is being interpreted.',
    'Review the target timezones list, which starts with New York, London, Kolkata and Tokyo, and change any zone from its dropdown.',
    'Click + add zone to add another row, or the × button to remove one.',
    'Read each converted date and time next to its zone.',
  ],
  faq: [
    {
      q: 'Does it handle daylight saving time?',
      a: 'Yes. Each conversion uses the rules for that zone on the date you entered, so a July date in London is shown an hour later than the same UTC time in January. Times that fall inside the hour skipped or repeated when clocks change are ambiguous, and the result for those may be an hour different from what you expect.',
    },
    {
      q: 'Why are zones listed by city instead of abbreviations like EST or IST?',
      a: 'Abbreviations are ambiguous, since IST can mean India, Ireland or Israel, and they do not say when daylight saving applies. IANA names like Asia/Kolkata identify one set of rules. The converted time is still shown with an abbreviation or offset where your browser provides one.',
    },
    {
      q: 'How accurate are the results?',
      a: 'They rely on the time zone database built into your browser, which is updated with browser and operating system releases. If a government changes its clock rules at short notice, an older browser may not know yet.',
    },
    {
      q: 'Why does the result format look different on another computer?',
      a: "Dates and times are formatted in your browser's language and region settings, so the order of day and month and the 12- or 24-hour clock follow your locale.",
    },
    {
      q: 'Are my zone choices saved?',
      a: 'No. The tool starts with UTC as the source and the four default target zones each time the page loads.',
    },
  ],
}

export default content
