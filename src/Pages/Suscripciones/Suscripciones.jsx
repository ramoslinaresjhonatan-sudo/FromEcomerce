import { useState, useEffect } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api from '../../services/api'

export default function Suscripciones() {
  const [items, setItems]       = useState([])
  const [search, setSearch]     = useState('')
  const [nombre, setNombre]     = useState('')
  const [descripcion, setDesc]  = useState('')
  const [precio, setPrecio]     = useState('')
  const [editId, setEditId]     = useState(null)
  const [showInactive, setShowInactive] = useState(false)

  /* ── Fetch ── */
  const load = () => {
    api.get('/suscripciones/', { params: { q: search } })
      .then(resp => setItems(Array.isArray(resp.data) ? resp.data : []))
      .catch(() => setItems([]))
  }

  useEffect(() => { load() }, [search])

  /* ── Create / Update ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !descripcion.trim() || !precio) {
      showToast('Nombre, descripción y precio son obligatorios.', 'error')
      return
    }
    try {
      const endpoint = editId ? `/suscripciones/${editId}/` : '/suscripciones/'
      const method = editId ? 'put' : 'post'
      
      await api[method](endpoint, { nombre, descripcion, precio: parseFloat(precio) })

      showToast(editId ? 'Suscripción actualizada' : 'Suscripción creada', 'success')
      cancelEdit()
      load()
    } catch (err) {
      const msg = err.response?.data?.nombre ? 'Ya existe una suscripción con ese nombre.' : (err.response?.data ? JSON.stringify(err.response.data) : err.message)
      showToast(msg, 'error')
    }
  }

  /* ── Toggle estado ── */
  const toggleEstado = (id) => {
    api.post(`/suscripciones/${id}/toggle_estado/`)
      .then(resp => {
        showToast(resp.data.estado ? 'Suscripción reactivada' : 'Suscripción desactivada', 'info')
        load()
      })
      .catch(() => showToast('Error al cambiar estado', 'error'))
  }

  /* ── Delete permanente ── */
  const deletePermanent = (id, nombre) => {
    if (!confirm(`¿Eliminar permanentemente "${nombre}"? Esta acción no se puede deshacer.`)) return
    api.delete(`/suscripciones/${id}/`)
      .then(() => {
        showToast('Suscripción eliminada permanentemente', 'success')
        load()
      })
      .catch(() => showToast('Error al eliminar', 'error'))
  }

  /* ── Edit mode ── */
  const startEdit = (item) => {
    setEditId(item.id)
    setNombre(item.nombre || '')
    setDesc(item.descripcion || '')
    setPrecio(item.precio || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setNombre(''); setDesc(''); setPrecio('')
  }

  /* ── Filtrar activos / inactivos ── */
  const filtered = items.filter(s => showInactive ? !s.estado : s.estado)

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Suscripciones</h1>
          <p>Gestiona las suscripciones registradas en el sistema.</p>
        </div>

        {/* ── Formulario crear / editar ── */}
        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Suscripción' : 'Nueva Suscripción'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Nombre *</label>
                <div className={Css.inputWrap}>
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                    placeholder="Ej: Plan Básico"
                  />
                </div>
              </div>
              <div className={Css.field}>
                <label>Precio *</label>
                <div className={Css.inputWrap}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precio}
                    onChange={e => setPrecio(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className={Css.field} style={{ gridColumn: 'span 2' }}>
                <label>Descripción *</label>
                <div className={Css.inputWrap}>
                  <input
                    value={descripcion}
                    onChange={e => setDesc(e.target.value)}
                    required
                    placeholder="Descripción del plan de suscripción"
                  />
                </div>
              </div>
            </div>
            <div className={Css.actions} style={{ marginTop: '1rem' }}>
              {editId && (
                <button type="button" className={Css.btnReset} onClick={cancelEdit}>
                  Cancelar
                </button>
              )}
              <button type="submit" className={Css.btnSave}>
                {editId ? 'Actualizar' : 'Guardar Suscripción'}
              </button>
            </div>
          </div>
        </form>

        {/* ── Lista ── */}
        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Lista de Suscripciones</h2>
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
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar suscripción…"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  {showInactive ? 'No hay suscripciones inactivas.' : 'No hay suscripciones registradas.'}
                </p>
              )}
              {filtered.map(sub => (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px',
                    background: 'var(--surface)', opacity: sub.estado ? 1 : 0.6,
                    gap: '0.75rem', flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {sub.nombre}
                      <span style={{
                        marginLeft: '0.75rem', fontSize: '0.85rem', fontWeight: 700,
                        color: 'var(--app-primary)',
                      }}>
                        Bs. {parseFloat(sub.precio).toFixed(2)}
                      </span>
                      {!sub.estado && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginLeft: '0.5rem' }}>Inactiva</span>}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {sub.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    {sub.estado && (
                      <button
                        className={Css.btnSave}
                        onClick={() => startEdit(sub)}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      className={Css.btnReset}
                      onClick={() => toggleEstado(sub.id)}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                    >
                      {sub.estado ? 'Desactivar' : 'Reactivar'}
                    </button>
                    {!sub.estado && (
                      <button
                        className={Css.btnReset}
                        onClick={() => deletePermanent(sub.id, sub.nombre)}
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
