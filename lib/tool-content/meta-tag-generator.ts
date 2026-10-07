import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This SEO meta tag generator writes the basic HTML tags that belong in the <head> of a web page: the title tag, meta description, keywords, author, robots directive, canonical link and a responsive viewport tag. Fill in the fields and copy a ready-to-paste block of HTML, with quotes and special characters escaped for you.',
    'It suits anyone building a site by hand, editing a theme, or checking what a CMS should be outputting. The tags are generated in your browser as you type.',
  ],
  steps: [
    'Enter a page title, ideally a short, specific description of the page.',
    'Write a meta description; around 155 characters usually fits in search results.',
    'Optionally add comma-separated keywords, an author and a canonical URL.',
    'Pick a robots value such as "index, follow" or "noindex, nofollow", and leave "responsive viewport tag" on for mobile-friendly pages.',
    'Copy the generated tags and paste them inside the <head> of your HTML.',
  ],
  faq: [
    {
      q: 'Which meta tags matter most for SEO?',
      a: 'The title tag and meta description have the most visible effect, because search engines often show them in results. A canonical link helps when the same content is reachable at several URLs, and the robots tag controls whether a page should be indexed. The meta keywords tag is ignored by Google, so it is optional.',
    },
    {
      q: 'Does it generate Open Graph or Twitter card tags?',
      a: 'Not currently. This generator covers the standard HTML head tags listed above. Social sharing tags such as og:title and twitter:card need to be added separately.',
    },
    {
      q: 'Can it create geo meta tags?',
      a: 'No. Geo tags like geo.region and geo.position are not part of this generator. If you need them, add them by hand next to the tags it produces; most search engines rely on other location signals anyway.',
    },
    {
      q: 'What does the robots meta tag do?',
      a: '"index, follow" lets search engines list the page and follow its links, which is the default behaviour. "noindex" asks them not to show the page in results, "nofollow" asks them not to follow its links, and "noarchive" or "nosnippet" limit cached copies and text previews.',
    },
    {
      q: 'Why is nothing showing in the generated tags box?',
      a: 'Output appears once at least one of the content fields (title, description, keywords, author or canonical URL) has text. The robots and viewport settings alone do not produce output.',
    },
  ],
}

export default content
