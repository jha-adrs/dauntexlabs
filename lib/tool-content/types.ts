/** Server-rendered about / how-to / FAQ copy shown under a tool (see components/ToolAbout.tsx). */
export interface ToolContent {
  /** 1–3 short paragraphs: what it is, who needs it, why running on-device matters for it. */
  intro: string[]
  /** "How to use" — 3–6 imperative steps. */
  steps: string[]
  /** 3–6 Q&As, plain text. Also emitted as FAQPage JSON-LD. */
  faq: { q: string; a: string }[]
}
