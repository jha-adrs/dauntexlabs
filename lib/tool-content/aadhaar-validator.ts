import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'An Aadhaar number has 12 digits, never starts with 0 or 1, and its last digit is a check digit calculated with the Verhoeff algorithm. That check catches almost every single-digit typo and most swapped neighbouring digits, which makes it a quick way to spot a mistyped number in a form, a KYC sheet or a payroll record before it causes a rejection.',
    'This Aadhaar validator runs those format checks and tells you whether the number is well formed. It cannot tell you whether an Aadhaar number was actually issued or who it belongs to: there is no lookup, and only UIDAI can confirm that. A number that passes here could still be unissued, and a real number typed correctly will always pass.',
    'Because an Aadhaar number is sensitive, the result is shown masked to the last four digits by default, the way UIDAI recommends sharing it, and the check is processed on your device in your browser.',
  ],
  steps: [
    'Type or paste the 12-digit number. Spaces and hyphens are ignored, so 1234 5678 9012 and 1234-5678-9012 both work.',
    'Read the result. A valid number shows "Format valid"; otherwise you see what failed: length, first digit or check digit.',
    'Turn on Show full number if you need to compare every digit; it is masked again when you turn it off.',
    'If you need to share a scan of the card, use the Aadhaar masker to cover the first eight digits.',
  ],
  faq: [
    {
      q: 'Can this tool tell me if an Aadhaar number is real?',
      a: 'No. It checks the format and the check digit only. Whether a number was issued, and to whom, can only be confirmed through UIDAI\'s own verification services.',
    },
    {
      q: 'What is the Verhoeff algorithm?',
      a: 'A check-digit scheme based on the dihedral group D5, using a multiplication table, a permutation table and an inverse table. Unlike a simple sum, it detects every single-digit error and every swap of two adjacent digits. Aadhaar uses it for its 12th digit.',
    },
    {
      q: 'Why can an Aadhaar number not start with 0 or 1?',
      a: 'UIDAI reserves those leading digits, so issued numbers begin with 2 to 9. A number starting with 0 or 1 is rejected before the check digit is tested.',
    },
    {
      q: 'What is a masked Aadhaar number?',
      a: 'A masked Aadhaar shows only the last four digits, with the first eight replaced by X. UIDAI encourages using the masked form where the full number is not needed, which is why the result here is masked by default.',
    },
  ],
}

export default content
