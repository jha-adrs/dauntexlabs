import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'The attendance calculator tells you where you stand against a minimum attendance requirement. Enter the classes held so far, the classes you attended and the percentage you need, and it shows your current attendance, how many classes you can miss in a row and still stay at or above the target, or how many you must attend in a row to climb back to it. The target starts at 75%, a common figure in Indian colleges and schools, but you can change it to whatever your institution asks for.',
    'If you know how many classes are left in the term, add that too. The calculator then works out how many of those remaining classes you must attend to finish at or above the target, how many you can afford to skip, and, if the target is out of reach, the best percentage you can still end with. All arithmetic uses whole classes, and it is designed to run in your browser with no sign-up.',
  ],
  steps: [
    'Enter the total number of classes held so far.',
    'Enter how many of those classes you attended.',
    'Set the required attendance percentage; check your own institution’s rule, since it varies.',
    'Optionally enter the number of classes remaining in the term or semester.',
    'Read your current percentage and how many classes you can miss, or must attend, to stay on target.',
  ],
  faq: [
    {
      q: 'How is attendance percentage calculated?',
      a: 'Divide the classes you attended by the classes held and multiply by 100. Attending 42 of 50 classes gives 42 ÷ 50 × 100 = 84%.',
    },
    {
      q: 'How many classes can I miss and still keep 75%?',
      a: 'Every class you miss still counts as held, so the number is found from (100 × attended − 75 × held) ÷ 75, rounded down. With 42 of 50 attended you can miss 6 classes: 42 out of 56 is exactly 75%. Missing a seventh would drop you to about 73.7%.',
    },
    {
      q: 'How many classes do I need to attend to get back to 75%?',
      a: 'If you are below the target, each class you attend raises both the attended and held totals. The count is (75 × held − 100 × attended) ÷ 25, rounded up. With 30 of 50 attended (60%) you need 30 more in a row: 60 out of 80 is 75%.',
    },
    {
      q: 'What if the target cannot be reached before the term ends?',
      a: 'Enter the classes remaining. If you would need more classes than are left, the calculator says the target is not reachable and shows the best percentage you can still get by attending every remaining class. With 30 of 50 attended and 20 classes left, the best possible is 71.43%.',
    },
    {
      q: 'Is the required attendance always 75%?',
      a: 'No. The minimum varies between boards, universities, colleges and even individual courses, and some institutions count medical leave or other exemptions differently. Treat this tool as arithmetic only and confirm the exact rule, and how it is counted, with your institution.',
    },
  ],
}

export default content
