import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This tool lets you type Hindi on an ordinary English keyboard, without installing a font, a keyboard driver or typing software. Pick the Remington (Gail) layout that typists and government typing tests use, or the InScript layout that ships with Windows, Android and macOS, and type the keys you already know. The Hindi appears as proper Unicode Devanagari that works in email, WhatsApp, Word, Google Docs and websites.',
    'Remington (Gail) is the old typewriter layout behind Kruti Dev and DevLys. On it the short-i matra (ि) is typed before its letter and the reph (र् above a letter) after the syllable, just as on a typewriter. The tool reorders both into correct Unicode. InScript is typed in reading order, letter first and matra after, with d as the halant for half letters. Everything is converted in your browser, so your text is processed on your device.',
  ],
  steps: [
    'Choose Remington (Gail) or InScript at the top.',
    'Click the left box and type with your usual finger positions. Backspace, paste and undo work on the keys you typed.',
    'Watch the Hindi build up on the right as you type.',
    'Use the layout chart below if you forget where a letter sits. Each tile shows the Hindi character and the key that types it, with Shift keys in capitals and symbols.',
    'Copy the Hindi, or download it as a .txt file.',
  ],
  faq: [
    {
      q: 'Which layout should I choose?',
      a: 'If you learned Hindi typing on a typewriter, at a typing institute or for an exam such as SSC, court or state government posts that ask for Kruti Dev, choose Remington (Gail). If you use the Hindi keyboard built into Windows or your phone, or are learning from scratch, InScript is the official standard and the easier one to start with.',
    },
    {
      q: 'Is Remington Gail the same as Kruti Dev?',
      a: 'Yes. The Kruti Dev 010 and DevLys 010 fonts follow the Remington Gail key layout, so "Hkkjr" typed here gives भारत, exactly as it would in Word with Kruti Dev selected. The difference is that this tool gives you Unicode Hindi, which looks right in any font and on any device.',
    },
    {
      q: 'Why do I see English letters in the left box?',
      a: 'The left box records the keys exactly as you press them. Keeping the raw keys means Backspace and editing behave predictably, and the Hindi on the right is recalculated each time, so a short-i or reph typed out of order still lands in the right place.',
    },
    {
      q: 'How do I type half letters and conjuncts?',
      a: 'In InScript, type the letter, then d (halant), then the next letter: k d k gives क्क. Shift with 5, 6, 7 and 8 gives ज्ञ, त्र, क्ष and श्र directly. In Remington, half letters have their own keys, shown in the chart with a halant mark.',
    },
    {
      q: 'Does it work without internet or on a phone?',
      a: 'Once the page has loaded, typing and conversion are done by your browser, so it keeps working if the connection drops. On a phone it works with a hardware or on-screen English keyboard, and the layout chart wraps to fit narrow screens.',
    },
  ],
}

export default content
