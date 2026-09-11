/** Console grid + glow behind a screen. The glow color follows the nearest data-alert. */
export default function Backdrop() {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-console-glow" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-console-grid opacity-60"
      />
    </>
  )
}
