import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Shivaji is a legacy Marathi font that was widely used in Maharashtra for office documents, shop bills, school material and older software. Shivaji text is stored as ordinary keyboard letters, so "महाराष्ट्र" saved in Shivaji reads "maharaYT/" anywhere the font is missing. This tool converts Shivaji text into Unicode Marathi that displays correctly on any phone or computer and can be searched, shared and published online.',
    'Support is deliberately partial. No reliable published Shivaji character map exists, and the tables that do exist disagree with real Shivaji documents for several letters. So the converter only maps the letters and matras that real Shivaji text confirms, which covers most everyday Marathi. Anything it cannot confirm is left exactly as typed. Converting Unicode into Shivaji is not offered for the same reason. The conversion runs in your browser, on your device.',
  ],
  steps: [
    'Keep Legacy → Unicode selected.',
    'Copy text from your Shivaji document and paste it into the left box.',
    'Read the Unicode Marathi on the right and look for any leftover Latin characters, which mark glyphs that were not converted.',
    'Fix any leftovers by hand, then copy the result or download it as a .txt file.',
  ],
  faq: [
    {
      q: 'How do I convert Shivaji font to Unicode Marathi?',
      a: 'Paste the Shivaji text into the left box. The Unicode Marathi appears on the right. Check it for leftover Latin characters, which mark the few glyphs the converter does not change.',
    },
    {
      q: 'Why does my Marathi text show as English letters?',
      a: 'Shivaji draws Marathi letters over normal keyboard characters, so "dinank" written as "idnaaMk" only looks like दिनांक when the Shivaji font is applied. Unicode Marathi works in any font.',
    },
    {
      q: 'Why can\'t I convert Unicode to Shivaji?',
      a: 'Writing Shivaji text needs a complete, reliable map of the font, and we could not verify one. A wrong map would give you text that looks broken once the font is applied, so this direction is switched off instead of guessed.',
    },
    {
      q: 'Which letters are converted?',
      a: 'The common consonants, the short and long matras (ा ि ी ु ू े ै ो ौ), anusvara, the chandra (ॅ, as in बँक and हॉटेल), the reph (as in पासवर्ड) and the rakar (as in महाराष्ट्र). Rarer conjunct glyphs are left as typed.',
    },
    {
      q: 'Is Shivaji the same as Shusha?',
      a: 'They are close but not identical. Published references describe Shivaji as using the Shusha layout, yet real Shivaji text differs for letters such as प, त and ख. That is why this tool does not simply reuse a Shusha map.',
    },
  ],
}

export default content
