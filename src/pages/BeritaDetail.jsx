import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import LencanaBadge from '../components/LencanaBadge'

const JENIS_REAKSI = [
  { key: 'suka', emoji: '👍', label: 'Suka' },
  { key: 'cinta', emoji: '❤️', label: 'Cinta' },
  { key: 'kaget', emoji: '😮', label: 'Kaget' },
]

function BeritaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [berita, setBerita] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [userId, setUserId] = useState(null)
  const [reaksiSaya, setReaksiSaya] = useState(null)
  const [jumlahReaksi, setJumlahReaksi] = useState({ suka: 0, cinta: 0, kaget: 0 })

  const [komentarList, setKomentarList] = useState([])
  const [isiKomentar, setIsiKomentar] = useState('')
  const [komentarEditId, setKomentarEditId] = useState(null)
  const [isiKomentarEdit, setIsiKomentarEdit] = useState('')
  const [kirimLoading, setKirimLoading] = useState(false)

  useEffect(() => {
    async function muatSemuaData() {
      setLoading(true)
      setErrorMsg('')

      const { data: sessionData } = await supabase.auth.getSession()
      const uid = sessionData?.session?.user?.id || null
      setUserId(uid)

      const { data: beritaData, error: beritaError } = await supabase
        .from('berita')
        .select('*')
        .eq('id', id)
        .single()

      if (beritaError || !beritaData) {
        setErrorMsg('Berita tidak ditemukan.')
        setLoading(false)
        return
      }
      setBerita(beritaData)

      await muatReaksi(uid)
      await muatKomentar()

      setLoading(false)
    }

    muatSemuaData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function muatReaksi(uid) {
    const { data: semuaReaksi } = await supabase
      .from('reactions')
      .select('jenis, user_id')
      .eq('berita_id', id)

    const hitung = { suka: 0, cinta: 0, kaget: 0 }
    let punyaSaya = null

    if (semuaReaksi) {
      semuaReaksi.forEach((r) => {
        if (hitung[r.jenis] !== undefined) {
          hitung[r.jenis] = hitung[r.jenis] + 1
        }
        if (uid && r.user_id === uid) {
          punyaSaya = r.jenis
        }
      })
    }

    setJumlahReaksi(hitung)
    setReaksiSaya(punyaSaya)
  }

  async function muatKomentar() {
    const { data: komentarData } = await supabase
      .from('comments')
      .select('id, isi, created_at, user_id')
      .eq('berita_id', id)
      .order('created_at', { ascending: true })

    if (!komentarData || komentarData.length === 0) {
      setKomentarList([])
      return
    }

    const idPengirim = [...new Set(komentarData.map((k) => k.user_id))]
    const { data: profilData } = await supabase
      .from('profiles')
      .select('id, nama, centang_akurat')
      .in('id', idPengirim)

    const petaProfil = {}
    if (profilData) {
      profilData.forEach((p) => {
        petaProfil[p.id] = p
      })
    }

    const gabung = komentarData.map((k) => ({
      ...k,
      nama_pengirim: petaProfil[k.user_id]?.nama || 'Warga',
      centang_akurat: petaProfil[k.user_id]?.centang_akurat || false,
    }))

    setKomentarList(gabung)
  }

  async function handleReaksi(jenisBaru) {
    if (!userId) {
      alert('Silakan login dulu untuk memberi reaksi.')
      navigate('/login')
      return
    }

    if (reaksiSaya === jenisBaru) {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('berita_id', id)
        .eq('user_id', userId)

      if (!error) {
        await muatReaksi(userId)
      }
      return
    }

    const { error } = await supabase
      .from('reactions')
      .upsert(
        { berita_id: id, user_id: userId, jenis: jenisBaru },
        { onConflict: 'berita_id,user_id' }
      )

    if (!error) {
      await muatReaksi(userId)
    }
  }

  async function handleKirimKomentar(e) {
    e.preventDefault()

    if (!userId) {
      alert('Silakan login dulu untuk berkomentar.')
      navigate('/login')
      return
    }

    const teks = isiKomentar.trim()
    if (!teks) return

    setKirimLoading(true)

    const { error } = await supabase.from('comments').insert({
      berita_id: id,
      user_id: userId,
      isi: teks,
    })

    setKirimLoading(false)

    if (!error) {
      setIsiKomentar('')
      await muatKomentar()
    } else {
      alert('Gagal mengirim komentar, coba lagi.')
    }
  }

  async function handleHapusKomentar(komentarId) {
    const konfirmasi = window.confirm('Hapus komentar ini?')
    if (!konfirmasi) return

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', komentarId)
      .eq('user_id', userId)

    if (!error) {
      await muatKomentar()
    }
  }

  function handleMulaiEditKomentar(k) {
    setKomentarEditId(k.id)
    setIsiKomentarEdit(k.isi)
  }

  function handleBatalEditKomentar() {
    setKomentarEditId(null)
    setIsiKomentarEdit('')
  }

  async function handleSimpanEditKomentar(komentarId) {
    const isi = isiKomentarEdit.trim()

    if (!isi) {
      alert('Komentar tidak boleh kosong.')
      return
    }

    const { error } = await supabase
      .from('comments')
      .update({ isi })
      .eq('id', komentarId)
      .eq('user_id', userId)

    if (error) {
      alert('Gagal mengubah komentar, coba lagi.')
      return
    }

    setKomentarEditId(null)
    setIsiKomentarEdit('')
    await muatKomentar()
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-blue-600">Memuat berita...</div>
    )
  }

  if (errorMsg) {
    return (
      <div className="p-4 text-center text-rose-600">
        {errorMsg}
        <div className="mt-3">
          <button
            onClick={() => navigate('/berita')}
            className="text-blue-600 underline"
          >
            Kembali ke daftar berita
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      <button
        onClick={() => navigate('/berita')}
        className="text-blue-600 mb-3 inline-block"
      >
        ← Kembali
      </button>

      {berita.foto && (
        <img
          src={berita.foto}
          alt={berita.judul}
          className="w-full rounded-xl mb-3 object-cover max-h-64"
        />
      )}

      <h1 className="text-xl font-bold text-blue-900 mb-1">
        {berita.judul}
      </h1>

      <p className="text-xs text-blue-500 mb-3">
        {berita.kategori} · {berita.wilayah || berita.kecamatan || ''}
      </p>

      <p className="text-gray-700 whitespace-pre-line mb-4">
        {berita.deskripsi}
      </p>

      <div className="flex gap-2 mb-6">
        {JENIS_REAKSI.map((r) => (
          <button
            key={r.key}
            onClick={() => handleReaksi(r.key)}
            className={
              'flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm ' +
              (reaksiSaya === r.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-700 border-blue-200')
            }
          >
            <span>{r.emoji}</span>
            <span>{jumlahReaksi[r.key]}</span>
          </button>
        ))}
      </div>

      <h2 className="text-base font-semibold text-blue-900 mb-2">
        Komentar ({komentarList.length})
      </h2>

      <form onSubmit={handleKirimKomentar} className="mb-4">
        <textarea
          value={isiKomentar}
          onChange={(e) => setIsiKomentar(e.target.value)}
          placeholder="Tulis komentar..."
          className="w-full border border-blue-200 rounded-lg p-2 text-sm mb-2"
          rows={2}
        />
        <button
          type="submit"
          disabled={kirimLoading}
          className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg"
        >
          {kirimLoading ? 'Mengirim...' : 'Kirim'}
        </button>
      </form>

      <div className="space-y-3">
        {komentarList.length === 0 && (
          <p className="text-sm text-gray-400">Belum ada komentar.</p>
        )}

        {komentarList.map((k) => (
          <div key={k.id} className="border-b border-blue-100 pb-2">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-blue-900 flex items-center gap-1">
                {k.nama_pengirim}
                {k.centang_akurat && <LencanaBadge size={14} />}
              </p>
              {userId === k.user_id && (
                <div className="flex gap-2">
                  {komentarEditId !== k.id && (
                    <button
                      onClick={() => handleMulaiEditKomentar(k)}
                      className="text-xs text-blue-500"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleHapusKomentar(k.id)}
                    className="text-xs text-rose-500"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>

            {komentarEditId === k.id ? (
              <div className="mt-2">
                <textarea
                  value={isiKomentarEdit}
                  onChange={(e) => setIsiKomentarEdit(e.target.value)}
                  className="w-full rounded-lg border border-blue-200 p-2 text-sm"
                  rows={3}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleSimpanEditKomentar(k.id)}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={handleBatalEditKomentar}
                    className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-gray-700"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700">{k.isi}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BeritaDetail
