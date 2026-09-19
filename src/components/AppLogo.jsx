export default function AppLogo({ size = 200 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A9AE8" />
          <stop offset="100%" stopColor="#0C447C" />
        </linearGradient>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#CFE4FA" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="100" r="98" fill="url(#bgGrad)" />
      <circle cx="100" cy="100" r="68" fill="none" stroke="url(#ringGrad)" strokeWidth="4" />
      <circle cx="100" cy="100" r="60" fill="#ffffff" opacity="0.97" />

      <g stroke="#0C447C" strokeWidth="1.5" opacity="0.5">
        <line x1="100" y1="46" x2="100" y2="52" />
        <line x1="100" y1="148" x2="100" y2="154" />
        <line x1="46" y1="100" x2="52" y2="100" />
        <line x1="148" y1="100" x2="154" y2="100" />
      </g>

      <path d="M 100 100 L 100 60 A 40 40 0 0 0 71.7 71.7 Z" fill="#4A9AE8" opacity="0.15" />

      <g style={{ transformOrigin: '100px 100px', animation: 'appLogoHour 8s linear infinite' }}>
        <line x1="100" y1="100" x2="100" y2="62" stroke="#0C447C" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g style={{ transformOrigin: '100px 100px', animation: 'appLogoMin 2.4s linear infinite' }}>
        <line x1="100" y1="100" x2="128" y2="78" stroke="#4A9AE8" strokeWidth="3.5" strokeLinecap="round" />
      </g>

      <circle cx="100" cy="100" r="4.5" fill="#0C447C" />

      <style>{`
        @keyframes appLogoHour { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes appLogoMin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </svg>
  )
}
