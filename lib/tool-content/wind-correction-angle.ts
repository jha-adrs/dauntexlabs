import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'A crosswind pushes an aircraft sideways off its intended track, so you point the nose slightly into the wind to stay on course. The angle you turn by is the wind correction angle (WCA). This wind correction angle calculator solves the wind triangle: give it your true airspeed, true course and the wind, and it returns the WCA, the true heading to fly and your ground speed.',
    'It uses the same trigonometry as the wind side of an E6B flight computer. The crosswind part of the wind sets the correction angle, and the headwind or tailwind part changes the ground speed. If the wind is so strong that the course cannot be held, or the headwind is at least your airspeed, the calculator says so instead of giving a misleading number. Everything is calculated in your browser.',
  ],
  steps: [
    'Enter your planned true airspeed in knots.',
    'Enter the true course from your chart, in degrees.',
    'Enter the wind direction it blows from and its speed in knots, as given in the winds aloft forecast (true direction).',
    'Read the wind correction angle (left or right), the true heading and the ground speed.',
    'Apply magnetic variation and deviation to the true heading to get the compass heading for your flight log.',
  ],
  faq: [
    {
      q: 'How do you calculate wind correction angle?',
      a: 'Take the angle between the wind direction and your course. The crosswind component is wind speed times the sine of that angle. The wind correction angle is the arcsine of the crosswind component divided by true airspeed. Heading is course plus the correction angle; ground speed is airspeed times the cosine of the correction angle, minus the headwind component.',
    },
    {
      q: 'Is the correction left or right?',
      a: 'You always turn into the wind. A wind from the left of your course gives a left correction (heading lower than course); a wind from the right gives a right correction. The tool labels the angle left or right for you.',
    },
    {
      q: 'Should I use true or magnetic directions?',
      a: 'Winds aloft forecasts and charted courses are true, so enter both as true. The heading you get is a true heading; convert it to magnetic with the local variation before flying it.',
    },
    {
      q: 'What happens if the wind is stronger than my airspeed?',
      a: 'If the crosswind component is at least your true airspeed, no heading can hold the course, and if the headwind is at least your airspeed you make no progress. The calculator shows an error in both cases.',
    },
    {
      q: 'Can this replace my E6B?',
      a: 'No. It is for training and planning only. Always cross-check with your aircraft\'s POH and an E6B or approved flight planning tool.',
    },
  ],
}

export default content
