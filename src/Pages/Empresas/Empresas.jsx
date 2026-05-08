import { useState, useEffect } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api from '../../services/api'

export default function Empresas() {
  const [items, setItems]       = useState([])
  const [search, setSearch]     = useState('')
  const [nombre, setNombre]     = useState('')
  const [nit, setNit]           = useState('')
  const [razonSocial, setRazon] = useState('')
  const [correo, setCorreo]     = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDir]     = useState('')
  const [editId, setEditId]     = useState(null)

  /* ── Fetch ── */
  const load = () => {
    api.get('/tiendas/', { params: { q: search } })
      .then(resp => setItems(Array.isArray(resp.data) ? resp.data : []))
      .catch(() => setItems([]))
  }

  useEffect(() => { load() }, [search])

  /* ── Create / Update ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !nit.trim() || !correo.trim() || !telefono.trim()) {
      showToast('Los campos NIT, Nombre, Correo y Teléfono son obligatorios.', 'error')
      return
    }
    try {
      const endpoint = editId ? `/tiendas/${editId}/` : '/tiendas/'
      const method = editId ? 'put' : 'post'
      
      await api[method](endpoint, {
        nombre,
        nit,
        nro_corporativo: razonSocial,
        correo,
        telefono,
        direccion
      })

      showToast(editId ? 'Empresa actualizada correctamente' : 'Empresa registrada correctamente', 'success')
      cancelEdit()
      load()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    }
  }

  /* ── Delete ── */
  const deleteItem = (id, name) => {
    if (!confirm(`¿Eliminar la empresa "${name}"? Esta acción no se puede deshacer.`)) return
    api.delete(`/tiendas/${id}/`)
      .then(() => {
        showToast('Empresa eliminada correctamente', 'success')
        load()
      })
      .catch(() => showToast('Error al eliminar', 'error'))
  }

  /* ── Edit mode ── */
  const startEdit = (item) => {
    setEditId(item.id)
    setNombre(item.nombre || '')
    setNit(item.nit || '')
    setRazon(item.nro_corporativo || '')
    setCorreo(item.correo || '')
    setTelefono(item.telefono || '')
    setDir(item.direccion || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setNombre(''); setNit(''); setRazon(''); setCorreo(''); setTelefono(''); setDir('')
  }

  /* ── Filtrar por búsqueda local ── */
  const filtered = items.filter(e =>
    e.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    e.nit?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Empresas</h1>
          <p>Gestiona los datos de las empresas del sistema.</p>
        </div>

        {/* ── Formulario crear / editar ── */}
        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Empresa' : 'Nueva Empresa'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>NIT *</label>
                <div className={Css.inputWrap}>
                  <input
                    value={nit}
                    onChange={e => setNit(e.target.value)}
                    required
                    placeholder="Ej: 1234567890"
                  />
                </div>
              </div>
              <div className={Css.field}>
                <label>Razón Social</label>
                <div className={Css.inputWrap}>
                  <input
                    value={razonSocial}
                    onChange={e => setRazon(e.target.value)}
                    placeholder="Razón social de la empresa"
                  />
                </div>
              </div>
              <div className={Css.field}>
                <label>Nombre *</label>
                <div className={Css.inputWrap}>
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                    placeholder="Nombre de la empresa"
                  />
                </div>
              </div>
              <div className={Css.field}>
                <label>Correo *</label>
                <div className={Css.inputWrap}>
                  <input
                    type="email"
                    value={correo}
                    onChange={e => setCorreo(e.target.value)}
                    required
                    placeholder="correo@empresa.com"
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
              <div className={Css.field}>
                <label>Dirección</label>
                <div className={Css.inputWrap}>
                  <input
                    value={direccion}
                    onChange={e => setDir(e.target.value)}
                    placeholder="Dirección de la empresa"
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
                {editId ? 'Actualizar' : 'Guardar Empresa'}
              </button>
            </div>
          </div>
        </form>

        {/* ── Lista ── */}
        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <h2>Lista de Empresas</h2>

            {/* Buscador */}
            <div className={Css.inputWrap} style={{ marginBottom: '1rem' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o NIT…"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  No hay empresas registradas.
                </p>
              )}
              {filtered.map(emp => (
                <div
                  key={emp.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px',
                    background: 'var(--surface)', gap: '0.75rem', flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {emp.nombre}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      NIT: {emp.nit || '—'} · Razón Social: {emp.nro_corporativo || '—'}
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                      📞 {emp.telefono || '—'} · ✉️ {emp.correo || '—'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    <button
                      className={Css.btnSave}
                      onClick={() => startEdit(emp)}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                    >
                      Editar
                    </button>
                    <button
                      className={Css.btnReset}
                      onClick={() => deleteItem(emp.id, emp.nombre)}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', color: '#EF4444' }}
                    >
                      Eliminar
                    </button>
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
