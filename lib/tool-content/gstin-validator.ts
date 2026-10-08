import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'A GSTIN is the 15-character Goods and Services Tax Identification Number every GST-registered business in India prints on its invoices. Typos are common: a swapped letter or a missing digit can hold up input tax credit, bounce an e-way bill or put a wrong number in your purchase register. This GSTIN validator checks the structure of a number and tells you exactly what is wrong with it.',
    'Each GSTIN is read part by part: the first two digits are the state code, the next ten characters are the PAN of the business, the 13th is the registration number for that PAN within the state, the 14th is always Z, and the 15th is a check character calculated from the first fourteen with the mod-36 method GSTN uses. The tool shows the state, the embedded PAN and the type of entity from the PAN\'s fourth letter, such as Company, Firm, Individual or HUF.',
    'You can paste a whole column of GSTINs from a spreadsheet and get a table back, then download the results as CSV. The numbers are processed on your device, and the tool does not contact the GST portal, so it cannot say whether a registration is active or cancelled.',
  ],
  steps: [
    'Paste one GSTIN per line into the box. Spaces around a number are ignored and lowercase letters are accepted.',
    'Read the results table. Valid numbers show the state, PAN and entity type; invalid ones show the reason.',
    'Fix any number marked with a wrong check character by comparing it against the original invoice or certificate.',
    'Click Download CSV to save every result, including the error messages, as a spreadsheet file.',
  ],
  faq: [
    {
      q: 'How is the GSTIN check character calculated?',
      a: 'Each of the first 14 characters is converted to a value from 0 to 35 (digits, then A to Z). Values in odd positions are multiplied by 1 and in even positions by 2; each product is split into quotient and remainder by 36 and both are added up. The check character is (36 − sum mod 36) mod 36, turned back into a digit or letter.',
    },
    {
      q: 'Does a valid result mean the GSTIN is registered?',
      a: 'No. It means the number is well formed and its check character is correct. To confirm a business is actually registered and active, use the search on the official GST portal.',
    },
    {
      q: 'What do state codes 97 and 99 mean?',
      a: 'Code 97 is used for other territory, such as offshore areas, and 99 is used for Centre jurisdiction registrations. Both are accepted alongside the regular state and union territory codes 01 to 38.',
    },
    {
      q: 'How does the tool know the entity type?',
      a: 'From the fourth letter of the PAN inside the GSTIN: P is an individual, C a company, H a Hindu undivided family, F a firm, A an association of persons, T a trust, and so on. It reflects how the PAN was issued, not the GST registration category.',
    },
    {
      q: 'Can I check many GSTINs at once?',
      a: 'Yes. Paste as many lines as you like; blank lines are skipped. The summary shows how many are valid and invalid, and the CSV export keeps them in the same order.',
    },
  ],
}

export default content
