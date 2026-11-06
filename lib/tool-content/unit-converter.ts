import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This unit converter changes a value from one unit to another across eight categories: Length, Mass, Temperature, Data, Speed, Area, Volume and Time. It covers everyday metric to imperial conversions such as metres to feet, kilograms to pounds, litres to gallons and Celsius to Fahrenheit, along with kilometres per hour to knots, acres to hectares and bytes to gigabytes.',
    'Pick a category, choose the from and to units, type a value and the result appears straight away, together with a one-unit ratio line such as 1 mi = 1.609344 km. Results are shown to up to 10 significant figures and are calculated in your browser. For a reference table, see the conversion pages, which list common values for individual unit pairs.',
  ],
  steps: [
    'Choose a Category from the drop-down.',
    'In the from panel, pick the Unit you are starting with and type the Value.',
    'In the to panel, pick the Unit you want.',
    'Read the converted value and the ratio line under it, then use copy to grab the result.',
  ],
  faq: [
    {
      q: 'Which units are included?',
      a: 'Length: m, km, cm, mm, mi, yd, ft, in and nm (nautical mile). Mass: kg, g, mg, lb, oz, t and st. Temperature: Celsius, Fahrenheit and Kelvin. Speed: m/s, km/h, mph, knot and ft/s. Area: square metres, kilometres, centimetres, millimetres, feet, inches and miles, plus acre and ha. Volume: L, mL, m3, cm3, gal, qt, pt, fl oz, cup, tsp and tbsp. Time: ns, ms, s, min, h, day, week, month and year. Data: B, KB, MB, GB, TB and bits.',
    },
    {
      q: 'Are gallons and pints US or imperial?',
      a: 'US customary. gal, qt, pt, fl oz and cup use US measures, so 1 gal is 3.785 L. Imperial (UK) gallons and pints are not offered.',
    },
    {
      q: 'Is 1 KB 1000 or 1024 bytes here?',
      a: 'The Data category uses binary multiples: 1 KB is 1024 bytes, 1 MB is 1024 KB, and so on. Storage makers often quote decimal sizes, so a drive sold as 1 TB shows as roughly 0.91 TB in this converter.',
    },
    {
      q: 'How long is a month or a year?',
      a: 'Time uses average Gregorian lengths: a year is 365.2425 days and a month is one twelfth of that. Real calendar months vary, so use a date calculator for specific dates.',
    },
    {
      q: 'How is temperature converted?',
      a: 'Temperature is converted through Kelvin rather than with a single multiplier, so offsets are handled correctly: 0 °C is 32 °F and 100 °C is 212 °F.',
    },
  ],
}

export default content
