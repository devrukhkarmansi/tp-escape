// Small line icons drawn in currentColor, so they follow the text color of their button.
const common = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export function PauseIcon() {
  return (
    <svg {...common}>
      <path d="M7 4.5v11M13 4.5v11" />
    </svg>
  )
}

export function PlayIcon() {
  return (
    <svg {...common}>
      <path d="M6.5 4.5v11l9-5.5z" fill="currentColor" />
    </svg>
  )
}

export function SoundOnIcon() {
  return (
    <svg {...common}>
      <path d="M3.5 8v4h3l4 3.5v-11l-4 3.5z" />
      <path d="M13.5 7.5a3.5 3.5 0 0 1 0 5M15.8 5.2a6.8 6.8 0 0 1 0 9.6" />
    </svg>
  )
}

export function SoundOffIcon() {
  return (
    <svg {...common}>
      <path d="M3.5 8v4h3l4 3.5v-11l-4 3.5z" />
      <path d="M13.5 8l4 4M17.5 8l-4 4" />
    </svg>
  )
}
