import { useState, useEffect } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api from '../../services/api'

export default function RolesPermisos() {
  const [activeTab, setActiveTab] = useState('roles') // 'roles' or 'permisos'
  
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  /* form */
  const [nombre, setNombre] = useState('')
  const [detalle, setDetalle] = useState('')
  const [editId, setEditId] = useState(null)

  const endpoint = activeTab === 'roles' ? '/roles/' : '/permisos/'

  /* ── Fetch ── */
  const load = () => {
    api.get(endpoint, { params: { q: search } })
      .then(resp => setItems(Array.isArray(resp.data) ? resp.data : []))
      .catch(() => setItems([]))
  }

  useEffect(() => { load() }, [search, activeTab])

  /* ── Create / Update ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      showToast('El nombre/código es obligatorio.', 'error')
      return
    }
    try {
      const url = editId ? `${endpoint}${editId}/` : endpoint
      const method = editId ? 'put' : 'post'
      
      await api[method](url, { nombre, detalle })

      showToast(editId ? 'Actualizado correctamente' : 'Registrado correctamente', 'success')
      cancelEdit()
      load()
    } catch (err) {
      const msg = err.response?.data?.nombre ? 'Ya existe un registro con este código/nombre.' : (err.response?.data ? JSON.stringify(err.response.data) : err.message)
      showToast(msg, 'error')
    }
  }

  /* ── Toggle estado ── */
  const toggleEstado = (id) => {
    api.post(`${endpoint}${id}/toggle_estado/`)
      .then(resp => {
        showToast(resp.data.estado ? 'Reactivado' : 'Desactivado', 'info')
        load()
      })
      .catch(() => showToast('Error al cambiar estado', 'error'))
  }

  /* ── Delete ── */
  const deleteItem = (id, name) => {
    if (!confirm(`¿Eliminar permanentemente "${name}"? Esta acción no se puede deshacer.`)) return
    api.delete(`${endpoint}${id}/`)
      .then(() => {
        showToast('Eliminado correctamente', 'success')
        load()
      })
      .catch(() => showToast('Error al eliminar (puede tener dependencias)', 'error'))
  }

  /* ── Edit mode ── */
  const startEdit = (item) => {
    setEditId(item.id)
    setNombre(item.nombre || '')
    setDetalle(item.detalle || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setNombre(''); setDetalle('')
  }

  /* ── Switch Tab ── */
  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    setSearch('')
    cancelEdit()
  }

  const filtered = items.filter(s => showInactive ? !s.estado : s.estado)
  const itemName = activeTab === 'roles' ? 'Rol' : 'Permiso'

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Roles y Permisos</h1>
          <p>Gestiona los niveles de acceso y seguridad del sistema.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'var(--surface)', padding: '0.5rem', borderRadius: '12px' }}>
          <button 
            className={activeTab === 'roles' ? Css.btnSave : Css.btnReset}
            onClick={() => handleTabSwitch('roles')}
            style={{ flex: 1 }}
          >
            Roles
          </button>
          <button 
            className={activeTab === 'permisos' ? Css.btnSave : Css.btnReset}
            onClick={() => handleTabSwitch('permisos')}
            style={{ flex: 1 }}
          >
            Permisos
          </button>
        </div>

        {/* ── Formulario crear / editar ── */}
        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? `Editar ${itemName}` : `Nuevo ${itemName}`}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Nombre / Código *</label>
                <div className={Css.inputWrap}>
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                    placeholder={`Ej: ${activeTab === 'roles' ? 'ADMIN' : 'VER_USUARIOS'}`}
                  />
                </div>
              </div>
              <div className={Css.field} style={{ gridColumn: 'span 2' }}>
                <label>Detalle / Descripción</label>
                <div className={Css.inputWrap}>
                  <input
                    value={detalle}
                    onChange={e => setDetalle(e.target.value)}
                    placeholder="Descripción breve..."
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
                {editId ? 'Actualizar' : `Guardar ${itemName}`}
              </button>
            </div>
          </div>
        </form>

        {/* ── Lista ── */}
        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Lista de {activeTab === 'roles' ? 'Roles' : 'Permisos'}</h2>
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
                placeholder={`Buscar ${itemName.toLowerCase()}…`}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  {showInactive ? `No hay ${activeTab} inactivos.` : `No hay ${activeTab} registrados.`}
                </p>
              )}
              {filtered.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px',
                    background: 'var(--surface)', opacity: item.estado ? 1 : 0.6,
                    gap: '0.75rem', flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {item.nombre}
                      {!item.estado && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginLeft: '0.5rem' }}>Inactivo</span>}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {item.detalle || 'Sin detalle'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    {item.estado && (
                      <button
                        className={Css.btnSave}
                        onClick={() => startEdit(item)}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      className={Css.btnReset}
                      onClick={() => toggleEstado(item.id)}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                    >
                      {item.estado ? 'Desactivar' : 'Reactivar'}
                    </button>
                    {!item.estado && (
                      <button
                        className={Css.btnReset}
                        onClick={() => deleteItem(item.id, item.nombre)}
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
