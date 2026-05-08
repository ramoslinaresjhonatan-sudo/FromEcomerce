import { useState, useEffect } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'

const API = 'http://localhost:8000/api/sucursales/'

export default function Sucursales() {
  const [items, setItems]       = useState([])
  const [search, setSearch]     = useState('')
  const [nombre, setNombre]     = useState('')
  const [descripcion, setDesc]  = useState('')
  const [telefono, setTelefono] = useState('')
  const [editId, setEditId]     = useState(null)
  const [showInactive, setShowInactive] = useState(false)

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

  /* ── Create / Update ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !telefono.trim()) {
      showToast('Nombre y teléfono son obligatorios.', 'error')
      return
    }
    try {
      const url = editId ? `${API}${editId}/` : API
      const method = editId ? 'PUT' : 'POST'
      const resp = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ nombre, descripcion, telefono })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(JSON.stringify(data))

      showToast(editId ? 'Sucursal actualizada correctamente' : 'Sucursal registrada correctamente', 'success')
      cancelEdit()
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  /* ── Toggle estado ── */
  const toggleEstado = (id) => {
    fetch(`${API}${id}/toggle_estado/`, { method: 'POST', headers })
      .then(r => r.json())
      .then(data => {
        showToast(data.estado ? 'Sucursal reactivada' : 'Sucursal desactivada', 'info')
        load()
      })
      .catch(() => showToast('Error al cambiar estado', 'error'))
  }

  /* ── Delete ── */
  const deleteItem = (id, name) => {
    if (!confirm(`¿Eliminar la sucursal "${name}"? Esta acción no se puede deshacer.`)) return
    fetch(`${API}${id}/`, { method: 'DELETE', headers })
      .then(() => {
        showToast('Sucursal eliminada correctamente', 'success')
        load()
      })
      .catch(() => showToast('Error al eliminar', 'error'))
  }

  /* ── Edit mode ── */
  const startEdit = (item) => {
    setEditId(item.id)
    setNombre(item.nombre || '')
    setDesc(item.descripcion || '')
    setTelefono(item.telefono || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setNombre(''); setDesc(''); setTelefono('')
  }

  /* ── Filtrar activos / inactivos ── */
  const filtered = items.filter(s => showInactive ? !s.estado : s.estado)

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Sucursales</h1>
          <p>Gestiona las sucursales de tu empresa.</p>
        </div>

        {/* ── Formulario crear / editar ── */}
        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Nombre *</label>
                <div className={Css.inputWrap}>
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                    placeholder="Nombre de la sucursal"
                  />
                </div>
              </div>
              <div className={Css.field}>
                <label>Teléfono *</label>
                <div className={Css.inputWrap}>
                  <input
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    required
                    placeholder="+591 70000000"
                  />
                </div>
              </div>
              <div className={Css.field} style={{ gridColumn: 'span 2' }}>
                <label>Descripción</label>
                <div className={Css.inputWrap}>
                  <input
                    value={descripcion}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Descripción breve de la sucursal"
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
                {editId ? 'Actualizar' : 'Guardar Sucursal'}
              </button>
            </div>
          </div>
        </form>

        {/* ── Lista ── */}
        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Lista de Sucursales</h2>
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
                placeholder="Buscar sucursal…"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  {showInactive ? 'No hay sucursales inactivas.' : 'No hay sucursales registradas.'}
                </p>
              )}
              {filtered.map(suc => (
                <div
                  key={suc.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px',
                    background: 'var(--surface)', opacity: suc.estado ? 1 : 0.6,
                    gap: '0.75rem', flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {suc.nombre}
                      {!suc.estado && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginLeft: '0.5rem' }}>Inactiva</span>}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      📞 {suc.telefono || '—'} · {suc.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    {suc.estado && (
                      <button
                        className={Css.btnSave}
                        onClick={() => startEdit(suc)}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      className={Css.btnReset}
                      onClick={() => toggleEstado(suc.id)}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                    >
                      {suc.estado ? 'Desactivar' : 'Reactivar'}
                    </button>
                    {!suc.estado && (
                      <button
                        className={Css.btnReset}
                        onClick={() => deleteItem(suc.id, suc.nombre)}
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
