import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This HTML entity encoder and decoder converts text to and from HTML character references. Encoding escapes the five characters that can break markup (&, <, >, " and \') so text can be placed safely inside HTML; decoding turns entities such as &lt; or &#169; back into the characters they stand for.',
    'It is useful for pasting code samples into a blog post, cleaning up scraped or double-escaped text, or checking what an entity in a template actually renders as. Conversion happens in your browser as you type.',
  ],
  steps: [
    'Choose Encode or Decode.',
    'In Encode mode, optionally turn on "Encode non-ASCII" to also convert accented letters, symbols and emoji into numeric references such as &#233;.',
    'Paste or type your text into the input panel.',
    'Copy the result from the output panel.',
  ],
  faq: [
    {
      q: 'Which characters does the encoder convert?',
      a: 'By default it converts only the five HTML special characters: & becomes &amp;, < becomes &lt;, > becomes &gt;, " becomes &quot; and \' becomes &#39;. With "Encode non-ASCII" on, every character above code point 127 is also written as a decimal numeric reference. It does not output named entities such as &copy; when encoding.',
    },
    {
      q: 'Which entities can it decode?',
      a: 'It decodes all decimal (&#169;) and hexadecimal (&#xA9;) numeric references, plus a built-in list of common named entities: the core markup ones, &nbsp;, quotes and dashes, currency signs, fractions, arrows, Greek letters and frequent maths symbols. Named entities outside that list (HTML defines more than two thousand) are left unchanged.',
    },
    {
      q: 'What is the difference between named and numeric entities?',
      a: 'A named entity uses a keyword, like &copy; for the copyright sign, while a numeric reference uses the Unicode code point, like &#169; or &#xA9;. Both render the same character. Numeric references work for any character, so they are the safer choice when you are unsure a name exists.',
    },
    {
      q: 'Do I need to encode non-ASCII characters if my page uses UTF-8?',
      a: 'Usually not. A page served as UTF-8 can contain accented letters and emoji directly. Encoding them is mainly useful for systems that mangle non-ASCII text, such as some older email templates or legacy databases.',
    },
    {
      q: 'Does encoding make user input safe against XSS?',
      a: "Escaping &, <, > and both quote marks is the right treatment for text placed in HTML element content or quoted attribute values. It is not enough on its own inside script blocks, URLs or CSS, which need their own escaping, so rely on your framework's output encoding for production code.",
    },
  ],
}

export default content
