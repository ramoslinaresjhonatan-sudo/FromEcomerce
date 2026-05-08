import { useState, useEffect, useRef } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'

const API = 'http://localhost:8000/api/archivos/'

export default function Archivos() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  /* form */
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('FOTO')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)

  const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY
  const token = localStorage.getItem('access_token')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  /* ── Fetch ── */
  const load = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    fetch(`${API}?${params}`, { headers })
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
  }

  useEffect(() => { load() }, [search])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      if (!selected.type.startsWith('image/') && !selected.type.startsWith('video/')) {
        showToast('Solo se permiten imágenes (ej. JPG, PNG) o videos.', 'error')
        e.target.value = null
        return
      }
      setFile(selected)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(selected)
      setTipo(selected.type.startsWith('image/') ? 'FOTO' : 'VIDEO')
    }
  }

  /* ── Create / Update ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !file) {
      showToast('Debe ingresar un nombre y seleccionar un archivo válido.', 'error')
      return
    }

    setIsUploading(true)
    let url = ''

    try {
      if (tipo === 'FOTO') {
        const formData = new FormData()
        formData.append('image', file)
        const respImg = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData
        })
        const dataImg = await respImg.json()
        if (!dataImg.success) throw new Error('Error al subir imagen')
        url = dataImg.data.url
      } else {
        // En una implementación real de video se usaría un storage como AWS S3, Cloudinary o Firebase.
        // Aquí simulamos que el video está subido si el usuario selecciona uno localmente.
        showToast('Advertencia: Subida de videos no soportada en servidor ImgBB. Usando objeto local temporal.', 'info')
        url = URL.createObjectURL(file)
      }

      const resp = await fetch(API, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nombre, url, tipo })
      })
      
      if (!resp.ok) {
        const dataErr = await resp.json()
        throw new Error(JSON.stringify(dataErr))
      }

      showToast('Archivo guardado correctamente', 'success')
      setNombre('')
      setFile(null)
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setIsUploading(false)
    }
  }

  /* ── Toggle estado ── */
  const toggleEstado = (id) => {
    fetch(`${API}${id}/toggle_estado/`, { method: 'POST', headers })
      .then(r => r.json())
      .then(data => {
        showToast(data.estado ? 'Archivo reactivado' : 'Archivo desactivado', 'info')
        load()
      })
      .catch(() => showToast('Error al cambiar estado', 'error'))
  }

  /* ── Delete ── */
  const deleteItem = (id, name) => {
    if (!confirm(`¿Eliminar el archivo "${name}" permanentemente?`)) return
    fetch(`${API}${id}/`, { method: 'DELETE', headers })
      .then(() => {
        showToast('Archivo eliminado', 'success')
        load()
      })
      .catch(() => showToast('Error al eliminar', 'error'))
  }

  const filtered = items.filter(a => showInactive ? !a.estado : a.estado)

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Archivos Globales</h1>
          <p>Sube y administra fotos o videos para utilizar en perfiles, almacenes u otros recursos.</p>
        </div>

        {/* ── Formulario crear ── */}
        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>Subir Nuevo Archivo</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Nombre del recurso *</label>
                <div className={Css.inputWrap}>
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                    placeholder="Ej: Foto Frontal Almacén"
                  />
                </div>
              </div>
              <div className={Css.field}>
                <label>Seleccionar Archivo (Foto o Video) *</label>
                <div className={Css.inputWrap}>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    required
                  />
                </div>
              </div>
            </div>
            
            {preview && tipo === 'FOTO' && (
              <div style={{ marginTop: '1rem', width: '150px', height: '150px' }}>
                <img src={preview} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--app-primary)' }} />
              </div>
            )}
            {preview && tipo === 'VIDEO' && (
              <div style={{ marginTop: '1rem', width: '200px' }}>
                <video src={preview} controls style={{ width: '100%', borderRadius: '12px' }} />
              </div>
            )}

            <div className={Css.actions} style={{ marginTop: '1rem' }}>
              <button type="submit" className={Css.btnSave} disabled={isUploading}>
                {isUploading ? 'Subiendo...' : 'Guardar Archivo'}
              </button>
            </div>
          </div>
        </form>

        {/* ── Lista / Carrusel ── */}
        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Recursos Almacenados</h2>
              <button
                type="button"
                className={Css.btnReset}
                onClick={() => setShowInactive(!showInactive)}
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
              >
                {showInactive ? 'Ver activos' : 'Ver inactivos'}
              </button>
            </div>

            <div className={Css.inputWrap} style={{ marginBottom: '1rem' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar archivo por nombre…"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', width: '100%', textAlign: 'center', padding: '2rem 0' }}>
                  {showInactive ? 'No hay archivos inactivos.' : 'No hay archivos subidos.'}
                </p>
              )}
              {filtered.map(arch => (
                <div
                  key={arch.id}
                  style={{
                    width: '200px', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '12px',
                    background: 'var(--surface)', opacity: arch.estado ? 1 : 0.6,
                    display: 'flex', flexDirection: 'column', gap: '0.5rem'
                  }}
                >
                  <div style={{ width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                    {arch.tipo === 'FOTO' ? (
                      <img src={arch.url} alt={arch.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <video src={arch.url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {arch.nombre}
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {arch.tipo} {!arch.estado && <span style={{ color: '#EF4444' }}>(Inactivo)</span>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', marginTop: 'auto' }}>
                    <button
                      className={Css.btnReset}
                      onClick={() => toggleEstado(arch.id)}
                      style={{ flex: 1, fontSize: '0.75rem', padding: '0.3rem' }}
                    >
                      {arch.estado ? 'Desactivar' : 'Reactivar'}
                    </button>
                    {!arch.estado && (
                      <button
                        className={Css.btnReset}
                        onClick={() => deleteItem(arch.id, arch.nombre)}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.3rem', color: '#EF4444' }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Template>
  )
}
