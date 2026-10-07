import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Many Indian exam and recruitment forms ask for a recent photograph with your name and the date the photo was taken printed at the bottom. This tool adds that name and date strip to any photo and resizes it to the pixel size the form asks for, such as 200 × 230 px.',
    'You can also add a photo of your signature. Join it below the photo as one image, or download it on its own at a set size such as 140 × 60 px. The date is printed in the DD/MM/YYYY format, the text size adjusts to fit, and a live preview shows the result before you download.',
    'Your photos are processed in your browser on your device and saved as a fresh JPEG, so metadata from your camera is not carried over. Adjust the JPEG quality to bring the file under your form’s size limit.',
  ],
  steps: [
    'Drop your photo (JPG, PNG or WebP).',
    'Type your name as it appears on the form and pick the date. It defaults to today.',
    'Choose a photo size preset or enter a custom width and height, and set how tall the name/date strip should be.',
    'Optionally add your signature, then choose to join it below the photo or download it separately at its own size.',
    'Check the preview, set the JPEG quality, and click Download photo. The saved file size is shown so you can compare it with the form’s limit.',
  ],
  faq: [
    {
      q: 'How do I add my name and date to a photo for an exam form?',
      a: 'Load the photo, type your name, pick the date and choose the size your exam notice asks for. The tool adds a white strip at the bottom with your name and the date in DD/MM/YYYY, then saves a JPEG.',
    },
    {
      q: 'What photo size do exam forms ask for?',
      a: 'It varies by exam and changes between notices. 200 × 230 px is a common request and is included as a preset, but always check your exam’s official notice and use Custom if it asks for something else.',
    },
    {
      q: 'How do I reduce the file size to fit the KB limit?',
      a: 'Lower the JPEG quality slider and download again; the saved size is shown after each download. A smaller pixel size also makes a smaller file.',
    },
    {
      q: 'Can I join my photo and signature into one image?',
      a: 'Yes. Add a signature image and keep “Join signature below photo” switched on. The signature is placed underneath the photo at the same width. Switch it off to download the signature as a separate file instead.',
    },
    {
      q: 'Will my photo be cropped?',
      a: 'If your photo’s shape doesn’t match the chosen size, it is cropped evenly from the centre so nothing is stretched. Use a photo with your face roughly centred for the best result.',
    },
  ],
}

export default content
