import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'WhatsApp lets you export any chat as a plain .txt file, but reading that file is awkward: every message is one long line with the date, time and sender squeezed in front, and long messages wrap across several lines. This tool turns an exported chat into a table with separate date, time, sender and message columns. You can search it, filter it to one person, see how many messages each person sent, and download the result as a CSV file for Excel or Google Sheets, or as JSON.',
    'It reads exports from Android and iPhone, in 12-hour and 24-hour time, with dates written with slashes, dots or year first. Messages that run over several lines are kept together, and photos and other attachments are marked as media. Notices such as "Messages and calls are end-to-end encrypted" or a group being renamed are usually marked as system lines with no sender, although some iPhone group notices may appear under the group name instead. Timestamps are kept exactly as your phone wrote them.',
    'A private conversation is about as personal as a file gets, so the chat is designed to be processed in your browser, on your device, rather than on a server. This tool is independent and is not affiliated with WhatsApp or Meta.',
  ],
  steps: [
    'In WhatsApp, open the chat, tap the menu (Android: More, then Export chat; iPhone: the contact or group name, then Export Chat) and choose Without media.',
    'On iPhone the export is a .zip file. Unzip it first and use the _chat.txt file inside.',
    'Drop the .txt file onto the box above, or click it to choose the file. You can also paste the chat text.',
    'Search, or pick a sender from the list to see only their messages. The list shows how many messages each person sent.',
    'Click Download CSV or Download JSON. The download contains the messages that match your current search and sender filter.',
  ],
  faq: [
    {
      q: 'How do I convert a WhatsApp chat to Excel?',
      a: 'Export the chat from WhatsApp without media, drop the .txt file here and click Download CSV. Open the CSV in Excel or Google Sheets and each message is one row with Date, Time, Sender, Message and Type columns. The file is saved as UTF-8 with a byte order mark so emoji and non-English names show correctly in Excel.',
    },
    {
      q: 'Why does it ask whether dates are day-first or month-first?',
      a: 'WhatsApp writes dates in your phone\'s regional format, and a date like 03/04/23 can mean 3 April or 4 March. If any date in the chat has a day above 12, the order is clear and the tool picks it for you. If every date could be read both ways, it assumes day-first and shows a switch so you can choose the order your phone uses.',
    },
    {
      q: 'Can it open the .zip file from an iPhone export, or show photos?',
      a: 'No. Unzip the export first and drop the _chat.txt file. Photos, videos, voice notes and documents are not shown; their lines are kept and marked as media so you can still see who sent what and when.',
    },
    {
      q: 'Why does a message in the CSV start with an apostrophe?',
      a: 'Spreadsheets treat a cell that starts with =, +, - or @ as a formula, and a formula such as =HYPERLINK could send data off your computer when the file is opened. Messages that start that way get a leading apostrophe so they show as plain text. Phone numbers used as sender names are left as they are.',
    },
    {
      q: 'Is this an official WhatsApp tool?',
      a: 'No. It is an independent tool that reads the text file WhatsApp produces when you export a chat. It is not affiliated with, endorsed by or connected to WhatsApp or Meta. The export format is not officially documented, so an unusual phone setting may produce lines it does not recognise; those lines are added to the message before them.',
    },
  ],
}

export default content
