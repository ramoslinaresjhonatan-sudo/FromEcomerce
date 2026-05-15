import { useEffect, useMemo, useState } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api, { authService } from '../../services/api'
import { getCurrentCompanyId, hasReachedLimit, isStoreAdmin } from '../../utils/access'

const INITIAL_FORM = {
  company: '',
  registered_by: '',
  name: '',
  slug: '',
  business_type: '',
  description: '',
  contact_email: '',
  phone: '',
  custom_domain: '',
  status: 'ACTIVE',
}

export default function Stores() {
  const user = authService.getUser()
  const storeAdminView = isStoreAdmin(user)
  const userId = user?.id ? String(user.id) : ''
  const currentCompanyId = String(getCurrentCompanyId(user) || '')

  const [items, setItems] = useState([])
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [filterCompany, setFilterCompany] = useState('')
  const [filterStore, setFilterStore] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [storesResp, companiesResp, usersResp] = await Promise.all([
        api.get('/stores/'),
        api.get('/tiendas/'),
        api.get('/usuarios/'),
      ])
      const plansResp = await api.get('/suscripciones/planes/')

      setItems(Array.isArray(storesResp.data) ? storesResp.data : [])
      setCompanies(Array.isArray(companiesResp.data) ? companiesResp.data : [])
      setUsers(Array.isArray(usersResp.data) ? usersResp.data : [])
      setPlans(Array.isArray(plansResp.data) ? plansResp.data : [])
    } catch {
      setItems([])
      showToast('No se pudieron cargar las tiendas.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!storeAdminView || editId) return

    setForm((prev) => {
      const nextCompany = currentCompanyId
      const nextRegisteredBy = userId

      if (prev.company === nextCompany && prev.registered_by === nextRegisteredBy) {
        return prev
      }

      return {
        ...prev,
        company: nextCompany,
        registered_by: nextRegisteredBy,
      }
    })
  }, [storeAdminView, editId, currentCompanyId, userId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const selectedCompanyId = storeAdminView ? currentCompanyId : form.company

    if (!selectedCompanyId || !form.name.trim()) {
      showToast('Empresa y nombre de tienda son obligatorios.', 'error')
      return
    }

    const activeCompany = companies.find((company) => String(company.id) === String(selectedCompanyId))
    const activePlan = plans.find(
      (plan) => String(plan.id) === String(activeCompany?.current_subscription_plan || activeCompany?.plan_suscripcion_actual_id),
    )
    const companyStores = items.filter((item) => String(item.company) === String(selectedCompanyId))

    if (!editId && storeAdminView && hasReachedLimit(companyStores.length, activePlan?.store_limit)) {
      showToast('Tu empresa ya alcanzó el límite de tiendas permitido por su plan actual.', 'error')
      return
    }

    const payload = {
      company: Number(selectedCompanyId),
      registered_by: storeAdminView ? (user?.id || null) : (form.registered_by ? Number(form.registered_by) : null),
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      business_type: form.business_type.trim() || null,
      description: form.description.trim() || null,
      contact_email: form.contact_email.trim() || null,
      phone: form.phone.trim() || null,
      custom_domain: form.custom_domain.trim() || null,
      status: form.status,
    }

    try {
      const endpoint = editId ? `/stores/${editId}/` : '/stores/'
      const method = editId ? 'put' : 'post'
      await api[method](endpoint, payload)

      showToast(editId ? 'Tienda actualizada correctamente.' : 'Tienda creada correctamente.', 'success')
      cancelEdit()
      load()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    }
  }

  const deleteItem = async (id, name) => {
    if (!confirm(`¿Eliminar la tienda "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`/stores/${id}/`)
      showToast('Tienda eliminada correctamente.', 'success')
      load()
    } catch {
      showToast('Error al eliminar la tienda.', 'error')
    }
  }

  const startEdit = (item) => {
    setEditId(item.id)
    setForm({
      company: item.company ? String(item.company) : (storeAdminView ? currentCompanyId : ''),
      registered_by: item.registered_by ? String(item.registered_by) : (storeAdminView ? userId : ''),
      name: item.name || '',
      slug: item.slug || '',
      business_type: item.business_type || '',
      description: item.description || '',
      contact_email: item.contact_email || '',
      phone: item.phone || '',
      custom_domain: item.custom_domain || '',
      status: item.status || 'ACTIVE',
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

  const userById = useMemo(
    () => Object.fromEntries(users.map((user) => [String(user.id), user])),
    [users],
  )

  const scopedCompanyId = storeAdminView ? currentCompanyId : ''
  const activeCompany = companies.find((company) => String(company.id) === String(scopedCompanyId))
  const activePlan = plans.find(
    (plan) => String(plan.id) === String(activeCompany?.current_subscription_plan || activeCompany?.plan_suscripcion_actual_id),
  )
  const scopedItems = useMemo(() => (
    storeAdminView
      ? items.filter((store) => String(store.company) === String(scopedCompanyId))
      : items
  ), [items, scopedCompanyId, storeAdminView])

  const filtered = useMemo(() => {
    return scopedItems.filter((store) => {
      const company = companyById[String(store.company)]
      const companyHaystack = `${company?.name || ''} ${company?.tax_id || ''}`.toLowerCase()
      const storeHaystack = `${store.name || ''} ${store.slug || ''}`.toLowerCase()

      const matchesCompany = companyHaystack.includes(filterCompany.toLowerCase())
      const matchesStore = storeHaystack.includes(filterStore.toLowerCase())

      if (filterCompany && filterStore) return matchesCompany && matchesStore
      if (filterCompany) return matchesCompany
      if (filterStore) return matchesStore
      return true
    })
  }, [scopedItems, companyById, filterCompany, filterStore])

  const companyOptions = storeAdminView
    ? companies.filter((company) => String(company.id) === String(scopedCompanyId))
    : companies

  const userOptions = storeAdminView
    ? users.filter((item) => String(item.id) === userId)
    : users

  const currentStoresCount = scopedItems.length
  const storeLimitReached = storeAdminView && hasReachedLimit(currentStoresCount, activePlan?.store_limit)

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Tiendas</h1>
          <p>
            {storeAdminView
              ? 'Gestiona únicamente las tiendas de tu empresa según el límite permitido por tu plan.'
              : 'Gestiona las tiendas vinculadas a cada empresa según el modelo actual del servidor.'}
          </p>
        </div>

        {storeAdminView && (
          <div className={Css.card} style={{ marginBottom: '1rem' }}>
            <div className={Css.section}>
              <h2>Capacidad del Plan</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0.45rem 0 0' }}>
                Empresa: {activeCompany?.name || '—'} · Plan: {activePlan?.name || 'Sin plan'} ·
                {' '}Tiendas usadas: {currentStoresCount} / {activePlan?.store_limit ?? 'Ilimitadas'}
              </p>
            </div>
          </div>
        )}

        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Tienda' : 'Nueva Tienda'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Empresa *</label>
                <div className={Css.inputWrap}>
                  <select name="company" value={form.company} onChange={handleChange} required>
                    <option value="">Seleccionar empresa</option>
                    {companyOptions.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} {company.tax_id ? `(${company.tax_id})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={Css.field}>
                <label>Usuario de Registro</label>
                <div className={Css.inputWrap}>
                  <select name="registered_by" value={form.registered_by} onChange={handleChange}>
                    <option value="">Sin asignar</option>
                    {userOptions.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {(entry.first_name || entry.nombres || '')} {(entry.last_name || entry.apellidos || '')} ({entry.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={Css.field}>
                <label>Nombre *</label>
                <div className={Css.inputWrap}>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="Nombre de tienda" />
                </div>
              </div>

              <div className={Css.field}>
                <label>Slug</label>
                <div className={Css.inputWrap}>
                  <input name="slug" value={form.slug} onChange={handleChange} placeholder="mi-tienda" />
                </div>
              </div>

              <div className={Css.field}>
                <label>Rubro</label>
                <div className={Css.inputWrap}>
                  <input name="business_type" value={form.business_type} onChange={handleChange} placeholder="Retail, farmacia, moda..." />
                </div>
              </div>

              <div className={Css.field}>
                <label>Teléfono</label>
                <div className={Css.inputWrap}>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+591 70000000" />
                </div>
              </div>

              <div className={Css.field}>
                <label>Correo de Contacto</label>
                <div className={Css.inputWrap}>
                  <input name="contact_email" type="email" value={form.contact_email} onChange={handleChange} placeholder="tienda@empresa.com" />
                </div>
              </div>

              <div className={Css.field}>
                <label>Dominio Personalizado</label>
                <div className={Css.inputWrap}>
                  <input name="custom_domain" value={form.custom_domain} onChange={handleChange} placeholder="tienda.midominio.com" />
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
                  <input name="description" value={form.description} onChange={handleChange} placeholder="Descripción comercial de la tienda" />
                </div>
              </div>
            </div>

            <div className={Css.actions} style={{ marginTop: '1rem' }}>
              {editId && <button type="button" className={Css.btnReset} onClick={cancelEdit}>Cancelar</button>}
              <button type="submit" className={Css.btnSave} disabled={!editId && storeLimitReached}>
                {editId ? 'Actualizar Tienda' : 'Guardar Tienda'}
              </button>
            </div>
          </div>
        </form>

        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Tiendas Registradas</h2>
            </div>

            <div className={Css.formGrid} style={{ marginBottom: '1rem' }}>
              <div className={Css.field}>
                <label>Filtrar por empresa o NIT</label>
                <div className={Css.inputWrap}>
                  <input value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} placeholder="Empresa o NIT" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Filtrar por tienda o slug</label>
                <div className={Css.inputWrap}>
                  <input value={filterStore} onChange={(e) => setFilterStore(e.target.value)} placeholder="Nombre o slug" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!loading && filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  No hay tiendas registradas.
                </p>
              )}
              {filtered.map((store) => {
                const company = companyById[String(store.company)]
                const registeredBy = userById[String(store.registered_by)]

                return (
                  <div
                    key={store.id}
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
                        {store.name || 'Sin nombre'}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Empresa: {company?.name || '—'} · NIT: {company?.tax_id || '—'} · Slug: {store.slug || '—'}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                        Rubro: {store.business_type || '—'} · Correo: {store.contact_email || '—'} · Teléfono: {store.phone || '—'}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                        Dominio: {store.custom_domain || '—'} · Registro: {registeredBy ? `${registeredBy.first_name || registeredBy.nombres || ''} ${registeredBy.last_name || registeredBy.apellidos || ''}`.trim() || registeredBy.email : '—'} · Estado: {store.status}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={Css.btnSave}
                        onClick={() => startEdit(store)}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={Css.btnReset}
                        onClick={() => deleteItem(store.id, store.name)}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', color: '#EF4444' }}
                      >
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
