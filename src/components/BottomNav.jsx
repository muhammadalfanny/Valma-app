import { Link, useLocation } from 'react-router-dom'

const items = [
  { to: '/', label: 'Beranda', icon: '🏠' },
  { to: '/peta', label: 'Peta', icon: '🗺️' },
  { to: '/report', label: 'Lapor', icon: '📢', highlight: true },
  { to: '/layanan', label: 'Layanan', icon: '🏛️' },
  { to: '/profile', label: 'Profil', icon: '👤' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map((item) => {
          const active = pathname === item.to
          if (item.highlight) {
            return (
              <Link key={item.to} to={item.to} className="flex flex-col items-center justify-center -mt-5">
                <span className="w-14 h-14 rounded-full bg-brand-600 text-white text-2xl flex items-center justify-center shadow-[var(--shadow-floating)] border-4 border-white">
                  {item.icon}
                </span>
                <span className="text-[10px] font-bold text-brand-600 mt-1">{item.label}</span>
              </Link>
            )
          }
          return (
            <Link key={item.to} to={item.to} className={`bottom-nav-item ${active ? 'active' : ''}`}>
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
