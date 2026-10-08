import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'The flight time and fuel calculator answers two questions every cross-country plan needs: how long will the leg take, and how much fuel do I need on board? Enter the distance in nautical miles, your planned ground speed in knots and the fuel burn per hour, choose a 30 or 45 minute reserve, and it returns the flight time, trip fuel, reserve fuel and total fuel required.',
    'Fuel can be planned in US gallons, litres or pounds. The tool also converts the total into weight using typical densities of about 6 lb per US gallon for avgas and 6.7 lb per US gallon for Jet A, which is handy when you move on to weight and balance. Actual fuel density varies with temperature, so treat the weight as an estimate. Everything is designed to run in your browser.',
  ],
  steps: [
    'Measure the leg distance in nautical miles on your chart or planning software.',
    'Enter the planned ground speed in knots, after correcting true airspeed for wind.',
    'Choose the fuel unit and enter the burn rate per hour from your POH for the planned power setting.',
    'Pick a 30 or 45 minute reserve and the fuel type.',
    'Read the flight time, trip fuel, reserve fuel and total fuel, and add allowances for taxi, climb and diversions.',
  ],
  faq: [
    {
      q: 'How do you calculate flight time?',
      a: 'Divide distance by ground speed to get hours, then multiply by 60 for minutes. A 150 nm leg at 120 kt ground speed takes 1.25 hours, which is 1 h 15 min.',
    },
    {
      q: 'How much fuel do I need for a flight?',
      a: 'Multiply the flight time in hours by the fuel burn per hour, then add the reserve. At 10 gal per hour, 75 minutes needs 12.5 gal, and a 45 minute reserve adds 7.5 gal, for 20 gal in total. Add taxi, climb and contingency fuel as your operation requires.',
    },
    {
      q: 'Should I use a 30 or 45 minute reserve?',
      a: 'Under US rules, 30 minutes is a common day VFR minimum and 45 minutes applies to night VFR and IFR planning; other countries have their own rules. Many pilots carry more than the legal minimum. Check the regulations that apply to you.',
    },
    {
      q: 'How heavy is avgas compared with Jet A?',
      a: 'Avgas weighs about 6 lb per US gallon and Jet A about 6.7 lb per US gallon at standard temperature. One US gallon is 3.78541 litres. The calculator uses these values to show total fuel weight.',
    },
    {
      q: 'Is this a substitute for my flight plan or POH?',
      a: 'No. It is for training and planning only. Burn rates vary with power setting, altitude and leaning, so cross-check with your POH and approved planning tools.',
    },
  ],
}

export default content
