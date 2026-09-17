export default function LencanaBadge({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Terverifikasi akurat"
    >
      <circle cx="12" cy="12" r="12" fill="#2563eb" />
      <path
        d="M7 12.5 L10.5 16 L17 8.5"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
