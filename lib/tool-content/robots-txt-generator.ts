import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This robots.txt generator builds the plain-text file that tells search engine crawlers which parts of your site they may request. Enter a user-agent, the paths you want to block or allow, an optional crawl delay and your sitemap URL, and the file is assembled line by line as you type, ready to copy or download as robots.txt.',
    'It is meant for site owners and developers who want a clean, correctly formatted starting file without memorising the syntax. The output is generated in your browser. The generator writes one user-agent group at a time, so if you need different rules for different bots, generate each group and combine them in one file.',
  ],
  steps: [
    'Type a user-agent, or leave the default * to address every crawler; use a name such as Googlebot or Bingbot to target one bot.',
    'Under "Disallow (one path per line)", list the paths crawlers should skip, for example /admin or /private.',
    'Under "Allow (one path per line)", list any paths that should stay crawlable, such as a public folder inside a blocked section.',
    'Optionally set "Crawl-delay (optional)" in seconds and paste your full "Sitemap URL (optional)".',
    'Copy the robots.txt output or download it, then put the file at the root of your domain so it is served at /robots.txt.',
  ],
  faq: [
    {
      q: 'What does Disallow mean in robots.txt?',
      a: 'A Disallow line asks the crawlers named in the user-agent line not to request URLs whose path starts with the value given. "Disallow: /admin" covers /admin, /admin/ and /admin/settings. "Disallow: /" blocks the whole site, and a group with no Disallow lines at all allows everything.',
    },
    {
      q: 'Does robots.txt stop a page from being indexed?',
      a: 'No. robots.txt controls crawling, not indexing. A blocked URL can still appear in search results if other pages link to it, usually without a description. To keep a page out of results, let it be crawled and add a noindex robots meta tag or an X-Robots-Tag header; a crawler cannot see a noindex on a page it is not allowed to fetch.',
    },
    {
      q: 'How do Allow and Disallow work together?',
      a: 'Allow is used to open up a path inside a blocked area, for example disallowing /private while allowing /private/press. Google and Bing pick the most specific (longest) matching rule, and when an Allow and a Disallow match equally, Allow wins.',
    },
    {
      q: 'Does Google respect Crawl-delay?',
      a: 'Google ignores the Crawl-delay directive and adjusts its crawl rate automatically. Some other crawlers, including Bing and Yandex, do read it. Leave the field empty if you have no reason to slow crawlers down.',
    },
    {
      q: 'Where do I put robots.txt, and is it a security measure?',
      a: 'It must sit at the root of the host, for example https://example.com/robots.txt; a file in a subfolder is ignored. It is not a security control: well-behaved bots follow it, but anyone can read the file and request the listed paths, so protect private areas with authentication instead.',
    },
  ],
}

export default content
