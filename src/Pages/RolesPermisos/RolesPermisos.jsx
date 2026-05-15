import { useEffect, useMemo, useState } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api from '../../services/api'

const ROLE_FORM = {
  company: '',
  code: '',
  name: '',
  description: '',
  role_type: 'COMPANY',
  is_system: false,
  status: 'ACTIVE',
}

const PERMISSION_FORM = {
  code: '',
  module: '',
  action: '',
  description: '',
  status: 'ACTIVE',
}

export default function RolesPermisos() {
  const [activeTab, setActiveTab] = useState('roles')
  const [items, setItems] = useState([])
  const [companies, setCompanies] = useState([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(ROLE_FORM)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  const endpoint = activeTab === 'roles' ? '/roles/' : '/roles/permissions/'

  const load = async () => {
    setLoading(true)
    try {
      const requests = [api.get(endpoint)]
      if (activeTab === 'roles') {
        requests.push(api.get('/tiendas/'))
      }

      const [itemsResp, companiesResp] = await Promise.all(requests)
      setItems(Array.isArray(itemsResp.data) ? itemsResp.data : [])
      if (companiesResp) {
        setCompanies(Array.isArray(companiesResp.data) ? companiesResp.data : [])
      }
    } catch {
      setItems([])
      showToast('No se pudieron cargar los registros.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [activeTab])

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    setSearch('')
    setEditId(null)
    setForm(tab === 'roles' ? ROLE_FORM : PERMISSION_FORM)
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload =
      activeTab === 'roles'
        ? {
            company: form.company ? Number(form.company) : null,
            code: form.code.trim() || null,
            name: form.name.trim(),
            description: form.description.trim() || null,
            role_type: form.role_type,
            is_system: form.is_system,
            status: form.status,
          }
        : {
            code: form.code.trim(),
            module: form.module.trim(),
            action: form.action.trim(),
            description: form.description.trim() || null,
            status: form.status,
          }

    if (!payload.code || !(payload.name || payload.module)) {
      showToast('Completa los campos obligatorios.', 'error')
      return
    }

    try {
      const url = editId ? `${endpoint}${editId}/` : endpoint
      const method = editId ? 'put' : 'post'
      await api[method](url, payload)

      showToast(editId ? 'Actualizado correctamente.' : 'Registrado correctamente.', 'success')
      setEditId(null)
      setForm(activeTab === 'roles' ? ROLE_FORM : PERMISSION_FORM)
      load()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    }
  }

  const startEdit = (item) => {
    setEditId(item.id)
    if (activeTab === 'roles') {
      setForm({
        company: item.company ? String(item.company) : '',
        code: item.code || item.codigo || '',
        name: item.name || item.nombre || '',
        description: item.description || '',
        role_type: item.role_type || item.tipo || 'COMPANY',
        is_system: Boolean(item.is_system),
        status: item.status || item.estado || 'ACTIVE',
      })
    } else {
      setForm({
        code: item.code || item.codigo || '',
        module: item.module || item.modulo || '',
        action: item.action || item.accion || '',
        description: item.description || '',
        status: item.status || item.estado || 'ACTIVE',
      })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setForm(activeTab === 'roles' ? ROLE_FORM : PERMISSION_FORM)
  }

  const deleteItem = async (id, name) => {
    if (!confirm(`¿Eliminar permanentemente "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`${endpoint}${id}/`)
      showToast('Eliminado correctamente.', 'success')
      load()
    } catch {
      showToast('Error al eliminar el registro.', 'error')
    }
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const haystack =
        activeTab === 'roles'
          ? `${item.code || ''} ${item.name || ''} ${item.description || ''} ${item.role_type || ''}`.toLowerCase()
          : `${item.code || ''} ${item.module || ''} ${item.action || ''} ${item.description || ''}`.toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
  }, [items, search, activeTab])

  const itemName = activeTab === 'roles' ? 'Rol' : 'Permiso'
  const companyById = Object.fromEntries(companies.map((company) => [String(company.id), company]))

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Roles y Permisos</h1>
          <p>Gestiona los roles empresariales y los permisos del sistema con el contrato actual del backend.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'var(--surface)', padding: '0.5rem', borderRadius: '12px' }}>
          <button className={activeTab === 'roles' ? Css.btnSave : Css.btnReset} onClick={() => handleTabSwitch('roles')} style={{ flex: 1 }}>
            Roles
          </button>
          <button className={activeTab === 'permisos' ? Css.btnSave : Css.btnReset} onClick={() => handleTabSwitch('permisos')} style={{ flex: 1 }}>
            Permisos
          </button>
        </div>

        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? `Editar ${itemName}` : `Nuevo ${itemName}`}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              {activeTab === 'roles' ? (
                <>
                  <div className={Css.field}>
                    <label>Empresa</label>
                    <div className={Css.inputWrap}>
                      <select name="company" value={form.company} onChange={handleChange}>
                        <option value="">Sin empresa</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={Css.field}>
                    <label>Código *</label>
                    <div className={Css.inputWrap}>
                      <input name="code" value={form.code} onChange={handleChange} required placeholder="STORE_ADMIN_SCZ" />
                    </div>
                  </div>
                  <div className={Css.field}>
                    <label>Nombre *</label>
                    <div className={Css.inputWrap}>
                      <input name="name" value={form.name} onChange={handleChange} required placeholder="Store Admin" />
                    </div>
                  </div>
                  <div className={Css.field}>
                    <label>Tipo</label>
                    <div className={Css.inputWrap}>
                      <select name="role_type" value={form.role_type} onChange={handleChange}>
                        <option value="PLATFORM">PLATFORM</option>
                        <option value="COMPANY">COMPANY</option>
                        <option value="STORE">STORE</option>
                        <option value="CUSTOMER">CUSTOMER</option>
                      </select>
                    </div>
                  </div>
                  <div className={Css.field}>
                    <label>Estado</label>
                    <div className={Css.inputWrap}>
                      <select name="status" value={form.status} onChange={handleChange}>
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                        <option value="DELETED">Eliminado</option>
                      </select>
                    </div>
                  </div>
                  <div className={Css.field}>
                    <label>Es Sistema</label>
                    <div className={Css.inputWrap} style={{ justifyContent: 'space-between', padding: '0.72rem 0.8rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>Rol del sistema</span>
                      <input name="is_system" type="checkbox" checked={form.is_system} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                    </div>
                  </div>
                  <div className={Css.field} style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción</label>
                    <div className={Css.inputWrap}>
                      <input name="description" value={form.description} onChange={handleChange} placeholder="Descripción del rol" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={Css.field}>
                    <label>Código *</label>
                    <div className={Css.inputWrap}>
                      <input name="code" value={form.code} onChange={handleChange} required placeholder="INVENTORY_VIEW" />
                    </div>
                  </div>
                  <div className={Css.field}>
                    <label>Módulo *</label>
                    <div className={Css.inputWrap}>
                      <input name="module" value={form.module} onChange={handleChange} required placeholder="inventory" />
                    </div>
                  </div>
                  <div className={Css.field}>
                    <label>Acción *</label>
                    <div className={Css.inputWrap}>
                      <input name="action" value={form.action} onChange={handleChange} required placeholder="view" />
                    </div>
                  </div>
                  <div className={Css.field}>
                    <label>Estado</label>
                    <div className={Css.inputWrap}>
                      <select name="status" value={form.status} onChange={handleChange}>
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                        <option value="DELETED">Eliminado</option>
                      </select>
                    </div>
                  </div>
                  <div className={Css.field} style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción</label>
                    <div className={Css.inputWrap}>
                      <input name="description" value={form.description} onChange={handleChange} placeholder="Descripción del permiso" />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className={Css.actions} style={{ marginTop: '1rem' }}>
              {editId && <button type="button" className={Css.btnReset} onClick={cancelEdit}>Cancelar</button>}
              <button type="submit" className={Css.btnSave}>{editId ? 'Actualizar' : `Guardar ${itemName}`}</button>
            </div>
          </div>
        </form>

        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Lista de {activeTab === 'roles' ? 'Roles' : 'Permisos'}</h2>
            </div>

            <div className={Css.inputWrap} style={{ marginBottom: '1rem' }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Buscar ${itemName.toLowerCase()}...`} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!loading && filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  No hay {activeTab} registrados.
                </p>
              )}
              {filtered.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    background: 'var(--surface)',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {activeTab === 'roles' ? (item.name || item.nombre) : (item.code || item.codigo)}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {activeTab === 'roles'
                        ? `Código: ${item.code || '—'} · Empresa: ${companyById[String(item.company)]?.name || '—'} · Tipo: ${item.role_type || '—'}`
                        : `Módulo: ${item.module || '—'} · Acción: ${item.action || '—'} · Estado: ${item.status || '—'}`}
                    </p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                      {item.description || 'Sin descripción'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    <button className={Css.btnSave} type="button" onClick={() => startEdit(item)} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>
                      Editar
                    </button>
                    <button className={Css.btnReset} type="button" onClick={() => deleteItem(item.id, activeTab === 'roles' ? (item.name || item.nombre) : (item.code || item.codigo))} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', color: '#EF4444' }}>
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
