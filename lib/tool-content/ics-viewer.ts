import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'An .ics file is an iCalendar export: the format Google Calendar, Outlook, Apple Calendar and booking sites use to share events. Opening one usually means importing it into a calendar app, which is a hassle when you only want to see what is inside. This ICS viewer opens the file and lists every event in a table you can read at a glance.',
    'Each row shows the event title, start and end time, whether it is an all-day event, the location, and how it repeats in plain words, such as "Weekly on Monday, Wednesday". Times written in a specific time zone are converted to the time zone you choose, using your browser\'s own time-zone data, so a 9:00 meeting in Asia/Kolkata appears as 23:30 the previous day in New York. Repeating events are described, not expanded into every occurrence.',
    'Calendars can reveal a lot about your plans, so the file is read in your browser and processed on your device. You can also export the events as a CSV file to open in Excel or Google Sheets.',
  ],
  steps: [
    'Drop your .ics file onto the box, or click to choose it. You can also paste calendar text into the box below.',
    'Choose the time zone you want times shown in. It starts on your device\'s time zone.',
    'Read the table. Click the Start column to switch between earliest first and latest first.',
    'Click Download CSV to save the events as a spreadsheet file.',
  ],
  faq: [
    {
      q: 'How do I open an ICS file without importing it into my calendar?',
      a: 'Drop it here. The events are listed in a table without being added to any calendar, so you can check the contents first and import only if you want to.',
    },
    {
      q: 'How do I convert an ICS file to CSV or Excel?',
      a: 'Load the file, pick the time zone you want, and click Download CSV. The CSV has one row per event with the summary, start, end, all-day flag, location, repeat rule in words and description, and opens directly in Excel or Google Sheets.',
    },
    {
      q: 'Why are the times different from what I expected?',
      a: 'Times are converted to the time zone selected above the table. Change it to the zone you have in mind. Events stored as UTC or with a named zone are converted, all-day events keep their dates, and events with no zone at all are shown exactly as written.',
    },
    {
      q: 'Why does an all-day event end on the same day it starts?',
      a: 'In the iCalendar format the end date of an all-day event is the day after it finishes. The viewer shows the last day the event actually covers, which is easier to read.',
    },
    {
      q: 'Does it show every occurrence of a repeating event?',
      a: 'No. Each repeating event appears once, with its repeat rule described in words, for example "Every 2 weeks on Tuesday" or "Monthly on the last Friday, 10 times".',
    },
  ],
}

export default content
