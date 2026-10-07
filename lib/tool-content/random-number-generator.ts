import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This random number generator picks whole numbers between a minimum and a maximum you choose. Generate a single number to settle a decision or pick a winner, a list of numbers for a raffle or classroom draw, or a set of unique numbers for lottery-style picks where no value may repeat.',
    'Numbers come from your browser\'s cryptographic random source (crypto.getRandomValues) and use rejection sampling so that every value in the range is equally likely. They are generated on your device.',
  ],
  steps: [
    'Enter the Min and Max values; both ends are included.',
    'Enter how many numbers you want in Count (up to 10,000).',
    'Turn on "Unique values" if no number should appear twice.',
    'Choose Comma-separated or One per line for the output format.',
    'Click Generate, then copy the results.',
  ],
  faq: [
    {
      q: 'Are the numbers truly random?',
      a: 'They come from the Web Crypto random generator built into your browser, which is designed for security uses and is far less predictable than Math.random. That is plenty for games, draws and sampling. For regulated lotteries or gambling, use whatever certified process your rules require.',
    },
    {
      q: 'Are the minimum and maximum included?',
      a: 'Yes. A range of 1 to 6 can return 1, 6 or anything in between, just like a die.',
    },
    {
      q: 'How do I generate numbers without repeats?',
      a: 'Turn on "Unique values". The count cannot be larger than the size of the range, so asking for 10 unique numbers between 1 and 5 shows an error instead.',
    },
    {
      q: 'Can it generate decimals or negative numbers?',
      a: 'Negative whole numbers work: set Min to a negative value. Decimals are not supported; inputs are read as whole numbers.',
    },
    {
      q: 'How do I pick lottery numbers, say 6 from 1 to 49?',
      a: 'Set Min to 1, Max to 49, Count to 6 and turn on "Unique values", then click Generate. Click Generate again for a fresh set; each click draws new numbers independently of the last.',
    },
  ],
}

export default content
