import type { Metadata } from 'next'
import Link from 'next/link'
import StatusBar from '@/components/StatusBar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'dauntexlabs tools are designed to run entirely in your browser — no accounts, no analytics, no trackers. Read how data is handled and the limits of that.',
  alternates: { canonical: '/privacy/' },
}

export default function PrivacyPage() {
  return (
    <>
      <StatusBar />
      <main className="shell tool-page">
        <Link href="/" className="back">
          ← deck
        </Link>

        <div className="tool-head">
          <span className="idx">DOC·001</span>
          <span className="cat">Legal</span>
        </div>
        <h1>Privacy Policy</h1>
        <p className="lede">Last updated 6 June 2026.</p>

        <div className="notice success" style={{ marginTop: 28 }}>
          The short version: every tool is <b>designed to run entirely in your browser</b>. We
          operate no application backend to receive your data, and use no accounts, cookies,
          analytics or trackers. Because no website can absolutely guarantee how data moves
          across the open web, the clauses below set out the limits in plain terms.
        </div>

        <div className="prose">
          <h2>1. What we collect</h2>
          <p>
            We do not operate an application server, database, or account system that collects
            your data. dauntexlabs is a set of static files (HTML, CSS, JavaScript) your browser
            downloads and then runs locally. We do not use analytics, advertising, cookies, or
            cross-site trackers, and we do not ask you to sign in.
          </p>

          <h2>2. Your data is processed on your device</h2>
          <p>
            When you paste, type, open or generate data in a tool — text, JSON, CSV, tokens,
            images, PDFs, keys, passphrases — it is designed to be processed entirely in your
            browser&apos;s memory using JavaScript, and we do not transmit it to us or sell or
            share it. Reloading or closing the tab discards it. See section 8 for the limits of
            this design.
          </p>

          <h2>3. Files you open</h2>
          <p>
            Tools that accept a file (image and PDF utilities, file viewers, and similar) read it
            locally in your browser using standard browser file APIs and process it in memory.
            Any output — a converted image, a merged PDF, a generated key — is created on your
            device and offered to you as a download. Files you open are not uploaded by us.
          </p>

          <h2>4. Local storage</h2>
          <p>
            We use your browser&apos;s <code>localStorage</code> for small, functional things
            only — for example, remembering that you accepted this notice, and any tool
            preferences you set. This data lives on your device. You can clear it any time via
            your browser&apos;s &ldquo;clear site data&rdquo; controls. We do not use cookies.
          </p>

          <h2>5. No tracking; bundled open-source libraries</h2>
          <p>
            There are no analytics scripts, advertising networks, social embeds, or third-party
            trackers. The libraries the tools rely on are bundled and served from this site
            itself rather than loaded from a third-party CDN — including the fonts and the
            open-source{' '}
            <a href="https://openpgpjs.org" target="_blank" rel="noopener noreferrer">
              OpenPGP.js
            </a>
            ,{' '}
            <a href="https://pdf-lib.js.org" target="_blank" rel="noopener noreferrer">
              pdf-lib
            </a>{' '}
            and QR-code libraries that power the PGP, PDF and QR tools. These libraries are
            intended to run locally and, to our knowledge, do not make network requests of their
            own.
          </p>

          <h2>6. Cryptography &amp; keys</h2>
          <p>
            Cryptographic operations — hashing, AES, HMAC, JWT signing/verification, and PGP key
            generation, encryption and decryption — are designed to be performed entirely in your
            browser. Your messages, passphrases, secret keys and generated PGP private keys are
            not uploaded by us; they exist in your browser&apos;s memory and in any file you
            choose to download. We cannot see, recover, or reset them — keep your own backups.
          </p>

          <h2>7. Hosting logs</h2>
          <p>
            The site is delivered by a static hosting/CDN provider. Like essentially every
            website, that provider may automatically record standard technical request metadata
            (such as IP address, timestamp and user-agent) for security and operational purposes.
            We do not add analytics on top of this and do not combine it with anything you enter
            into a tool.
          </p>

          <h2>8. Circumstances in which data may leave your device</h2>
          <p>
            We design every tool to keep your data on your device, but no website operator can
            guarantee that data is never transmitted, and we do not provide such a guarantee.
            Factors outside our control — your network, browser, browser extensions, operating
            system, security software, or the third-party libraries above — could transmit,
            cache, or expose data independently of us. In addition, certain current or future
            features may genuinely require sending data to a server (for example, a feature that
            cannot run locally); where a feature does this, we will indicate it at the point of
            use. By using the site you acknowledge that, in some circumstances, data may be
            processed outside your device, and that you use the tools at your own risk.
          </p>

          <h2>9. Disclaimer of warranties</h2>
          <p>
            The site and all tools are provided on an &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; basis, without warranties of any kind, whether express or implied,
            including but not limited to implied warranties of merchantability, fitness for a
            particular purpose, accuracy, security, privacy, or non-infringement. We do not
            warrant that the tools are error-free or secure, that results are accurate or
            complete, or that the site will be available or uninterrupted.
          </p>

          <h2>10. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by applicable law, dauntexlabs and its operators
            shall not be liable for any direct, indirect, incidental, special, consequential, or
            exemplary damages — including, without limitation, loss of data, loss of profits, or
            damages arising from inaccurate output or from any transmission or exposure of data —
            arising out of or relating to your use of, or inability to use, the site or tools,
            even if advised of the possibility of such damages. You are responsible for keeping
            your own backups and for verifying any output before relying on it.
          </p>

          <h2>11. Children</h2>
          <p>
            The site is a general-purpose utility and is not directed at children. Because we
            collect no personal information, none is knowingly collected from anyone.
          </p>

          <h2>12. Changes</h2>
          <p>
            If this policy changes, the updated version will be posted on this page with a new
            date. Material changes to how the tools handle data will be reflected here.
          </p>

          <h2>13. Contact</h2>
          <p>
            Questions about privacy? Reach out at{' '}
            <a href="mailto:privacy@dauntexlabs.com">privacy@dauntexlabs.com</a>.
          </p>
        </div>

        <Link href="/" className="back">
          ← back to tools
        </Link>
      </main>
      <Footer />
    </>
  )
}
