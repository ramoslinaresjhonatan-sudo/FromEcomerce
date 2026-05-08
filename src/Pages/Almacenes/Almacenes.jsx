import { useState, useEffect } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api from '../../services/api'

export default function Almacenes() {
  const [items, setItems]       = useState([])
  const [sucursales, setSuc]    = useState([])
  const [usuarios, setUsu]      = useState([])
  const [search, setSearch]     = useState('')
  const [nombre, setNombre]     = useState('')
  const [ubicacion, setUbic]    = useState('')
  const [sucursalId, setSucId]  = useState('')
  const [responsableId, setResId] = useState('')
  const [editId, setEditId]     = useState(null)
  const [showInactive, setShowInactive] = useState(false)

  /* ── Fetch ── */
  const load = () => {
    api.get('/almacenes/', { params: { q: search } })
      .then(resp => setItems(Array.isArray(resp.data) ? resp.data : []))
      .catch(() => setItems([]))
  }

  const loadExtras = () => {
    api.get('/sucursales/').then(resp => setSuc(resp.data))
    api.get('/usuarios/').then(resp => setUsu(resp.data))
  }

  useEffect(() => { load() }, [search])
  useEffect(() => { loadExtras() }, [])

  /* ── Create / Update ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !sucursalId) {
      showToast('Nombre y sucursal son obligatorios.', 'error')
      return
    }
    try {
      const endpoint = editId ? `/almacenes/${editId}/` : '/almacenes/'
      const method = editId ? 'put' : 'post'
      
      await api[method](endpoint, { 
        nombre, 
        ubicacion, 
        sucursal: sucursalId,
        responsable: responsableId || null
      })

      showToast(editId ? 'Almacén actualizado correctamente' : 'Almacén registrado correctamente', 'success')
      cancelEdit()
      load()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    }
  }

  /* ── Toggle estado ── */
  const toggleEstado = (id) => {
    api.post(`/almacenes/${id}/toggle_estado/`)
      .then(resp => {
        showToast(resp.data.estado ? 'Almacén reactivado' : 'Almacén desactivado', 'info')
        load()
      })
      .catch(() => showToast('Error al cambiar estado', 'error'))
  }

  /* ── Delete ── */
  const deleteItem = (id, name) => {
    if (!confirm(`¿Eliminar el almacén "${name}"? Esta acción no se puede deshacer.`)) return
    api.delete(`/almacenes/${id}/`)
      .then(() => {
        showToast('Almacén eliminado correctamente', 'success')
        load()
      })
      .catch(() => showToast('Error al eliminar', 'error'))
  }

  /* ── Edit mode ── */
  const startEdit = (item) => {
    setEditId(item.id)
    setNombre(item.nombre || '')
    setUbic(item.ubicacion || '')
    setSucId(item.sucursal || '')
    setResId(item.responsable || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setNombre(''); setUbic(''); setSucId(''); setResId('')
  }

  /* ── Filtrar activos / inactivos ── */
  const filtered = items.filter(a => showInactive ? !a.estado : a.estado)

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Almacenes</h1>
          <p>Gestiona los puntos de almacenamiento de tus productos.</p>
        </div>

        {/* ── Formulario crear / editar ── */}
        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Almacén' : 'Nuevo Almacén'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Nombre *</label>
                <div className={Css.inputWrap}>
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                    placeholder="Nombre del almacén"
                  />
                </div>
              </div>
              <div className={Css.field}>
                <label>Sucursal *</label>
                <div className={Css.inputWrap}>
                  <select value={sucursalId} onChange={e => setSucId(e.target.value)} required>
                    <option value="">Seleccionar sucursal</option>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className={Css.field}>
                <label>Responsable</label>
                <div className={Css.inputWrap}>
                  <select value={responsableId} onChange={e => setResId(e.target.value)}>
                    <option value="">Seleccionar responsable</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>)}
                  </select>
                </div>
              </div>
              <div className={Css.field}>
                <label>Ubicación (Dirección)</label>
                <div className={Css.inputWrap}>
                  <input
                    value={ubicacion}
                    onChange={e => setUbic(e.target.value)}
                    placeholder="Dirección del almacén"
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
                {editId ? 'Actualizar' : 'Guardar Almacén'}
              </button>
            </div>
          </div>
        </form>

        {/* ── Lista ── */}
        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Lista de Almacenes</h2>
              <button
                type="button"
                className={Css.btnReset}
                onClick={() => setShowInactive(!showInactive)}
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
              >
                {showInactive ? 'Ver activos' : 'Ver inactivos'}
              </button>
            </div>

            {/* Buscador */}
            <div className={Css.inputWrap} style={{ marginBottom: '1rem' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar almacén…"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  {showInactive ? 'No hay almacenes inactivos.' : 'No hay almacenes registrados.'}
                </p>
              )}
              {filtered.map(alm => (
                <div
                  key={alm.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px',
                    background: 'var(--surface)', opacity: alm.estado ? 1 : 0.6,
                    gap: '0.75rem', flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {alm.nombre}
                      {!alm.estado && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginLeft: '0.5rem' }}>Inactivo</span>}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Sucursal: {alm.sucursal_nombre} · Responsable: {alm.responsable_nombre || 'No asignado'}
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                      📍 {alm.ubicacion || 'Sin dirección'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    {alm.estado && (
                      <button
                        className={Css.btnSave}
                        onClick={() => startEdit(alm)}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      className={Css.btnReset}
                      onClick={() => toggleEstado(alm.id)}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                    >
                      {alm.estado ? 'Desactivar' : 'Reactivar'}
                    </button>
                    {!alm.estado && (
                      <button
                        className={Css.btnReset}
                        onClick={() => deleteItem(alm.id, alm.nombre)}
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
