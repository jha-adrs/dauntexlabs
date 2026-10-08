import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This UPI QR code generator creates a payment QR code that any UPI app can scan, including Google Pay, PhonePe, Paytm and BHIM. Enter your UPI ID, an optional payee name, an optional fixed amount and a note, and the code is ready to download and print for a shop counter, an invoice, a donation box or a payment link in a message.',
    'The code holds a standard upi://pay link with your UPI ID, the name, the amount in rupees and the note. Leave the amount empty and the payer types it in their app; fill it in and the amount is prefilled. You can style the code with the same designer as the main QR tool: presets, colours, rounded or dotted modules, a centred logo and a "Scan to pay" frame.',
    'Your UPI ID and payment details are designed to stay in your browser and be processed on your device. The QR code is static, so it never expires and scanning it does not pass through any third-party redirect.',
  ],
  steps: [
    'Enter your UPI ID, such as yourname@okhdfc or shopname@ybl. It is checked for the handle@bank format as you type.',
    'Add the payee name that payers should see, and an optional note such as an order or invoice number.',
    'Enter an amount only if every payment should be the same; otherwise leave it empty.',
    'Pick a preset or adjust the design, then download the code as PNG, JPEG or SVG.',
    'Scan it with your own UPI app and check the name and amount before you display or share it.',
  ],
  faq: [
    {
      q: 'Is this UPI QR code free and does it charge any fee per payment?',
      a: 'The generator is free, with no sign-up and no watermark. The code simply contains your UPI ID, so payments go straight from the payer\'s UPI app to your bank account through UPI; this tool is not involved in the payment at all.',
    },
    {
      q: 'Where do I find my UPI ID?',
      a: 'Open your UPI app and look in your profile or the receive money screen. It looks like name@bank, for example 9845000000@ybl or shop@okicici. Business accounts often have a separate merchant UPI ID.',
    },
    {
      q: 'Is there a maximum amount?',
      a: 'The tool accepts up to ₹1,00,000, the usual per-transaction limit for person-to-person and most merchant UPI payments. Your bank or app may apply a lower limit of its own. Amounts may have at most two decimal places.',
    },
    {
      q: 'Can I add my shop logo to the QR code?',
      a: 'Yes. Drop your logo into the Logo box in the Design panel. The tool raises error correction when the logo is large so the code still scans, and you should always test the printed code with a UPI app before using it.',
    },
    {
      q: 'Does the QR code expire?',
      a: 'No. It is a static code with the payment details written into it, so it works for as long as your UPI ID is active. If you change your UPI ID, create a new code.',
    },
  ],
}

export default content
