import { useEffect, useMemo, useState } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api from '../../services/api'

const INITIAL_FORM = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone: '',
  user_type: 'CUSTOMER',
  status: 'ACTIVE',
  company: '',
  store: '',
  current_company: '',
  current_store: '',
}

export default function Usuarios() {
  const [items, setItems] = useState([])
  const [companies, setCompanies] = useState([])
  const [stores, setStores] = useState([])
  const [filterText, setFilterText] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [usersResp, companiesResp, storesResp] = await Promise.all([
        api.get('/usuarios/'),
        api.get('/tiendas/'),
        api.get('/stores/'),
      ])

      setItems(Array.isArray(usersResp.data) ? usersResp.data : [])
      setCompanies(Array.isArray(companiesResp.data) ? companiesResp.data : [])
      setStores(Array.isArray(storesResp.data) ? storesResp.data : [])
    } catch {
      setItems([])
      showToast('No se pudieron cargar los usuarios.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'company' ? { store: '', current_store: '' } : {}),
    }))
  }

  const companyStores = useMemo(() => {
    if (!form.company) return stores
    return stores.filter((store) => String(store.company) === String(form.company))
  }, [stores, form.company])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.email.trim()) {
      showToast('El correo es obligatorio.', 'error')
      return
    }

    if (!editId && !form.password) {
      showToast('La contraseña es obligatoria para nuevos usuarios.', 'error')
      return
    }

    const payload = {
      email: form.email.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim() || null,
      user_type: form.user_type,
      status: form.status,
      company: form.company ? Number(form.company) : null,
      store: form.store ? Number(form.store) : null,
      current_company: form.current_company ? Number(form.current_company) : (form.company ? Number(form.company) : null),
      current_store: form.current_store ? Number(form.current_store) : (form.store ? Number(form.store) : null),
    }

    if (form.password) {
      payload.password = form.password
    }

    try {
      const endpoint = editId ? `/usuarios/${editId}/` : '/usuarios/'
      const method = editId ? 'patch' : 'post'
      await api[method](endpoint, payload)

      showToast(editId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.', 'success')
      cancelEdit()
      load()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    }
  }

  const updateStatus = async (user, status) => {
    try {
      await api.patch(`/usuarios/${user.id}/`, { status })
      showToast(status === 'ACTIVE' ? 'Usuario reactivado.' : 'Usuario actualizado.', 'success')
      load()
    } catch {
      showToast('Error al actualizar el estado del usuario.', 'error')
    }
  }

  const deletePermanent = async (id, name) => {
    if (!confirm(`¿Eliminar permanentemente a "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`/usuarios/${id}/`)
      showToast('Usuario eliminado del sistema.', 'success')
      load()
    } catch {
      showToast('Error al eliminar el usuario.', 'error')
    }
  }

  const startEdit = (user) => {
    setEditId(user.id)
    setForm({
      email: user.email || '',
      password: '',
      first_name: user.first_name || user.nombres || '',
      last_name: user.last_name || user.apellidos || '',
      phone: user.phone || user.telefono || '',
      user_type: user.user_type || 'CUSTOMER',
      status: user.status || 'ACTIVE',
      company: user.company ? String(user.company) : '',
      store: user.store ? String(user.store) : '',
      current_company: user.current_company ? String(user.current_company) : '',
      current_store: user.current_store ? String(user.current_store) : '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setForm(INITIAL_FORM)
  }

  const companyById = useMemo(
    () => Object.fromEntries(companies.map((company) => [String(company.id), company])),
    [companies],
  )
  const storeById = useMemo(
    () => Object.fromEntries(stores.map((store) => [String(store.id), store])),
    [stores],
  )

  const filtered = useMemo(() => {
    return items.filter((user) => {
      const haystack = `${user.first_name || user.nombres || ''} ${user.last_name || user.apellidos || ''} ${user.email || ''}`.toLowerCase()
      const roleMatch = (user.user_type || '').toLowerCase().includes(filterRole.toLowerCase())
      const textMatch = haystack.includes(filterText.toLowerCase())

      if (filterText && filterRole) return textMatch && roleMatch
      if (filterText) return textMatch
      if (filterRole) return roleMatch
      return true
    })
  }, [items, filterText, filterRole])

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Usuarios</h1>
          <p>Gestiona empleados y usuarios según el modelo actual de autenticación y multiempresa.</p>
        </div>

        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Correo Electrónico *</label>
                <div className={Css.inputWrap}>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="correo@ejemplo.com" />
                </div>
              </div>
              <div className={Css.field}>
                <label>{editId ? 'Nueva Contraseña' : 'Contraseña *'}</label>
                <div className={Css.inputWrap}>
                  <input name="password" type="password" value={form.password} onChange={handleChange} required={!editId} placeholder="••••••••" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Nombres</label>
                <div className={Css.inputWrap}>
                  <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Juan" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Apellidos</label>
                <div className={Css.inputWrap}>
                  <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Pérez López" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Teléfono</label>
                <div className={Css.inputWrap}>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+591 70000000" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Tipo de Usuario</label>
                <div className={Css.inputWrap}>
                  <select name="user_type" value={form.user_type} onChange={handleChange}>
                    <option value="SUPERUSER">SUPERUSER</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="STORE_ADMIN">STORE_ADMIN</option>
                    <option value="DELIVERY">DELIVERY</option>
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
                <label>Tienda</label>
                <div className={Css.inputWrap}>
                  <select name="store" value={form.store} onChange={handleChange}>
                    <option value="">Sin tienda</option>
                    {companyStores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className={Css.actions} style={{ marginTop: '1rem' }}>
              {editId && <button type="button" className={Css.btnReset} onClick={cancelEdit}>Cancelar</button>}
              <button type="submit" className={Css.btnSave}>{editId ? 'Actualizar Usuario' : 'Guardar Usuario'}</button>
            </div>
          </div>
        </form>

        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Usuarios Registrados</h2>
            </div>

            <div className={Css.formGrid} style={{ marginBottom: '1rem' }}>
              <div className={Css.field}>
                <label>Buscar usuario</label>
                <div className={Css.inputWrap}>
                  <input value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Nombre o correo" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Filtrar por rol</label>
                <div className={Css.inputWrap}>
                  <input value={filterRole} onChange={(e) => setFilterRole(e.target.value)} placeholder="STORE_ADMIN, CUSTOMER..." />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!loading && filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  No hay usuarios registrados.
                </p>
              )}
              {filtered.map((user) => {
                const company = companyById[String(user.company)]
                const store = storeById[String(user.store)]
                const fullName = `${user.first_name || user.nombres || ''} ${user.last_name || user.apellidos || ''}`.trim() || user.email

                return (
                  <div
                    key={user.id}
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
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {fullName}
                      </h3>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {user.email}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                        Rol: {user.user_type || '—'} · Estado: {user.status || '—'} · Empresa: {company?.name || '—'} · Tienda: {store?.name || '—'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                      <button className={Css.btnSave} type="button" onClick={() => startEdit(user)} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>
                        Editar
                      </button>
                      {user.status !== 'ACTIVE' ? (
                        <button className={Css.btnReset} type="button" onClick={() => updateStatus(user, 'ACTIVE')} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>
                          Reactivar
                        </button>
                      ) : (
                        <button className={Css.btnReset} type="button" onClick={() => updateStatus(user, 'INACTIVE')} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>
                          Desactivar
                        </button>
                      )}
                      <button className={Css.btnReset} type="button" onClick={() => deletePermanent(user.id, fullName)} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', color: '#EF4444' }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Template>
  )
}
