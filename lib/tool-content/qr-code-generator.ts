import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This QR code generator makes static QR codes for links, plain text, Wi-Fi logins, contact cards (vCard and MeCard), email, SMS, phone calls, WhatsApp chats, map locations, calendar events and UPI payments. Pick a content type, fill in the fields, and the code updates as you type. It is free, with no sign-up and no watermark.',
    'You can design the code to match a brand: choose from six presets or set the module shape (square, rounded, dots, classy, diamond, bars or fluid), the shape of the three corner eyes, solid or gradient colours, a transparent background, a centred logo and a frame with a short call to action such as "Scan me". The designer checks contrast and warns when a colour choice may be hard for phones to read, and raises error correction automatically when a large logo covers part of the code.',
    'A static QR code stores your content directly in the pattern, so it never expires and scanning it does not pass through any redirect service. The code is designed to be generated in your browser and processed on your device, which matters for Wi-Fi passwords, contact details and payment IDs.',
  ],
  steps: [
    'Choose what the code should contain from the Content menu, for example Link, Wi-Fi or Contact (vCard).',
    'Fill in the fields. The preview appears as soon as the content is valid; an error explains anything that needs fixing.',
    'Pick a preset, or adjust the shapes, colours, logo, frame and quiet zone in the Design panel. Read any warning under the preview before you print.',
    'Choose a PNG size and click Download PNG, Download JPEG or Download SVG. SVG stays sharp at any size and is best for print.',
    'Scan the downloaded code with your own phone before sharing or printing it.',
  ],
  faq: [
    {
      q: 'Do these QR codes expire?',
      a: 'No. These are static QR codes: the link, text or login details are encoded in the pattern itself, so the code keeps working as long as the content behind it does. There is no subscription and no redirect that could be switched off later.',
    },
    {
      q: 'How do I make a QR code for my Wi-Fi network?',
      a: 'Choose Wi-Fi, enter the network name (SSID) exactly as it appears on your router, pick the security type and type the password. Special characters such as ; , : and quotes are escaped for you, so phones join the right network. Tick Hidden network if your router does not broadcast its name.',
    },
    {
      q: 'Will a QR code with a logo still scan?',
      a: 'Usually, yes. QR codes carry error correction that lets a scanner rebuild covered parts. When you add a logo larger than 20% of the width the tool switches to the highest level (H) and clears the modules behind the logo. Keep strong contrast and test the final file with a couple of phones.',
    },
    {
      q: 'Which format should I download?',
      a: 'Use SVG for print, signage and design tools, because it is vector and scales without blurring. Use PNG for websites, documents and messaging apps; 1024 px is plenty for most screens. JPEG has no transparency, so transparent areas become white.',
    },
    {
      q: 'Why does the tool warn about my colours?',
      a: 'Scanners need a clear difference between the code and its background. Low contrast, or a light code on a dark background, can make some phones fail to read it. Dark modules on a light background with a contrast ratio of at least 4:1 are the safest choice.',
    },
  ],
}

export default content
