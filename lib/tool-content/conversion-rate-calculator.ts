import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This conversion rate calculator works out what share of your visitors took the action you care about: a sale, a sign-up, a download or a booked call. Enter conversions and total visits and it shows the rate to two decimal places. The formula is simple: conversions ÷ visits × 100. For example, 25 sales from 500 visits is a 5.00% conversion rate.',
    'It also answers the planning questions that come straight after. Switch to Visits needed to find out how much traffic a target takes at a given rate, or to Conversions needed to estimate the results a traffic forecast should bring. Add an average order value and it turns the rate into revenue and revenue per visitor in US dollars, euros, pounds or Indian rupees. All the maths runs in your browser.',
  ],
  steps: [
    'Pick a mode at the top: Conversion rate, Visits needed or Conversions needed.',
    'In Conversion rate mode, enter Conversions and Total Visits. The rate appears as soon as both are filled in.',
    'Optionally type an Average order value and choose the Currency to see Revenue and Revenue per visitor.',
    'In Visits needed mode, enter Target conversions and your Conversion rate (%). In Conversions needed mode, enter Visits and the rate.',
    'Use the copy button on the results panel to copy the figures for a report or spreadsheet.',
  ],
  faq: [
    {
      q: 'How do I calculate conversion rate?',
      a: 'Divide the number of conversions by the number of visits, then multiply by 100. 40 conversions from 1,600 visits is 40 ÷ 1,600 × 100 = 2.5%. Use the same definition of a visit (sessions or unique visitors) every time you compare periods, or the rates will not be comparable.',
    },
    {
      q: 'How many visitors do I need to hit a sales target?',
      a: 'Choose Visits needed, enter the conversions you want and your conversion rate. The calculator divides the target by the rate and rounds up to a whole visit, because you cannot have part of a visitor. At a 2.5% rate, 50 sales need 2,000 visits; at 3%, 10 sales need 334 visits.',
    },
    {
      q: 'What is revenue per visitor?',
      a: 'Revenue per visitor is total revenue divided by total visits. Here revenue is conversions multiplied by the average order value you enter, so 25 orders at 40 each from 500 visits is 1,000 in revenue and 2.00 per visitor. It is a handy single number for comparing traffic sources that convert at different rates and order values.',
    },
    {
      q: 'Why is the currency only used for revenue?',
      a: 'The conversion rate itself is a percentage, so it has no currency. The currency setting formats the revenue figures only. Rupee amounts use Indian digit grouping, so one lakh is written ₹1,00,000.00.',
    },
    {
      q: 'What counts as a good conversion rate?',
      a: 'It depends heavily on the industry, the price of what you sell, the traffic source and how you define a conversion, so a single benchmark is rarely useful. The most reliable comparison is your own rate over time, measured the same way. This calculator does not include industry benchmarks or a significance test; for comparing two variants, use the A/B test calculator.',
    },
  ],
}

export default content
