import { useNavigate } from 'react-router-dom'

/**
 * Header standar untuk halaman selain Home.
 * Pakai ini di halaman lain (Peta, Berita, Layanan, dst) supaya
 * semua halaman punya header yang konsisten satu sama lain.
 *
 * Contoh pakai:
 *   <AppHeader title="Berita Surabaya" />
 *   <AppHeader title="Detail Laporan" backTo="/" />
 */
export default function AppHeader({ title, backTo, right = null }) {
  const navigate = useNavigate()

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <button
          onClick={() => (backTo ? navigate(backTo) : navigate('/'))}
          className="app-back-btn"
          aria-label="Kembali"
        >
          ←
        </button>
        <h1 className="app-header-title flex-1 truncate">{title}</h1>
        {right}
      </div>
    </header>
  )
}
