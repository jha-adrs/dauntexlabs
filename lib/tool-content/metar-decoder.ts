import type { ToolContent } from './types'

export default {
  intro: [
    'A METAR is the routine aviation weather observation an airport issues every hour, and a SPECI is the special report sent when conditions change quickly. Both are written in a compact code that packs wind, visibility, weather, cloud, temperature and pressure into a single line. This METAR decoder turns that line into a plain-English table, one row per group, so you can check your reading of a report while you learn the format.',
    'It also works out the flight category — VFR, MVFR, IFR or LIFR — from the lowest broken, overcast or vertical-visibility layer and the reported visibility. Groups the decoder does not recognise are kept and shown as "Not decoded" rather than silently dropped, so nothing in the original report is hidden from you.',
    'The page does not fetch weather from anywhere: you paste a report you already have from your briefing source, and the decoding is designed to run in your browser on your device.',
  ],
  steps: [
    'Copy a METAR or SPECI from your official briefing source, such as an aviation weather service or your flight planning app.',
    'Paste it into the box. A leading METAR or SPECI word, a trailing "=" and line breaks are all fine.',
    'Read the decoded table: each raw group sits next to its element and plain-English meaning.',
    'Check the flight-category badge, then look at any trend (TEMPO, BECMG, NOSIG) and the remarks, which are shown as they were written.',
  ],
  faq: [
    {
      q: 'How do I read a METAR?',
      a: 'Read it left to right: station, day and time in UTC, wind, visibility, runway visual range, present weather, cloud layers, temperature and dew point, then the altimeter setting. In KJFK 121651Z 31015G25KT 10SM FEW050 the station is New York JFK, observed on the 12th at 16:51 UTC, wind from 310° at 15 kt gusting 25 kt, visibility 10 statute miles and a few clouds at 5,000 ft.',
    },
    {
      q: 'How is the flight category worked out?',
      a: 'The ceiling is the lowest broken (BKN), overcast (OVC) or vertical-visibility (VV) layer. LIFR is a ceiling below 500 ft or visibility below 1 statute mile; IFR is below 1,000 ft or 3 miles; MVFR is 1,000 to 3,000 ft or 3 to 5 miles; anything better is VFR. Trend groups are not counted because they describe expected, not observed, conditions.',
    },
    {
      q: 'What do the weather codes such as -TSRA or BR mean?',
      a: 'They follow WMO code table 4678: an optional intensity (- light, + heavy, VC in the vicinity), an optional descriptor such as TS thunderstorm, SH showers or FZ freezing, and one or more phenomena such as RA rain, SN snow, BR mist or FG fog. So -TSRA is a light thunderstorm with rain, and an RE prefix marks recent weather.',
    },
    {
      q: 'Why are some groups shown as "Not decoded"?',
      a: 'Reports contain local and less common groups, such as wind shear on a runway or missing-data slashes. Rather than guess, the decoder shows those groups exactly as written so you can look them up. Remarks after RMK are passed through as written for the same reason.',
    },
    {
      q: 'Does it support both US and ICAO formats?',
      a: 'Yes. It handles statute-mile visibility including fractions like 1 1/2SM and M1/4SM, metre visibility and 9999, CAVOK, knots and metres per second, A (inHg) and Q (hPa) altimeter settings with a conversion, and NSC, NCD, SKC and CLR.',
    },
    {
      q: 'Can I use this to make a go / no-go decision?',
      a: 'No. It is for training and planning only. Always use an official, current weather briefing and your own judgement for flight decisions.',
    },
  ],
} satisfies ToolContent
