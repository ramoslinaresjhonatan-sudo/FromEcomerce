import { useState, useEffect } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api from '../../services/api'
import axios from 'axios'

export default function Categorias() {
  const [items, setItems]       = useState([])
  const [search, setSearch]     = useState('')
  const [nombre, setNombre]     = useState('')
  const [descripcion, setDesc]  = useState('')
  const [imagenUrl, setImgUrl]  = useState('')
  const [selectedFile, setFile] = useState(null)
  const [preview, setPreview]   = useState(null)
  const [editId, setEditId]     = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  /* ── Fetch ── */
  const load = () => {
    api.get('/categorias/', { params: { q: search } })
      .then(resp => setItems(resp.data))
      .catch(() => setItems([]))
  }

  useEffect(() => { load() }, [search])

  /* ── Create / Update ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsUploading(true)
    try {
      let finalImgUrl = imagenUrl

      if (selectedFile) {
        const formData = new FormData()
        formData.append('image', selectedFile)
        const apiKey = import.meta.env.VITE_IMGBB_API_KEY
        const bbResp = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData)
        if (bbResp.data.success) finalImgUrl = bbResp.data.data.url
      }

      const endpoint = editId ? `/categorias/${editId}/` : '/categorias/'
      const method = editId ? 'put' : 'post'
      
      const resp = await api[method](endpoint, { 
        nombre, 
        descripcion, 
        imagen_url: finalImgUrl 
      })

      showToast(editId ? 'Categoría actualizada' : 'Categoría guardada', 'success')
      cancelEdit()
      load()
    } catch (err) {
      const msg = err.response?.data?.nombre ? 'Ya existe una categoría con ese nombre.' : (err.response?.data ? JSON.stringify(err.response.data) : err.message)
      showToast(msg, 'error')
    } finally {
      setIsUploading(false)
    }
  }

  /* ── Toggle estado ── */
  const toggleEstado = (id) => {
    api.post(`/categorias/${id}/toggle_estado/`)
      .then(resp => {
        showToast(resp.data.estado ? 'Categoría reactivada' : 'Categoría desactivada', 'info');
        load();
      })
      .catch(() => showToast('Error al cambiar estado', 'error'))
  }

  /* ── Delete permanente ── */
  const deletePermanent = (id, nombre) => {
    if (!confirm(`¿Eliminar permanentemente "${nombre}"? Esta acción no se puede deshacer.`)) return
    api.delete(`/categorias/${id}/`)
      .then(() => {
        showToast('Categoría eliminada permanentemente', 'success');
        load();
      })
      .catch(() => showToast('Error al eliminar', 'error'))
  }

  /* ── Edit mode ── */
  const startEdit = (cat) => {
    setEditId(cat.id)
    setNombre(cat.nombre)
    setDesc(cat.descripcion || '')
    setImgUrl(cat.imagen_url || '')
    setPreview(cat.imagen_url || null)
    setFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setNombre('')
    setDesc('')
    setImgUrl('')
    setFile(null)
    setPreview(null)
  }

  /* ── Filtrar activos / inactivos ── */
  const filtered = items.filter(c => showInactive ? !c.estado : c.estado)

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Categorías</h1>
          <p>Gestiona las categorías de tus productos.</p>
        </div>

        {/* ── Formulario crear / editar ── */}
        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Nombre *</label>
                <div className={Css.inputWrap}>
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                    placeholder="Ej: Electrónica"
                  />
                </div>
              </div>
              <div className={Css.field}>
                <label>Descripción</label>
                <div className={Css.inputWrap}>
                  <input
                    value={descripcion}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Descripción breve"
                  />
                </div>
              </div>
              <div className={Css.field} style={{ gridColumn: 'span 2' }}>
                <label>Imagen de Categoría</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div 
                    onClick={() => document.getElementById('cat-img').click()}
                    style={{ 
                      width: '100px', height: '100px', borderRadius: '12px', border: '2px dashed var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      overflow: 'hidden', background: 'var(--light)'
                    }}
                  >
                    {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.5rem' }}>+</span>}
                  </div>
                  <input id="cat-img" type="file" hidden onChange={handleFileChange} accept="image/*" />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click para subir imagen</p>
                </div>
              </div>
            </div>
            <div className={Css.actions} style={{ marginTop: '1rem' }}>
              {editId && (
                <button type="button" className={Css.btnReset} onClick={cancelEdit}>
                  Cancelar
                </button>
              )}
              <button type="submit" className={Css.btnSave} disabled={isUploading}>
                {isUploading ? 'Subiendo...' : (editId ? 'Actualizar' : 'Guardar Categoría')}
              </button>
            </div>
          </div>
        </form>

        {/* ── Lista ── */}
        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Lista de Categorías</h2>
              <button
                type="button"
                className={Css.btnReset}
                onClick={() => setShowInactive(!showInactive)}
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
              >
                {showInactive ? 'Ver activas' : 'Ver inactivas'}
              </button>
            </div>

            {/* Buscador */}
            <div className={Css.inputWrap} style={{ marginBottom: '1rem' }}>
              <ion-icon name="search-outline" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar categoría…"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  {showInactive ? 'No hay categorías inactivas.' : 'No hay categorías registradas.'}
                </p>
              )}
              {filtered.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px',
                    background: 'var(--surface)', opacity: cat.estado ? 1 : 0.6,
                    gap: '0.75rem', flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: '200px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                      {cat.imagen_url ? <img src={cat.imagen_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#9ca3af' }}>N/A</div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {cat.nombre}
                        {!cat.estado && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginLeft: '0.5rem' }}>Inactiva</span>}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {cat.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    {cat.estado && (
                      <button
                        className={Css.btnSave}
                        onClick={() => startEdit(cat)}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      className={Css.btnReset}
                      onClick={() => toggleEstado(cat.id)}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                    >
                      {cat.estado ? 'Desactivar' : 'Reactivar'}
                    </button>
                    {!cat.estado && (
                      <button
                        className={Css.btnReset}
                        onClick={() => deletePermanent(cat.id, cat.nombre)}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', color: '#EF4444' }}
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
