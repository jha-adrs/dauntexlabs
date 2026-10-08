import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Subtitles that are out of sync are one of the most common annoyances when you download an .srt or .vtt file for a film or a recorded lecture. Sometimes every line is early or late by the same amount, because the file was made for a release with a different intro. Sometimes the subtitles start fine and slowly drift, ending several seconds off, because the file was timed for a different frame rate such as 25 fps against 23.976 fps. This subtitle sync fixer handles both cases.',
    'For a constant offset, shift every cue by a number of milliseconds, earlier or later. For drift, use the two-point resync: pick one cue near the start and one near the end, type the time each should really start at, and every cue in between is stretched or squeezed in a straight line to match. You can also tidy overlapping cues, renumber the file and convert between SRT and WebVTT in either direction.',
    'The file is read in your browser and processed on your device, so the subtitles you work on are not sent to a server as part of the fix. When you are done, download the corrected file with the original name plus .synced, ready to drop next to the video.',
  ],
  steps: [
    'Drop your .srt or .vtt file onto the box, or paste the subtitle text below it.',
    'If every line is off by the same amount, enter the offset in milliseconds in "Shift by (ms)" (for example 1500 or -800) and click Apply shift.',
    'If the timing drifts, keep cue A as an early line and cue B as a late line, watch the video to note when each is actually spoken, enter those times as hh:mm:ss,mmm and click Apply resync.',
    'Optionally click Fix overlaps to sort the cues and stop any line running into the next one.',
    'Choose SRT or VTT for the output, check the result, and click Download to save the synced file.',
  ],
  faq: [
    {
      q: 'How do I fix subtitles that get more out of sync as the video plays?',
      a: 'That is drift, usually from a frame-rate mismatch. A single shift cannot fix it. Use the two-point resync: choose a cue near the beginning and one near the end, enter the correct start time for each, and the tool applies a linear correction to every cue in between.',
    },
    {
      q: 'Should I enter a positive or negative shift?',
      a: 'If the subtitles appear before the words are spoken, they are early, so enter a positive number to delay them. If they appear after, enter a negative number. 1000 milliseconds is one second. Times never go below zero.',
    },
    {
      q: 'Can it convert SRT to VTT or VTT to SRT?',
      a: 'Yes. Load either format and pick SRT or VTT for the output. SRT output is renumbered from 1 and uses commas in timestamps; VTT output starts with the WEBVTT header and uses dots. Cue settings such as line or position are not carried over.',
    },
    {
      q: 'What happens to lines it cannot read?',
      a: 'A cue with a broken timestamp is skipped and the count of skipped cues is shown above the controls, so you know to check the original. Multi-line cues, VTT NOTE blocks and cue identifiers are handled.',
    },
    {
      q: 'Can I undo a change?',
      a: 'Click Reset to go back to the timings as they were in the file you loaded. Changes are applied in order, so you can shift first and then resync if you need both.',
    },
  ],
}

export default content
