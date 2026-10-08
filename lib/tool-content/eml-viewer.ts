import type { ToolContent } from './types'

export default {
  intro: [
    'An .eml file is a single email saved in its raw form: the headers, the plain-text and HTML versions of the message, and any attachments, all packed into one text file. Outlook, Apple Mail, Thunderbird and Gmail ("Download message") can all save one, and they turn up as attachments, in legal or HR exports and in phishing reports. Opening one normally needs a mail client. This EML viewer opens it in the browser and shows the sender, recipients, date and subject, the message itself, and a list of attachments you can save one by one.',
    'Emails often contain tracking pixels: tiny remote images that tell the sender when and where a message was opened. Here the HTML body is shown inside a locked-down frame that blocks scripts and is designed to stop any remote image, stylesheet or font from loading, so opening a suspicious message in the viewer should not alert the sender. Images embedded inside the email itself are still shown.',
    'The file is read in your browser and processed on your device. Encoded subjects, quoted-printable and base64 bodies, and non-English character sets such as Hindi, Japanese or Western European text are decoded for you.',
  ],
  steps: [
    'Drop your .eml file onto the box, or click to choose it. You can also paste the raw message source into the box below.',
    'Read the summary of who sent the email, to whom and when. Click "Show all" to see every header, including the Received chain and authentication results.',
    'Read the message. If the email has both a formatted and a plain-text version, switch between them with the buttons above the message.',
    'Click Download next to any attachment to save it to your device.',
  ],
  faq: [
    {
      q: 'How do I open an EML file without Outlook?',
      a: 'Drop it here. The viewer reads the headers, the message body and the attachments in your browser, so you do not need a mail client or an account to see what is inside.',
    },
    {
      q: 'Is it safe to open a suspicious email here?',
      a: 'The HTML part is displayed in a sandboxed frame with scripts disabled and a content policy that only allows images embedded in the email itself. Remote images, tracking pixels, external stylesheets and links that try to navigate the frame are blocked. Attachments are not opened, only offered for download, so treat them with the usual care.',
    },
    {
      q: 'Why are some images missing?',
      a: 'Images that are hosted on a remote server are blocked on purpose, because loading them can tell the sender that you opened the message. Images that are attached inside the email are shown normally.',
    },
    {
      q: 'Can I see the full email headers?',
      a: 'Yes. Click "Show all" above the summary to list every header in order, including Received, Return-Path, DKIM and Authentication-Results lines, which help when checking whether an email is genuine.',
    },
    {
      q: 'Does it open MSG files from Outlook?',
      a: 'No. MSG is a different, binary Outlook format. Save or forward the message as .eml first, or use "Download message" or "Show original" in your mail app to get the raw source and paste it here.',
    },
  ],
} satisfies ToolContent
