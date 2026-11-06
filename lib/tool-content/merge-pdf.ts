import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This tool lets you merge PDF files into a single document. Combine PDF files such as scanned pages, invoices, application forms or report chapters, put them in the order you want, and download one merged PDF with every page of every file.',
    'The files are combined on your device using pdf-lib, a PDF library bundled with the site and loaded only when you press merge. The tool is designed to run locally, which suits documents you would rather not hand to an online service.',
  ],
  steps: [
    'Drop two or more PDF files onto the box, or click it to choose them. You can add more files later; they join the end of the list.',
    'Set the order with the up and down arrow buttons beside each file. The numbers on the left show the order the files will appear in.',
    'Remove any file you do not want with its remove control.',
    'Press the Merge button, labelled with the number of PDFs, for example Merge 3 PDFs.',
    'The combined file downloads automatically as merged.pdf.',
  ],
  faq: [
    {
      q: 'How do I change the order of the PDFs?',
      a: "Use the up and down arrows next to each file to move it one place at a time. Files are merged top to bottom, and each file's pages keep their original order.",
    },
    {
      q: 'Can I pick individual pages or reorder pages?',
      a: "Not here. This tool always includes every page of every file, in file order. To choose, delete or rearrange specific pages, use the site's split PDF or organize PDF tools on the merged file.",
    },
    {
      q: 'Why did merging fail?',
      a: 'The most common cause is a password-protected or encrypted PDF, which the tool cannot open. A damaged file can also stop the merge. Remove that file, or unlock it first, and try again.',
    },
    {
      q: 'How many files can I combine?',
      a: "At least two are needed. There is no fixed upper limit, but every file is held in your browser's memory, so very large or numerous files may be slow or fail on devices with little memory.",
    },
    {
      q: 'Does the merged PDF lose quality?',
      a: 'No. Pages are copied as they are rather than re-rendered or re-compressed, so text stays selectable and images keep their original quality.',
    },
  ],
}

export default content
