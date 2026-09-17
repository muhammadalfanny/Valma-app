import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import AppHeader from '../components/AppHeader'
import LencanaBadge from '../components/LencanaBadge'

const ROLE_OPTIONS = ['user', 'admin', 'developer']

const formatTanggal = (iso) => {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

const badgeKelasRole = (role) => {
  if (role === 'developer') return 'badge-neutral'
  if (role === 'admin') return 'badge-brand'
  return 'badge-success'
}

export default function AdminPengguna() {
  const [daftarUser, setDaftarUser] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [pencarian, setPencarian] = useState('')
  const [filterRole, setFilterRole] = useState('semua')
  const [memproses, setMemproses] = useState(null)
  const [suksesId, setSuksesId] = useState(null)
  const [memprosesLencana, setMemprosesLencana] = useState(null)
  const [tabAktif, setTabAktif] = useState('daftar')
  const [editNamaId, setEditNamaId] = useState(null)
  const [namaEdit, setNamaEdit] = useState('')
  const [simpanNamaLoading, setSimpanNamaLoading] = useState(null)

  const ambilData = async () => {
    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setErrorMsg(
        'Gagal memuat daftar pengguna: ' +
          error.message +
          '. Kemungkinan besar tabel "profiles" belum punya aturan RLS yang mengizinkan admin melihat data pengguna lain — perlu dicek di Supabase Dashboard > Authentication > Policies.'
      )
      setDaftarUser([])
    } else {
      setDaftarUser(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    ambilData()
  }, [])

  const ubahRole = async (id, roleBaru) => {
    setMemproses(id)
    setErrorMsg('')

    const { error } = await supabase
      .from('profiles')
      .update({ role: roleBaru })
      .eq('id', id)

    setMemproses(null)

    if (error) {
      console.error(error)
      setErrorMsg('Gagal mengubah role: ' + error.message)
      return
    }

    setDaftarUser((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: roleBaru } : u))
    )
    setSuksesId(id)
    setTimeout(() => setSuksesId(null), 2000)
  }

  const simpanNamaAdmin = async (id) => {
    const teks = namaEdit.trim()
    if (!teks) return

    setSimpanNamaLoading(id)
    setErrorMsg('')

    const { error } = await supabase
      .from('profiles')
      .update({ nama: teks })
      .eq('id', id)

    setSimpanNamaLoading(null)

    if (error) {
      console.error(error)
      setErrorMsg('Gagal mengubah nama: ' + error.message)
      return
    }

    setDaftarUser((prev) =>
      prev.map((u) => (u.id === id ? { ...u, nama: teks } : u))
    )
    setEditNamaId(null)
  }

  const toggleLencana = async (id, statusBaru) => {
    setMemprosesLencana(id)
    setErrorMsg('')

    const { error } = await supabase
      .from('profiles')
      .update({ centang_akurat: statusBaru })
      .eq('id', id)

    setMemprosesLencana(null)

    if (error) {
      console.error(error)
      setErrorMsg('Gagal mengubah lencana: ' + error.message)
      return
    }

    setDaftarUser((prev) =>
      prev.map((u) => (u.id === id ? { ...u, centang_akurat: statusBaru } : u))
    )
  }

  const setujuiPengajuan = async (id) => {
    setMemprosesLencana(id)
    setErrorMsg('')

    const { error } = await supabase
      .from('profiles')
      .update({ centang_akurat: true, lencana_menunggu: false })
      .eq('id', id)

    setMemprosesLencana(null)

    if (error) {
      console.error(error)
      setErrorMsg('Gagal menyetujui pengajuan: ' + error.message)
      return
    }

    setDaftarUser((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, centang_akurat: true, lencana_menunggu: false } : u
      )
    )
  }

  const tolakPengajuan = async (id) => {
    setMemprosesLencana(id)
    setErrorMsg('')

    const { error } = await supabase
      .from('profiles')
      .update({ lencana_menunggu: false })
      .eq('id', id)

    setMemprosesLencana(null)

    if (error) {
      console.error(error)
      setErrorMsg('Gagal menolak pengajuan: ' + error.message)
      return
    }

    setDaftarUser((prev) =>
      prev.map((u) => (u.id === id ? { ...u, lencana_menunggu: false } : u))
    )
  }

  const daftarPengajuanLencana = daftarUser.filter((u) => u.lencana_menunggu)

  const daftarTampil = daftarUser.filter((u) => {
    const cocokRole = filterRole === 'semua' || u.role === filterRole
    const q = pencarian.trim().toLowerCase()
    const cocokCari =
      !q ||
      (u.nama || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    return cocokRole && cocokCari
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <AppHeader title="Kelola Pengguna" backTo="/admin" />

      <main className="max-w-2xl mx-auto p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTabAktif('daftar')}
            className={`flex-1 text-xs font-bold px-3 py-2 rounded-lg ${
              tabAktif === 'daftar'
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            Daftar Pengguna
          </button>
          <button
            onClick={() => setTabAktif('pengajuan')}
            className={`flex-1 text-xs font-bold px-3 py-2 rounded-lg relative ${
              tabAktif === 'pengajuan'
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            Pengajuan Lencana
            {daftarPengajuanLencana.length > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {daftarPengajuanLencana.length}
              </span>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-700 p-3 rounded-xl mb-4 text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}

        {tabAktif === 'pengajuan' ? (
          <div className="space-y-3">
            {daftarPengajuanLencana.length === 0 ? (
              <p className="text-sm text-gray-400 text-center mt-10">
                Tidak ada pengajuan yang menunggu.
              </p>
            ) : (
              daftarPengajuanLencana.map((u) => (
                <div key={u.id} className="card p-4">
                  <p className="font-bold text-gray-900 text-sm">{u.nama || 'Tanpa Nama'}</p>
                  {u.email && (
                    <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                  )}
                  {u.lencana_alasan && (
                    <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg">
                      "{u.lencana_alasan}"
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setujuiPengajuan(u.id)}
                      disabled={memprosesLencana === u.id}
                      className="flex-1 bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
                    >
                      Setujui
                    </button>
                    <button
                      onClick={() => tolakPengajuan(u.id)}
                      disabled={memprosesLencana === u.id}
                      className="flex-1 bg-rose-50 text-rose-600 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
        <>
        <input
          type="text"
          value={pencarian}
          onChange={(e) => setPencarian(e.target.value)}
          placeholder="Cari nama atau email..."
          className="input-field mb-3"
        />

        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {[
            ['semua', 'Semua'],
            ['user', 'User'],
            ['admin', 'Admin'],
            ['developer', 'Developer'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterRole(key)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-full whitespace-nowrap transition-colors ${
                filterRole === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center mt-10">Memuat daftar pengguna...</p>
        ) : daftarTampil.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-10">Tidak ada pengguna yang cocok.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-semibold px-0.5">
              {daftarTampil.length} pengguna ditemukan
            </p>

            {daftarTampil.map((u) => (
              <div key={u.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {editNamaId === u.id ? (
                      <div className="mb-2">
                        <input
                          type="text"
                          value={namaEdit}
                          onChange={(e) => setNamaEdit(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-1.5 text-sm mb-1"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => simpanNamaAdmin(u.id)}
                            disabled={simpanNamaLoading === u.id}
                            className="text-[11px] font-semibold text-white bg-brand-600 px-3 py-1 rounded-lg"
                          >
                            {simpanNamaLoading === u.id ? 'Menyimpan...' : 'Simpan'}
                          </button>
                          <button
                            onClick={() => setEditNamaId(null)}
                            className="text-[11px] font-semibold text-gray-500 px-3 py-1"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="font-bold text-gray-900 text-sm truncate flex items-center gap-1.5">
                        {u.nama || 'Tanpa Nama'}
                        {u.centang_akurat && <LencanaBadge size={14} />}
                        <button
                          onClick={() => {
                            setEditNamaId(u.id)
                            setNamaEdit(u.nama || '')
                          }}
                          className="text-[10px] font-semibold text-brand-600 shrink-0"
                        >
                          Ubah
                        </button>
                      </p>
                    )}
                    {u.email && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      Daftar sejak {formatTanggal(u.created_at)}
                    </p>
                  </div>
                  <span className={badgeKelasRole(u.role)}>{u.role || 'user'}</span>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide shrink-0">
                    Ubah Role
                  </label>
                  <select
                    value={u.role || 'user'}
                    disabled={memproses === u.id}
                    onChange={(e) => ubahRole(u.id, e.target.value)}
                    className="flex-1 text-xs font-semibold rounded-lg border border-gray-200 px-2.5 py-2 bg-white disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {memproses === u.id && (
                    <span className="text-[11px] text-gray-400 shrink-0">Menyimpan...</span>
                  )}
                  {suksesId === u.id && (
                    <span className="text-[11px] text-emerald-600 font-semibold shrink-0">Tersimpan ✓</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2">
                  <button
                    onClick={() => toggleLencana(u.id, !u.centang_akurat)}
                    disabled={memprosesLencana === u.id}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 ${
                      u.centang_akurat
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {memprosesLencana === u.id
                      ? 'Memproses...'
                      : u.centang_akurat
                      ? 'Cabut Lencana ✅'
                      : 'Kasih Lencana ✅'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </main>
    </div>
  )
}
