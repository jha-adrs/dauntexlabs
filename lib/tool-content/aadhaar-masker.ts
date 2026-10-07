import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Hotels, landlords, gyms and employers often ask for a copy of your Aadhaar card. Most of them only need to see your name and photo, not your full 12-digit number. This tool lets you hide the parts you don’t want to share by drawing solid black (or white) boxes over a photo or scan of the card, then download a clean copy.',
    'Masking is manual: you choose what to cover. There is no automatic text detection — you drag a box over the digits yourself and check the preview before saving. An optional dashed guide shows where the first 8 digits often sit on the front of a card, but it is only a hint and is never applied for you.',
    'The image is processed in your browser on your device. The download is redrawn through a canvas, so the boxes are part of the pixels (not a layer that can be removed) and photo metadata such as camera and location details is not carried over.',
  ],
  steps: [
    'Drop a JPG, PNG or WebP photo or scan of your Aadhaar card. For a PDF e-Aadhaar, take a screenshot of the page first.',
    'Drag across the first 8 digits of the Aadhaar number to cover them. On a phone, drag with your finger.',
    'Add more boxes for anything else you don’t want to share, such as the QR code, date of birth or address. Use Undo or Clear boxes to fix mistakes.',
    'Choose black or white boxes, and PNG or JPG for the download.',
    'Zoom into the preview to check every digit is fully covered, then click Download.',
  ],
  faq: [
    {
      q: 'What is a masked Aadhaar?',
      a: 'According to UIDAI’s FAQ “What is Masked Aadhaar?” on uidai.gov.in, a masked Aadhaar replaces the first 8 digits of the number with “xxxx-xxxx”, so only the last 4 digits are visible. UIDAI also offers an official masked e-Aadhaar download on its own website; this tool is a simple way to cover the digits on a photo or scan you already have.',
    },
    {
      q: 'How do I mask my Aadhaar number on a photo?',
      a: 'Load the photo here, drag a box over the first 8 digits so only the last 4 remain visible, check the preview, and download. The box is drawn as solid colour into the image itself.',
    },
    {
      q: 'Does this tool detect the Aadhaar number automatically?',
      a: 'No. It does not read the text on your card. You draw every box yourself, which means you stay in control of what is hidden — and you should check the result carefully before sharing it.',
    },
    {
      q: 'Can someone remove the black box later?',
      a: 'The download is a new image in which the covered pixels have been replaced with solid colour, so there is no hidden layer underneath to peel off. Make sure each box fully covers the digits, because anything left visible stays visible.',
    },
    {
      q: 'Is a masked Aadhaar accepted as ID?',
      a: 'It depends on who is asking. Many places accept it for identity checks, but some processes need the full number. If in doubt, ask the organisation which version it needs.',
    },
    {
      q: 'Should I cover the QR code too?',
      a: 'The QR code on an Aadhaar card can carry your details, so cover it as well if the person you are sharing with doesn’t need to scan it.',
    },
  ],
}

export default content
