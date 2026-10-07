import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This converter turns GPS track files from one format into another: GPX to GeoJSON, KML to GPX, GeoJSON to KML, or any of them to a CSV spreadsheet. It reads the file, works out whether it is GPX, KML or GeoJSON from its contents, and writes the format you pick. Tracks keep their separate segments, routes are treated as tracks, and waypoints come along as points.',
    'Alongside the conversion it shows a short summary of the track: total distance in kilometres and miles, elevation gain and loss in metres and feet, moving time and elapsed time when the points carry timestamps, the number of track points, and the bounding box. There is no map and nothing to sign in to.',
    'GPS tracks can reveal where you live, work and train, so the file is processed on your device: it runs in your browser rather than being sent to a conversion service.',
  ],
  steps: [
    'Drop a .gpx, .kml or .geojson file onto the drop zone, or paste the file contents into the input box.',
    'Check the "Detected" label above the input to confirm the format and how many tracks and waypoints were found.',
    'Choose the output format: GeoJSON, GPX, KML or CSV.',
    'Review the track stats for distance, elevation and time.',
    'Copy the result, or download it. The download is named after your original file, for example ride.gpx becomes ride.geojson.',
  ],
  faq: [
    {
      q: 'How do I convert GPX to GeoJSON?',
      a: 'Load your GPX file, leave the output on GeoJSON and download. Each track becomes a LineString feature (or a MultiLineString if it has several segments) with longitude, latitude and elevation, and each waypoint becomes a Point feature. Timestamps are kept in a coordTimes property, which is the convention many mapping tools read.',
    },
    {
      q: 'Can I convert KML to GPX for my GPS device or Strava?',
      a: 'Yes. Paths drawn as LineStrings and Google Earth gx:Track recordings are both read, and placemark points become GPX waypoints. Whether a particular app accepts the GPX file is up to that app, but the output is standard GPX 1.1.',
    },
    {
      q: 'What does the CSV export contain?',
      a: 'One row per track point with the columns track, segment, index, lat, lon, ele and time. Segment and index start at 1. Waypoints are not included in the CSV.',
    },
    {
      q: 'How is elevation gain calculated?',
      a: 'Elevation changes are only counted once the height has moved at least 2 metres from the last counted level. This filters out small GPS wobble that would otherwise inflate the total, so the figure can be a little lower than apps that count every change.',
    },
    {
      q: 'Why is moving time shorter than elapsed time?',
      a: 'Elapsed time runs from the first timestamp to the last. Moving time only adds up stretches between points where you were travelling faster than 1.8 km/h, so stops at junctions or cafés are left out.',
    },
    {
      q: 'Does anything get lost when converting?',
      a: 'Positions, elevation, names and segments are kept across all formats. KML output does not carry timestamps, and extra data such as heart rate, cadence or custom extensions is not copied to the output.',
    },
  ],
}

export default content
