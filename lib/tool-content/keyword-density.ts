import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This keyword density analyzer counts how often each word appears in a piece of text and shows what share of the total word count it makes up. Paste a blog post, product description or landing page copy and you get a ranked table of keywords with their count, their density as a percentage and a small bar for quick comparison.',
    'Writers and SEO folks use a keyword density checker to spot words they have repeated too often, confirm that the main topic actually shows up in the copy, and compare drafts. The analysis runs in your browser as you type, so you can check unpublished drafts and client copy without pasting them into another service.',
  ],
  steps: [
    'Paste or type your content into the Content box on the left.',
    'Read the keyword density table on the right: each row shows the word, how many times it appears and its density.',
    'Turn on "Ignore stop words" to hide common filler words such as "the", "and" and "with".',
    'Use the length menu (Min 1 char to Min 5 chars) to drop very short words from the list.',
    'Use the Top 10 / 20 / 50 / 100 menu to choose how many keywords are listed.',
  ],
  faq: [
    {
      q: 'How is keyword density calculated?',
      a: 'Density is the number of times a word appears divided by the total number of words in the text, multiplied by 100. The total always counts every word, so filtering out stop words or short words removes them from the list but does not change the percentages of the words that remain.',
    },
    {
      q: 'What is a good keyword density for SEO?',
      a: 'There is no official target. Search engines care far more about whether a page answers the question well than about a specific percentage. Use the numbers as a sanity check: if one term is far above everything else and the text reads awkwardly, it is probably overused.',
    },
    {
      q: 'Does it analyze phrases or only single words?',
      a: 'It counts single words only. Text is lowercased and most punctuation is stripped, so "SEO", "seo" and "seo," are counted as the same word. Hyphenated words and apostrophes inside words are kept together.',
    },
    {
      q: 'Can I check the keyword density of a live URL?',
      a: 'No. The tool does not fetch web pages. Copy the visible text from the page (or your draft) and paste it into the content box.',
    },
    {
      q: 'Which languages does the keyword analyzer support?',
      a: 'It works best with English. The word splitter keeps only the letters a to z, digits, hyphens and apostrophes, so accented and non-Latin characters are treated as separators, and the stop-word list is English only.',
    },
  ],
}

export default content
