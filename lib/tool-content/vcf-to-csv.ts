import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'A .vcf file (also called a vCard) is the standard way phones and email apps export contacts. iPhone, Android, iCloud, Outlook and most address books can save your contacts as one .vcf file holding every card. Spreadsheets and many import screens, though, want a CSV file with one contact per row. This tool converts a VCF file to CSV so you can open your contacts in Excel or Google Sheets, clean them up, or move them to another service.',
    'It reads vCard versions 2.1, 3.0 and 4.0, including files with many contacts, long lines that are wrapped across several lines, and older Android exports where names with accents are stored as quoted-printable text. Names, email addresses, phone numbers with their type, company, job title, postal addresses, birthday, website and notes are kept. Photos are left out.',
    'Contact lists are personal data, so the conversion runs in your browser: the file is processed on your device rather than on a server.',
  ],
  steps: [
    'Drop your .vcf file onto the box, or click it to choose the file. You can also paste vCard text into the box below it.',
    'Pick a column layout: Generic for spreadsheets, Google Contacts for importing into Gmail, or Outlook for importing into Outlook.',
    'Check the preview of the first 20 contacts and the count of contacts read and skipped.',
    'Click Download CSV and open the file in Excel or Google Sheets, or import it into your contacts app.',
  ],
  faq: [
    {
      q: 'How do I convert a VCF file to Excel?',
      a: 'Convert it to CSV here with the Generic layout, then open the downloaded CSV in Excel. Each contact becomes one row, with separate columns for each email address, phone number and address. The file is saved as UTF-8 with a byte order mark so Excel shows accented names correctly.',
    },
    {
      q: 'How do I import VCF contacts into Gmail or Google Contacts?',
      a: 'Google Contacts can import a .vcf file directly. If you want to review or edit the contacts first, choose the Google Contacts layout, download the CSV, edit it in a spreadsheet, and then use Import in Google Contacts. The columns use the names Google expects, such as Given Name, E-mail 1 - Value and Phone 1 - Value.',
    },
    {
      q: 'What does the Outlook layout do with extra phone numbers?',
      a: 'Outlook has fixed columns: three email addresses, one number per kind (mobile, home, business, fax, pager, other) and one home and one business address. Anything that does not fit in those columns is added to the Notes column so it is not lost.',
    },
    {
      q: 'Why were some contacts skipped?',
      a: 'A card is skipped when it is cut off (it has no END:VCARD line) or has no name, email, phone or company at all. The tool tells you how many were skipped so you can check the original file.',
    },
    {
      q: 'Does it work with an iPhone or Android contacts export?',
      a: 'Yes. iPhone and iCloud exports use vCard 3.0, and Android exports often use vCard 2.1 with quoted-printable names. Both are read, along with vCard 4.0 files that store phone numbers as tel: links.',
    },
  ],
}

export default content
