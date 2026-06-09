import StatusBar from '@/components/StatusBar'
import Footer from '@/components/Footer'
import HomeClient from '@/components/HomeClient'

// Server component: owns the page (metadata inherited from layout) and renders
// the interactive deck via the HomeClient island.
export default function Page() {
  return (
    <>
      <StatusBar />
      <main>
        <HomeClient />
      </main>
      <Footer />
    </>
  )
}
