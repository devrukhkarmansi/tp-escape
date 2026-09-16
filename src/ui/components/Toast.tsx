import { motion } from 'motion/react'
import { useEffect } from 'react'

type Props = {
  id: string
  text: string
  /** Should be a stable function (useCallback), so each toast's timer starts only once. */
  onDone: (id: string) => void
  durationMs?: number
}

/** A short message at the bottom of the screen that clears itself. */
export default function Toast({ id, text, onDone, durationMs = 4000 }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(id), durationMs)
    return () => clearTimeout(timer)
  }, [id, onDone, durationMs])

  return (
    <motion.p
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="rounded-xl border border-nominal/40 bg-panel-raised/95 px-4 py-2.5 font-display text-xs text-nominal shadow-lg shadow-black/40 backdrop-blur"
    >
      ✓ {text}
    </motion.p>
  )
}
