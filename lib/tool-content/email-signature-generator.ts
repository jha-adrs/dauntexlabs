import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This email signature generator builds a clean, professional signature from a few details: full name, job title, company, email, phone, website and an optional tagline. It shows a live preview as you type and produces the matching HTML, laid out as a simple table with inline styles and a thin blue accent bar, because most email clients strip stylesheets.',
    'Use it to make a Gmail signature, an Outlook signature or a signature for any client that accepts HTML. Empty fields are simply left out, the email becomes a mailto link and the website becomes a clickable link (https:// is added if you leave it off). The signature is built in your browser.',
  ],
  steps: [
    'Fill in Full name, Job title, Company, Email, Phone and Website, plus Tagline (optional) if you want one.',
    'Check the live preview; it updates with every keystroke.',
    'To paste into a rich editor such as Gmail, select the rendered preview with your mouse, copy it, and paste it into the signature box.',
    'To use the code instead, press copy HTML and paste it wherever your email client or signature tool accepts raw HTML.',
  ],
  faq: [
    {
      q: 'How do I add this signature to Gmail?',
      a: 'Open Gmail settings, go to the Signature section and create or edit a signature. The signature box is a formatted-text editor, so paste the rendered preview you selected and copied from this page, not the HTML code. Pasting the code would show the tags as text.',
    },
    {
      q: 'How do I add it to Outlook?',
      a: "In Outlook's signature settings, paste the selected and copied preview into the signature editor in the same way. If your setup lets you edit signature HTML directly, the copy HTML button gives you the code for that.",
    },
    {
      q: 'What does the copy HTML button copy?',
      a: 'It copies the HTML source as plain text. That is useful for HTML signature fields, templates or code, but rich editors expect formatted content, which is why selecting and copying the preview works better there.',
    },
    {
      q: 'Can I add a logo, photo or social icons?',
      a: 'No. The generator covers text details and links only: name, title, company, email, phone, website and tagline. There is no image, colour or layout option.',
    },
    {
      q: 'Why do some fields not appear in the signature?',
      a: 'Any field left blank is omitted, and title and company are joined on one line. If every field is empty, the preview is replaced by a prompt to fill in at least one field.',
    },
  ],
}

export default content
