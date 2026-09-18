import { useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

function kecilkanFoto(file, ukuran = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const sisi = Math.min(img.width, img.height)
      const sx = (img.width - sisi) / 2
      const sy = (img.height - sisi) / 2
      const canvas = document.createElement('canvas')
      canvas.width = ukuran
      canvas.height = ukuran
      canvas.getContext('2d').drawImage(img, sx, sy, sisi, sisi, 0, 0, ukuran, ukuran)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Gagal memproses foto'))),
        'image/jpeg',
        0.8
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Foto tidak bisa dibaca'))
    }
    img.src = url
  })
}

export default function AvatarUpload({ userId, nama, avatarUrl, onChange, ukuran = 96 }) {
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const huruf = (nama || '?').trim().charAt(0).toUpperCase()

  async function handlePilih(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const blob = await kecilkanFoto(file)
      const path = `${userId}/avatar.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw new Error('Gagal mengunggah foto: ' + uploadError.message)

      const { data: publik } = supabase.storage.from('avatar').getPublicUrl(path)
      const urlBaru = `${publik.publicUrl}?v=${Date.now()}`

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlBaru })
        .eq('id', userId)
        .select('id')
      if (updateError || !data || data.length === 0) {
        throw new Error('Foto terunggah tapi gagal disimpan ke profil.')
      }
      if (onChange) onChange(urlBaru)
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div
        style={{ width: ukuran, height: ukuran }}
        className="rounded-full overflow-hidden bg-blue-100 flex items-center justify-center"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={nama || 'Foto profil'} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl font-bold text-blue-700">{huruf}</span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handlePilih} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current && inputRef.current.click()}
        disabled={loading}
        className="mt-2 text-sm text-blue-600 underline disabled:opacity-50"
      >
        {loading ? 'Mengunggah...' : 'Ganti foto'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1 text-center">{error}</p>}
    </div>
  )
}
