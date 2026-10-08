import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'The weight and balance calculator checks that a loaded aircraft is under its maximum weight and that its centre of gravity (CG) sits inside the envelope. List each item, such as empty weight, pilot and passengers, baggage and fuel, with its weight and arm (distance from the datum). The tool multiplies each weight by its arm to get a moment, adds everything up and divides total moment by total weight to find the CG.',
    'There is no aircraft database: you enter the numbers from your own aircraft\'s POH and weight and balance report, including the forward and aft CG limits and the maximum weight. That keeps it usable for any type, in pounds and inches or kilograms and millimetres, as long as you stay consistent. The calculation is designed to run in your browser.',
  ],
  steps: [
    'Find the basic empty weight and arm on your aircraft\'s current weight and balance report.',
    'Enter each item\'s weight and arm; use "Add item" for extra stations and "Remove" for ones you do not need.',
    'Enter the forward and aft CG limits and the maximum weight from the POH.',
    'Read the total weight, total moment and CG, and check the within-limits result.',
    'Repeat with landing fuel to make sure the CG stays in limits as fuel burns off.',
  ],
  faq: [
    {
      q: 'How do you calculate centre of gravity?',
      a: 'For each item, moment = weight × arm. Add all the weights and all the moments, then divide total moment by total weight. For example, 1500 lb at 85 in, 340 lb at 87 in and 180 lb at 95 in give 2,020 lb and 174,180 lb-in, so the CG is at 86.23 in.',
    },
    {
      q: 'Why is there no list of aircraft?',
      a: 'Every individual aircraft has its own empty weight and CG, which change with equipment and repairs. Generic data can be dangerously wrong, so you enter the figures from the POH and the weight and balance report for the aircraft you will fly.',
    },
    {
      q: 'What does "out of limits" mean?',
      a: 'Either the total weight is above the maximum you entered, or the CG is forward of the forward limit or aft of the aft limit. The result explains which, and by how much, so you can move or remove load.',
    },
    {
      q: 'Does the envelope depend on weight?',
      a: 'In many aircraft the forward CG limit moves aft at higher weights. This tool checks a single rectangle of limits, so read the limits for your loaded weight from the POH envelope chart and enter those.',
    },
    {
      q: 'Can I use kilograms and millimetres?',
      a: 'Yes, as long as every weight, arm and limit uses the same units. It is for training and planning only; always confirm with the POH and approved loading documents.',
    },
  ],
}

export default content
