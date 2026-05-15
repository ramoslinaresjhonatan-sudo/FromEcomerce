import { useEffect, useMemo, useState } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api, { authService } from '../../services/api'
import { getCurrentCompanyId, isPlatformAdmin, isStoreAdmin } from '../../utils/access'

const INITIAL_FORM = {
  name: '',
  description: '',
  monthly_price: '',
  store_limit: '',
  warehouse_limit: '',
  user_limit: '',
  product_limit: '',
  includes_crm: true,
  includes_ai: false,
  support_level: '',
  status: 'ACTIVE',
}

const todayString = () => new Date().toISOString().slice(0, 10)

const addDays = (dateValue, days) => {
  const base = dateValue ? new Date(dateValue) : new Date()
  base.setDate(base.getDate() + days)
  return base.toISOString().slice(0, 10)
}

const buildCompanyPayload = (company, planId) => ({
  current_subscription_plan: planId,
  plan_suscripcion_actual_id: planId,
  tax_id: company?.tax_id || null,
  legal_name: company?.legal_name || null,
  name: company?.name || '',
  email: company?.email || null,
  phone: company?.phone || null,
  address: company?.address || null,
  primary_currency: company?.primary_currency || 'BOB',
  timezone: company?.timezone || 'America/La_Paz',
  status: company?.status || 'ACTIVE',
})

export default function Suscripciones() {
  const user = authService.getUser()
  const isAdminView = isPlatformAdmin(user)
  const isStoreView = isStoreAdmin(user)

  const [items, setItems] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [company, setCompany] = useState(null)
  const [filterName, setFilterName] = useState('')
  const [filterSupport, setFilterSupport] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const plansResp = await api.get('/suscripciones/planes/')
      const plans = Array.isArray(plansResp.data) ? plansResp.data : []
      setItems(plans)

      if (isStoreView) {
        const companyId = getCurrentCompanyId(user)
        const [companiesResp, subscriptionsResp] = await Promise.all([
          api.get('/tiendas/'),
          api.get('/suscripciones/'),
        ])

        const companies = Array.isArray(companiesResp.data) ? companiesResp.data : []
        const subscriptionItems = Array.isArray(subscriptionsResp.data) ? subscriptionsResp.data : []
        setSubscriptions(subscriptionItems)
        setCompany(companies.find((item) => String(item.id) === String(companyId)) || null)
      }
    } catch {
      setItems([])
      showToast('No se pudieron cargar las suscripciones.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const normalizeOptionalNumber = (value) => {
    if (value === '' || value === null) return null
    return Number(value)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim() || !form.monthly_price) {
      showToast('Nombre y precio mensual son obligatorios.', 'error')
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      monthly_price: Number(form.monthly_price),
      store_limit: normalizeOptionalNumber(form.store_limit),
      warehouse_limit: normalizeOptionalNumber(form.warehouse_limit),
      user_limit: normalizeOptionalNumber(form.user_limit),
      product_limit: normalizeOptionalNumber(form.product_limit),
      includes_crm: form.includes_crm,
      includes_ai: form.includes_ai,
      support_level: form.support_level.trim() || null,
      status: form.status,
    }

    try {
      const endpoint = editId ? `/suscripciones/planes/${editId}/` : '/suscripciones/planes/'
      const method = editId ? 'put' : 'post'
      await api[method](endpoint, payload)

      showToast(editId ? 'Plan actualizado correctamente.' : 'Plan creado correctamente.', 'success')
      cancelEdit()
      load()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    }
  }

  const startEdit = (item) => {
    setEditId(item.id)
    setForm({
      name: item.name || '',
      description: item.description || '',
      monthly_price: item.monthly_price ?? '',
      store_limit: item.store_limit ?? '',
      warehouse_limit: item.warehouse_limit ?? '',
      user_limit: item.user_limit ?? '',
      product_limit: item.product_limit ?? '',
      includes_crm: Boolean(item.includes_crm),
      includes_ai: Boolean(item.includes_ai),
      support_level: item.support_level || '',
      status: item.status || 'ACTIVE',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setForm(INITIAL_FORM)
  }

  const deletePlan = async (id, name) => {
    if (!confirm(`¿Eliminar el plan "${name}"? Esta acción no se puede deshacer.`)) return

    try {
      await api.delete(`/suscripciones/planes/${id}/`)
      showToast('Plan eliminado correctamente.', 'success')
      load()
    } catch {
      showToast('Error al eliminar el plan.', 'error')
    }
  }

  const filtered = useMemo(() => {
    return items.filter((plan) => {
      const matchesName = plan.name?.toLowerCase().includes(filterName.toLowerCase())
      const matchesSupport = plan.support_level?.toLowerCase().includes(filterSupport.toLowerCase())

      if (filterName && filterSupport) return matchesName && matchesSupport
      if (filterName) return matchesName
      if (filterSupport) return matchesSupport
      return true
    })
  }, [items, filterName, filterSupport])

  const currentSubscription = useMemo(() => {
    if (!company) return null

    return subscriptions
      .filter((item) => String(item.company) === String(company.id))
      .sort((a, b) => new Date(b.created_at || b.start_date || 0) - new Date(a.created_at || a.start_date || 0))[0] || null
  }, [subscriptions, company])

  const currentPlan = useMemo(() => {
    const planId = company?.current_subscription_plan || company?.plan_suscripcion_actual_id
    return items.find((plan) => String(plan.id) === String(planId)) || null
  }, [items, company])

  const saveCompanyPlan = async (planId) => {
    if (!company) throw new Error('No se encontró la empresa activa del usuario.')
    await api.put(`/tiendas/${company.id}/`, buildCompanyPayload(company, planId))
  }

  const createCompanySubscription = async (plan) => {
    await api.post('/suscripciones/', {
      company: company.id,
      empresa_id: company.id,
      plan: plan.id,
      plan_suscripcion_id: plan.id,
      registered_by: user?.id || null,
      usuario_registro_id: user?.id || null,
      start_date: todayString(),
      fecha_inicio: todayString(),
      end_date: addDays(todayString(), 30),
      fecha_fin: addDays(todayString(), 30),
      status: 'ACTIVE',
      estado: 'ACTIVE',
      amount_paid: Number(plan.monthly_price || 0),
      monto_pagado: Number(plan.monthly_price || 0),
      auto_renew: false,
      renovacion_automatica: false,
      billing_cycle: 'monthly',
      ciclo_facturacion: 'monthly',
      name: plan.name,
      description: `Cambio de plan a ${plan.name}`,
      price: Number(plan.monthly_price || 0),
    })
  }

  const extendCurrentPlan = async () => {
    if (!company || !currentPlan) {
      showToast('No se encontró una suscripción activa para extender.', 'error')
      return
    }

    setActionLoading('extend')
    try {
      if (currentSubscription?.id) {
        await api.patch(`/suscripciones/${currentSubscription.id}/`, {
          end_date: addDays(currentSubscription.end_date || todayString(), 30),
          fecha_fin: addDays(currentSubscription.end_date || todayString(), 30),
          amount_paid: Number(currentPlan.monthly_price || 0),
          monto_pagado: Number(currentPlan.monthly_price || 0),
          status: 'ACTIVE',
          estado: 'ACTIVE',
        })
      } else {
        await createCompanySubscription(currentPlan)
      }

      showToast('La suscripción actual fue extendida por un nuevo ciclo.', 'success')
      load()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    } finally {
      setActionLoading('')
    }
  }

  const changePlan = async (plan) => {
    if (!company) {
      showToast('No se encontró la empresa activa para cambiar de plan.', 'error')
      return
    }

    setActionLoading(`plan-${plan.id}`)
    try {
      await saveCompanyPlan(plan.id)
      await createCompanySubscription(plan)
      showToast(`La empresa cambió al plan ${plan.name}.`, 'success')
      load()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    } finally {
      setActionLoading('')
    }
  }

  if (isStoreView) {
    return (
      <Template>
        <div className={Css.page}>
          <div className={Css.header}>
            <h1>Suscripciones</h1>
            <p>Consulta la suscripción actual de tu empresa y evalúa si deseas extenderla o cambiar de plan.</p>
          </div>

          <div className={Css.card}>
            <div className={Css.section}>
              <h2>Suscripción Actual</h2>
              <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
                <div className={Css.field}>
                  <label>Empresa</label>
                  <div className={Css.inputWrap}>
                    <input value={company?.name || 'Sin empresa asignada'} readOnly />
                  </div>
                </div>

                <div className={Css.field}>
                  <label>Plan actual</label>
                  <div className={Css.inputWrap}>
                    <input value={currentPlan?.name || 'Sin plan activo'} readOnly />
                  </div>
                </div>

                <div className={Css.field}>
                  <label>Precio mensual</label>
                  <div className={Css.inputWrap}>
                    <input value={currentPlan ? `Bs. ${Number(currentPlan.monthly_price || 0).toFixed(2)}` : '—'} readOnly />
                  </div>
                </div>

                <div className={Css.field}>
                  <label>Fecha fin</label>
                  <div className={Css.inputWrap}>
                    <input value={currentSubscription?.end_date || 'Sin fecha fin'} readOnly />
                  </div>
                </div>

                <div className={Css.field}>
                  <label>Límite de Tiendas</label>
                  <div className={Css.inputWrap}>
                    <input value={currentPlan?.store_limit ?? 'Ilimitado'} readOnly />
                  </div>
                </div>

                <div className={Css.field}>
                  <label>Límite de Almacenes</label>
                  <div className={Css.inputWrap}>
                    <input value={currentPlan?.warehouse_limit ?? 'Ilimitado'} readOnly />
                  </div>
                </div>
              </div>

              <div className={Css.actions} style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  className={Css.btnSave}
                  onClick={extendCurrentPlan}
                  disabled={actionLoading === 'extend' || loading}
                >
                  {actionLoading === 'extend' ? 'Extendiendo...' : 'Extender Suscripción'}
                </button>
              </div>
            </div>
          </div>

          <div className={Css.card} style={{ marginTop: '1.5rem' }}>
            <div className={Css.section}>
              <div className={Css.sectionHeader}>
                <h2>Planes Disponibles</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {!loading && filtered.length === 0 && (
                  <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                    No hay planes disponibles en este momento.
                  </p>
                )}

                {filtered.map((plan) => {
                  const isCurrent = String(plan.id) === String(currentPlan?.id)
                  return (
                    <div
                      key={plan.id}
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
                      <div style={{ flex: 1, minWidth: '230px' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {plan.name}
                          <span
                            style={{
                              marginLeft: '0.75rem',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: 'var(--app-primary)',
                            }}
                          >
                            Bs. {Number(plan.monthly_price || 0).toFixed(2)}
                          </span>
                        </h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {plan.description || 'Sin descripción'}
                        </p>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                          Tiendas: {plan.store_limit ?? 'Ilimitado'} · Almacenes: {plan.warehouse_limit ?? 'Ilimitado'} ·
                          {' '}Usuarios: {plan.user_limit ?? 'Ilimitado'} · Productos: {plan.product_limit ?? 'Ilimitado'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                        {isCurrent ? (
                          <button type="button" className={Css.btnReset} disabled>
                            Plan actual
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={Css.btnSave}
                            onClick={() => changePlan(plan)}
                            disabled={Boolean(actionLoading)}
                          >
                            {actionLoading === `plan-${plan.id}` ? 'Actualizando...' : 'Cambiar a este plan'}
                          </button>
                        )}
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

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Suscripciones</h1>
          <p>Administra los planes de suscripción según el modelo actual del servidor.</p>
        </div>

        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Plan' : 'Nuevo Plan de Suscripción'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Nombre *</label>
                <div className={Css.inputWrap}>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Plan Básico"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Precio Mensual *</label>
                <div className={Css.inputWrap}>
                  <input
                    name="monthly_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.monthly_price}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className={Css.field} style={{ gridColumn: '1 / -1' }}>
                <label>Descripción</label>
                <div className={Css.inputWrap}>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Descripción del plan"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Límite de Tiendas</label>
                <div className={Css.inputWrap}>
                  <input
                    name="store_limit"
                    type="number"
                    min="0"
                    value={form.store_limit}
                    onChange={handleChange}
                    placeholder="Ej: 3"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Límite de Almacenes</label>
                <div className={Css.inputWrap}>
                  <input
                    name="warehouse_limit"
                    type="number"
                    min="0"
                    value={form.warehouse_limit}
                    onChange={handleChange}
                    placeholder="Ej: 5"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Límite de Usuarios</label>
                <div className={Css.inputWrap}>
                  <input
                    name="user_limit"
                    type="number"
                    min="0"
                    value={form.user_limit}
                    onChange={handleChange}
                    placeholder="Ej: 10"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Límite de Productos</label>
                <div className={Css.inputWrap}>
                  <input
                    name="product_limit"
                    type="number"
                    min="0"
                    value={form.product_limit}
                    onChange={handleChange}
                    placeholder="Ej: 500"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Soporte</label>
                <div className={Css.inputWrap}>
                  <input
                    name="support_level"
                    value={form.support_level}
                    onChange={handleChange}
                    placeholder="standard, priority, premium"
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

              <div className={Css.field}>
                <label style={{ marginBottom: '0.35rem' }}>Incluye CRM</label>
                <div className={Css.inputWrap} style={{ justifyContent: 'space-between', padding: '0.72rem 0.8rem' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>Habilitar CRM en el plan</span>
                  <input
                    name="includes_crm"
                    type="checkbox"
                    checked={form.includes_crm}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px' }}
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label style={{ marginBottom: '0.35rem' }}>Incluye IA</label>
                <div className={Css.inputWrap} style={{ justifyContent: 'space-between', padding: '0.72rem 0.8rem' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>Habilitar IA en el plan</span>
                  <input
                    name="includes_ai"
                    type="checkbox"
                    checked={form.includes_ai}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px' }}
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
                {editId ? 'Actualizar Plan' : 'Guardar Plan'}
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
              <h2 style={{ margin: 0 }}>Planes Registrados</h2>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                {filtered.length} plan{filtered.length === 1 ? '' : 'es'}
              </span>
            </div>

            <div className={Css.formGrid} style={{ marginBottom: '1rem' }}>
              <div className={Css.field}>
                <label>Filtrar por nombre</label>
                <div className={Css.inputWrap}>
                  <input
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Nombre del plan"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Filtrar por soporte</label>
                <div className={Css.inputWrap}>
                  <input
                    value={filterSupport}
                    onChange={(e) => setFilterSupport(e.target.value)}
                    placeholder="Nivel de soporte"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!loading && filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  No hay planes de suscripción registrados.
                </p>
              )}

              {filtered.map((plan) => (
                <div
                  key={plan.id}
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
                  <div style={{ flex: 1, minWidth: '230px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {plan.name}
                      <span
                        style={{
                          marginLeft: '0.75rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--app-primary)',
                        }}
                      >
                        Bs. {Number(plan.monthly_price || 0).toFixed(2)}
                      </span>
                    </h3>

                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {plan.description || 'Sin descripción'}
                    </p>

                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                      Tiendas: {plan.store_limit ?? '—'} · Almacenes: {plan.warehouse_limit ?? '—'} · Usuarios: {plan.user_limit ?? '—'} · Productos: {plan.product_limit ?? '—'}
                    </p>

                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                      CRM: {plan.includes_crm ? 'Sí' : 'No'} · IA: {plan.includes_ai ? 'Sí' : 'No'} · Soporte: {plan.support_level || '—'} · Estado: {plan.status}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={Css.btnSave}
                      onClick={() => startEdit(plan)}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={Css.btnReset}
                      onClick={() => deletePlan(plan.id, plan.name)}
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
