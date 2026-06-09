// Fixed atmospheric layers: blueprint grid + vignette, and a grain overlay.
export default function Backdrop() {
  return (
    <>
      <div className="backdrop" aria-hidden />
      <div className="grain" aria-hidden />
    </>
  )
}
