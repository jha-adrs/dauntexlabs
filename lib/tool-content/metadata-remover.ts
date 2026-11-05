import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Photos and videos from phones and cameras carry hidden metadata: the GPS location where they were taken, the device make and model, the date and time, and the app or software that edited them. Sharing the original file can reveal where you live or work without you noticing.',
    'This tool shows what metadata each file contains and saves a cleaned copy with it removed. It edits the file structure directly instead of re-encoding, so image and video quality stay exactly the same. It handles JPEG, PNG and WebP photos and MP4 and MOV videos, and is designed to run on your device in your browser.',
  ],
  steps: [
    'Drop one or more photos or videos onto the box, or click to choose them.',
    'Review the list under each file: GPS location, camera or device, dates, software and any XMP or text blocks that were found.',
    'Click Download next to a file to save the cleaned copy. It keeps the original file name.',
    'Load the downloaded copy again if you want to confirm the metadata is gone.',
  ],
  faq: [
    {
      q: 'How do I remove the location from a photo?',
      a: 'Drop the photo here. If it has GPS data you will see "GPS location" in its list. Click Download to save a copy without the EXIF block that holds the coordinates, along with XMP, IPTC and comment blocks.',
    },
    {
      q: 'Does removing metadata reduce quality?',
      a: 'No. The tool removes metadata blocks from the file and copies the compressed image or video data unchanged. Nothing is decoded or compressed again, so the pixels and frames are identical to the original.',
    },
    {
      q: 'Why does my JPEG still have an orientation tag?',
      a: 'Phones often store photos sideways and use an orientation tag to show them upright. If a photo has one, the tool writes back a tiny EXIF block holding only that tag, so the picture does not turn sideways. It contains no location, device or date.',
    },
    {
      q: 'What does it remove from videos?',
      a: 'In MP4 and MOV files it removes the user-data and metadata boxes in the movie and in each track, where phones store location, make, model, software and creation date, plus XMP blocks. The basic timing headers that players need, which include a recording timestamp, are kept.',
    },
    {
      q: 'Which files are not supported?',
      a: 'HEIC photos, audio files such as MP3, PDFs and Office documents are not handled here and are flagged as not supported. For PDFs, use the PDF Metadata Remover. Very large videos may be slow or run out of memory, because the whole file is read in the browser.',
    },
  ],
}

export default content
