import StatusBar from '@/components/StatusBar'
import Footer from '@/components/Footer'
import HomeClient from '@/components/HomeClient'
import JsonLd from '@/components/JsonLd'
import { tools } from '@/lib/tools'

const SITE = 'https://dauntexlabs.com'

// Server component: owns the page (metadata inherited from layout), emits
// structured data, and renders the interactive deck via the HomeClient island.
export default function Page() {
  const live = tools.filter((t) => t.status !== 'maintenance')

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'dauntexlabs',
    url: `${SITE}/`,
    description:
      '100+ free online tools that run entirely in your browser — no uploads, no accounts, no telemetry.',
  }

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'dauntexlabs tools',
    numberOfItems: live.length,
    itemListElement: live.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: `${SITE}/tools/${t.slug}/`,
    })),
  }

  return (
    <>
      <JsonLd data={website} />
      <JsonLd data={itemList} />
      <StatusBar />
      <main>
        <HomeClient />
      </main>
      <Footer />
    </>
  )
}
