import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Every PDF carries hidden document properties: a title, the author\'s name, a subject, keywords, the app that created it, the PDF library that produced it, and creation and modification dates. Sending a PDF can reveal your name, your employer\'s software or when a draft was really written.',
    'This tool shows those properties, lets you edit them, and can remove them all at once. "Remove all metadata" deletes the document information fields and the XMP metadata stream attached to the document, then saves a new copy named after your file with "-clean" added. The PDF is processed on your device in your browser.',
  ],
  steps: [
    'Drop a PDF onto the box, or click to choose one.',
    'Review the title, author, subject, keywords, creator, producer and dates the file contains.',
    'Click "Remove all metadata" to strip everything, or edit the fields and click "Save with edits".',
    'Open the downloaded file (it ends in -clean.pdf) and check its properties in your PDF viewer.',
  ],
  faq: [
    {
      q: 'How do I remove the author name from a PDF?',
      a: 'Load the PDF, then either clear the Author field and click "Save with edits", or click "Remove all metadata" to drop every property. The new file no longer has an Author entry.',
    },
    {
      q: 'What exactly does "Remove all metadata" remove?',
      a: 'The document information dictionary (Title, Author, Subject, Keywords, Creator, Producer, CreationDate, ModDate) and the document-level XMP metadata stream. Pages, text, images and links are left as they are.',
    },
    {
      q: 'Is there anything it does not remove?',
      a: 'Yes. Metadata can also live inside the content itself: XMP attached to individual images or pages, names in comments and form fields, text in the document, or EXIF data inside embedded photos. This tool only handles the document-level properties, so check those other places if they matter for you.',
    },
    {
      q: 'Why does it say my PDF is encrypted?',
      a: 'Password-protected or encrypted PDFs cannot be rewritten here. Remove the protection in the app that created the file (you will need the password), then load the unprotected copy.',
    },
    {
      q: 'Does editing a field also change the XMP metadata?',
      a: 'Whenever you save, the XMP stream is removed, because it repeats the same fields and would otherwise keep the old values. Your edited values are kept in the document information fields, which PDF viewers read.',
    },
  ],
}

export default content
