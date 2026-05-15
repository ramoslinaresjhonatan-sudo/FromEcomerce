import { useEffect, useMemo, useState } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api, { authService } from '../../services/api'
import { getCurrentCompanyId, hasReachedLimit, isStoreAdmin } from '../../utils/access'

const INITIAL_FORM = {
  company: '',
  store: '',
  registered_by: '',
  name: '',
  address: '',
  reference: '',
  latitude: '',
  longitude: '',
  allows_dispatch: true,
  allows_pickup: false,
  status: 'ACTIVE',
}

export default function Almacenes() {
  const user = authService.getUser()
  const storeAdminView = isStoreAdmin(user)
  const userId = user?.id ? String(user.id) : ''
  const currentCompanyId = String(getCurrentCompanyId(user) || '')

  const [items, setItems] = useState([])
  const [companies, setCompanies] = useState([])
  const [stores, setStores] = useState([])
  const [users, setUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [filterCompany, setFilterCompany] = useState('')
  const [filterWarehouse, setFilterWarehouse] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadWarehouses = async () => {
    setLoading(true)
    try {
      const resp = await api.get('/almacenes/')
      setItems(Array.isArray(resp.data) ? resp.data : [])
    } catch {
      setItems([])
      showToast('No se pudieron cargar los almacenes.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadExtras = async () => {
    try {
      const [companiesResp, storesResp, usersResp] = await Promise.all([
        api.get('/tiendas/'),
        api.get('/stores/'),
        api.get('/usuarios/'),
      ])
      const plansResp = await api.get('/suscripciones/planes/')

      setCompanies(Array.isArray(companiesResp.data) ? companiesResp.data : [])
      setStores(Array.isArray(storesResp.data) ? storesResp.data : [])
      setUsers(Array.isArray(usersResp.data) ? usersResp.data : [])
      setPlans(Array.isArray(plansResp.data) ? plansResp.data : [])
    } catch {
      showToast('No se pudieron cargar empresas, tiendas o usuarios.', 'error')
    }
  }

  useEffect(() => {
    loadWarehouses()
    loadExtras()
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
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'company' ? { store: '' } : {}),
    }))
  }

  const selectedStores = useMemo(() => {
    const activeCompanyId = storeAdminView ? currentCompanyId : form.company
    if (!activeCompanyId) return stores
    return stores.filter((store) => String(store.company) === String(activeCompanyId))
  }, [stores, form.company, storeAdminView, currentCompanyId])

  const normalizeDecimal = (value) => {
    if (value === '' || value === null) return null
    return Number(value)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const selectedCompanyId = storeAdminView ? currentCompanyId : form.company

    if (!selectedCompanyId || !form.store || !form.name.trim()) {
      showToast('Empresa, tienda y nombre del almacén son obligatorios.', 'error')
      return
    }

    const activeCompany = companies.find((company) => String(company.id) === String(selectedCompanyId))
    const activePlan = plans.find(
      (plan) => String(plan.id) === String(activeCompany?.current_subscription_plan || activeCompany?.plan_suscripcion_actual_id),
    )
    const companyWarehouses = items.filter((item) => String(item.company) === String(selectedCompanyId))

    if (!editId && storeAdminView && hasReachedLimit(companyWarehouses.length, activePlan?.warehouse_limit)) {
      showToast('Tu empresa ya alcanzó el límite de almacenes permitido por su plan actual.', 'error')
      return
    }

    const payload = {
      company: Number(selectedCompanyId),
      store: Number(form.store),
      registered_by: storeAdminView ? (user?.id || null) : (form.registered_by ? Number(form.registered_by) : null),
      name: form.name.trim(),
      address: form.address.trim() || null,
      reference: form.reference.trim() || null,
      latitude: normalizeDecimal(form.latitude),
      longitude: normalizeDecimal(form.longitude),
      allows_dispatch: form.allows_dispatch,
      allows_pickup: form.allows_pickup,
      status: form.status,
    }

    try {
      const endpoint = editId ? `/almacenes/${editId}/` : '/almacenes/'
      const method = editId ? 'put' : 'post'
      await api[method](endpoint, payload)

      showToast(editId ? 'Almacén actualizado correctamente.' : 'Almacén creado correctamente.', 'success')
      cancelEdit()
      loadWarehouses()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    }
  }

  const deleteItem = async (id, name) => {
    if (!confirm(`¿Eliminar el almacén "${name}"? Esta acción no se puede deshacer.`)) return

    try {
      await api.delete(`/almacenes/${id}/`)
      showToast('Almacén eliminado correctamente.', 'success')
      loadWarehouses()
    } catch {
      showToast('Error al eliminar el almacén.', 'error')
    }
  }

  const startEdit = (item) => {
    setEditId(item.id)
    setForm({
      company: item.company ? String(item.company) : (storeAdminView ? currentCompanyId : ''),
      store: item.store ? String(item.store) : '',
      registered_by: item.registered_by ? String(item.registered_by) : (storeAdminView ? userId : ''),
      name: item.name || '',
      address: item.address || '',
      reference: item.reference || '',
      latitude: item.latitude ?? '',
      longitude: item.longitude ?? '',
      allows_dispatch: Boolean(item.allows_dispatch),
      allows_pickup: Boolean(item.allows_pickup),
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

  const storeById = useMemo(
    () => Object.fromEntries(stores.map((store) => [String(store.id), store])),
    [stores],
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
      ? items.filter((warehouse) => String(warehouse.company) === String(scopedCompanyId))
      : items
  ), [items, scopedCompanyId, storeAdminView])

  const filtered = useMemo(() => {
    return scopedItems.filter((warehouse) => {
      const company =
        companyById[String(warehouse.company)] ||
        companyById[String(storeById[String(warehouse.store)]?.company)]

      const companyHaystack = `${company?.name || ''} ${company?.tax_id || ''}`.toLowerCase()
      const warehouseName = (warehouse.name || '').toLowerCase()

      const matchesCompany = companyHaystack.includes(filterCompany.toLowerCase())
      const matchesWarehouse = warehouseName.includes(filterWarehouse.toLowerCase())

      if (filterCompany && filterWarehouse) return matchesCompany && matchesWarehouse
      if (filterCompany) return matchesCompany
      if (filterWarehouse) return matchesWarehouse
      return true
    })
  }, [scopedItems, companyById, storeById, filterCompany, filterWarehouse])

  const companyOptions = storeAdminView
    ? companies.filter((company) => String(company.id) === String(scopedCompanyId))
    : companies

  const userOptions = storeAdminView
    ? users.filter((item) => String(item.id) === String(user?.id))
    : users

  const currentWarehousesCount = scopedItems.length
  const warehouseLimitReached = storeAdminView && hasReachedLimit(currentWarehousesCount, activePlan?.warehouse_limit)

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Almacenes</h1>
          <p>
            {storeAdminView
              ? 'Registra y administra únicamente los almacenes de tu empresa respetando el límite de tu plan.'
              : 'Registra almacenes según los requisitos actuales del servidor y visualiza a qué empresa pertenecen.'}
          </p>
        </div>

        {storeAdminView && (
          <div className={Css.card} style={{ marginBottom: '1rem' }}>
            <div className={Css.section}>
              <h2>Capacidad del Plan</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0.45rem 0 0' }}>
                Empresa: {activeCompany?.name || '—'} · Plan: {activePlan?.name || 'Sin plan'} ·
                {' '}Almacenes usados: {currentWarehousesCount} / {activePlan?.warehouse_limit ?? 'Ilimitados'}
              </p>
            </div>
          </div>
        )}

        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Almacén' : 'Nuevo Almacén'}</h2>
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
                <label>Tienda *</label>
                <div className={Css.inputWrap}>
                  <select name="store" value={form.store} onChange={handleChange} required>
                    <option value="">Seleccionar tienda</option>
                    {selectedStores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
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
                <label>Nombre del Almacén *</label>
                <div className={Css.inputWrap}>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Nombre del almacén"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Dirección</label>
                <div className={Css.inputWrap}>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Dirección del almacén"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Referencia</label>
                <div className={Css.inputWrap}>
                  <input
                    name="reference"
                    value={form.reference}
                    onChange={handleChange}
                    placeholder="Punto de referencia"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Latitud</label>
                <div className={Css.inputWrap}>
                  <input
                    name="latitude"
                    type="number"
                    step="0.0000001"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="-17.7833000"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Longitud</label>
                <div className={Css.inputWrap}>
                  <input
                    name="longitude"
                    type="number"
                    step="0.0000001"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="-63.1821000"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Permite Despacho</label>
                <div className={Css.inputWrap} style={{ justifyContent: 'space-between', padding: '0.72rem 0.8rem' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>Habilitar despachos</span>
                  <input
                    name="allows_dispatch"
                    type="checkbox"
                    checked={form.allows_dispatch}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px' }}
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Permite Recojo</label>
                <div className={Css.inputWrap} style={{ justifyContent: 'space-between', padding: '0.72rem 0.8rem' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>Habilitar recojo</span>
                  <input
                    name="allows_pickup"
                    type="checkbox"
                    checked={form.allows_pickup}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px' }}
                  />
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
            </div>

            <div className={Css.actions} style={{ marginTop: '1rem' }}>
              {editId && (
                <button type="button" className={Css.btnReset} onClick={cancelEdit}>
                  Cancelar
                </button>
              )}
              <button type="submit" className={Css.btnSave} disabled={!editId && warehouseLimitReached}>
                {editId ? 'Actualizar Almacén' : 'Guardar Almacén'}
              </button>
            </div>
          </div>
        </form>

        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ margin: 0 }}>Lista de Almacenes</h2>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                {filtered.length} almacén{filtered.length === 1 ? '' : 'es'}
              </span>
            </div>

            <div className={Css.formGrid} style={{ marginBottom: '1rem' }}>
              <div className={Css.field}>
                <label>Filtrar por empresa o NIT</label>
                <div className={Css.inputWrap}>
                  <input
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    placeholder="Nombre o NIT de empresa"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Filtrar por nombre de almacén</label>
                <div className={Css.inputWrap}>
                  <input
                    value={filterWarehouse}
                    onChange={(e) => setFilterWarehouse(e.target.value)}
                    placeholder="Nombre del almacén"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!loading && filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  No hay almacenes registrados.
                </p>
              )}

              {filtered.map((warehouse) => {
                const store = storeById[String(warehouse.store)]
                const company =
                  companyById[String(warehouse.company)] ||
                  companyById[String(store?.company)]
                const registeredBy = userById[String(warehouse.registered_by)]

                return (
                  <div
                    key={warehouse.id}
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
                        {warehouse.name || 'Sin nombre'}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Empresa: {company?.name || '—'} · NIT: {company?.tax_id || '—'}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                        Tienda: {store?.name || '—'} · Registro: {registeredBy ? `${registeredBy.first_name || registeredBy.nombres || ''} ${registeredBy.last_name || registeredBy.apellidos || ''}`.trim() || registeredBy.email : '—'}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                        Dirección: {warehouse.address || '—'} · Referencia: {warehouse.reference || '—'}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                        Despacho: {warehouse.allows_dispatch ? 'Sí' : 'No'} · Recojo: {warehouse.allows_pickup ? 'Sí' : 'No'} · Estado: {warehouse.status}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={Css.btnSave}
                        onClick={() => startEdit(warehouse)}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={Css.btnReset}
                        onClick={() => deleteItem(warehouse.id, warehouse.name)}
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
