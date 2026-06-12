/** 内联 SVG 描边图标（lucide 风格），统一 1.8 描边、圆角端点 */

const PATHS: Record<string, React.ReactNode> = {
  convert: (
    <>
      <path d="M16 3h5v5" />
      <path d="M8 21H3v-5" />
      <path d="M21 3l-7.5 7.5" />
      <path d="M3 21l7.5-7.5" />
    </>
  ),
  stitch: (
    <>
      <rect x="3" y="3" width="7" height="18" rx="1.5" />
      <rect x="14" y="3" width="7" height="18" rx="1.5" />
    </>
  ),
  watermark: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 15l2.5-6 2.5 6" />
      <path d="M9 13.5h3" />
      <path d="M15 9v6" />
    </>
  ),
  resize: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 15l6-6" />
      <path d="M15 13v-4h-4" />
      <path d="M9 11v4h4" />
    </>
  ),
  crop: (
    <>
      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </>
  ),
  compress: (
    <>
      <path d="M4 14h6v6" />
      <path d="M20 10h-6V4" />
      <path d="M14 10l7-7" />
      <path d="M3 21l7-7" />
    </>
  ),
  exif: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h6" />
      <path d="M7 12h10" />
      <path d="M7 16h8" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  split: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 3v18" />
      <path d="M3 12h18" />
    </>
  ),
  gif: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M9 10.5a2 2 0 1 0 0 3h.5v-1.5" />
      <path d="M13 9.5v5" />
      <path d="M16 14.5v-5h3" />
      <path d="M16 12h2.5" />
    </>
  ),
  frames: (
    <>
      <rect x="2" y="6" width="13" height="13" rx="2" />
      <path d="M6 2h12a4 4 0 0 1 4 4v12" />
    </>
  ),
  merge: (
    <>
      <path d="M8 7l4-4 4 4" />
      <path d="M12 3v8" />
      <path d="M8 17l4 4 4-4" />
      <path d="M12 21v-8" />
      <path d="M3 12h18" />
    </>
  ),
  reverse: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M6 1v4.5h4.5" />
    </>
  ),
  webp: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 9l1.5 6L11 9l2.5 6L15 9" />
      <path d="M17.5 9v6" />
    </>
  ),
  video: (
    <>
      <rect x="2" y="5" width="14" height="14" rx="2" />
      <path d="M16 10l6-3.5v11L16 14" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.2 8.2L21 21" />
      <path d="M8.2 15.8L21 3" />
    </>
  ),
  magic: (
    <>
      <path d="M15 4V2" />
      <path d="M15 10V8" />
      <path d="M11.5 6h-2" />
      <path d="M20.5 6h-2" />
      <path d="M17.8 3.2l-1.4 1.4" />
      <path d="M13.6 7.4l-1.4 1.4" />
      <path d="M17.8 8.8l-1.4-1.4" />
      <path d="M3 21L12.2 11.8" />
    </>
  ),
  github: (
    <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 8l5-5 5 5" />
      <path d="M12 3v12" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  zip: (
    <>
      <path d="M4 21V3h10l6 6v12z" />
      <path d="M14 3v6h6" />
      <path d="M9 8h2M9 11h2M9 14h2" />
    </>
  ),
  x: <path d="M18 6L6 18M6 6l12 12" />,
  back: <path d="M15 18l-6-6 6-6" />,
  'arrow-up': <path d="M12 19V5M5 12l7-7 7 7" />,
  'arrow-down': <path d="M12 5v14M19 12l-7 7-7-7" />,
  check: <path d="M20 6L9 17l-5-5" />,
  alert: (
    <>
      <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-4.5-4.5L6 21" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.5-4.5" />
    </>
  ),
}

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
