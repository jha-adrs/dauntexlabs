import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Indian exam and government forms reject a photo or signature for small reasons: the file is 52 KB when the limit is 50, the picture is 600 × 800 px when the form wants 200 × 230, or the file is too small and falls under a minimum. This tool turns any photo or signature into a JPG that matches a form’s pixel size, file-size range and DPI, then shows a checklist before you download.',
    'Pick your exam or form — IBPS, SBI, SSC, RRB, UPSC, NEET, JEE Main, CUET, CTET, TNPSC, PAN, passport or Indian visa — or a plain file size such as 20, 50 or 100 KB. Each preset was checked against the official notice; the full page for each one shows the spec table and the notice it came from. SSC and RRB capture your photo live, so only the signature is prepared for them.',
    'The tool is designed to run in your browser: the photo is cropped and compressed on your device and saved as a fresh JPEG, so camera details such as GPS location are not copied into it.',
  ],
  steps: [
    'Choose your exam, form or file size from the list.',
    'Drop a photo or a picture of your signature into each box the form needs.',
    'Use Zoom and the Move sliders until the preview shows the frame you want. Turn on Whiten background or the name and date strip if your form asks for them.',
    'Click Make file. The tool searches JPEG quality until the size lands inside the range, writes the DPI and shows the result with a checklist.',
    'Check the pixels, KB, JPG and DPI ticks, then download the file and upload it to the form.',
  ],
  faq: [
    {
      q: 'How does the tool hit a KB range exactly?',
      a: 'It saves the photo at several JPEG qualities and keeps the top quality if it already fits; otherwise the highest quality that lands a little under the ceiling. If the file is still too small at the highest quality, it adds blank padding bytes inside the JPEG so it clears the minimum without changing the picture.',
    },
    {
      q: 'Does 50 KB mean 50,000 or 51,200 bytes?',
      a: 'Portals differ, so the tool keeps the file at or above the minimum counted in 1024-byte KB and at or below the maximum counted in 1000-byte KB. A file inside both passes either reading.',
    },
    {
      q: 'Why is there no photo upload for SSC or RRB?',
      a: 'Both capture your photo live with a webcam or phone during the application. You only prepare the signature, which this tool sizes to their KB range.',
    },
    {
      q: 'Are the sizes up to date?',
      a: 'Each exam page names the notice it was checked against and the date. Rules change between cycles, so always confirm on the current official notice before you submit.',
    },
    {
      q: 'Is my photo sent to a server?',
      a: 'The tool is designed to run in your browser and processes the photo on your device. See the privacy policy for the details and limits.',
    },
  ],
}

export default content
