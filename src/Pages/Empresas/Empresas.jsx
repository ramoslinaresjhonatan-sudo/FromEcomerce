import { useEffect, useMemo, useState } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api, { authService } from '../../services/api'

const INITIAL_FORM = {
  current_subscription_plan: '',
  tax_id: '',
  legal_name: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  primary_currency: 'BOB',
  timezone: 'America/La_Paz',
}

export default function Empresas() {
  const [items, setItems] = useState([])
  const [plans, setPlans] = useState([])
  const [filterName, setFilterName] = useState('')
  const [filterNit, setFilterNit] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [companiesResp, plansResp] = await Promise.all([
        api.get('/tiendas/'),
        api.get('/suscripciones/planes/'),
      ])

      setItems(Array.isArray(companiesResp.data) ? companiesResp.data : [])
      setPlans(Array.isArray(plansResp.data) ? plansResp.data : [])
    } catch {
      setItems([])
      setPlans([])
      showToast('No se pudieron cargar las empresas.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      showToast('El nombre comercial es obligatorio.', 'error')
      return
    }

    if (!form.current_subscription_plan) {
      showToast('Debes seleccionar un plan de suscripción para la empresa.', 'error')
      return
    }

    try {
      const endpoint = editId ? `/tiendas/${editId}/` : '/tiendas/'
      const method = editId ? 'put' : 'post'
      const currentUser = authService.getUser()

      const payload = {
        current_subscription_plan: Number(form.current_subscription_plan),
        plan_suscripcion_actual_id: Number(form.current_subscription_plan),
        tax_id: form.tax_id.trim() || null,
        legal_name: form.legal_name.trim() || null,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        primary_currency: form.primary_currency.trim() || 'BOB',
        timezone: form.timezone.trim() || 'America/La_Paz',
      }

      const { data } = await api[method](endpoint, payload)

      if (!editId && data?.id) {
        const selectedPlan = plans.find((plan) => String(plan.id) === String(form.current_subscription_plan))
        await api.post('/suscripciones/', {
          company: data.id,
          empresa_id: data.id,
          plan: Number(form.current_subscription_plan),
          plan_suscripcion_id: Number(form.current_subscription_plan),
          registered_by: currentUser?.id || null,
          usuario_registro_id: currentUser?.id || null,
          start_date: new Date().toISOString().slice(0, 10),
          fecha_inicio: new Date().toISOString().slice(0, 10),
          status: 'ACTIVE',
          estado: 'ACTIVE',
          amount_paid: Number(selectedPlan?.monthly_price || 0),
          monto_pagado: Number(selectedPlan?.monthly_price || 0),
          auto_renew: false,
          renovacion_automatica: false,
          billing_cycle: 'monthly',
          ciclo_facturacion: 'monthly',
          name: selectedPlan?.name || 'Plan inicial',
          description: `Suscripción inicial para ${form.name.trim()}`,
          price: Number(selectedPlan?.monthly_price || 0),
        })
      }

      showToast(
        editId ? 'Empresa actualizada correctamente.' : 'Empresa registrada correctamente.',
        'success',
      )
      cancelEdit()
      load()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    }
  }

  const deleteItem = async (id, name) => {
    if (!confirm(`¿Eliminar la empresa "${name}"? Esta acción no se puede deshacer.`)) return

    try {
      await api.delete(`/tiendas/${id}/`)
      showToast('Empresa eliminada correctamente.', 'success')
      load()
    } catch {
      showToast('Error al eliminar la empresa.', 'error')
    }
  }

  const startEdit = (item) => {
    setEditId(item.id)
    setForm({
      current_subscription_plan: item.current_subscription_plan ? String(item.current_subscription_plan) : '',
      tax_id: item.tax_id || '',
      legal_name: item.legal_name || '',
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      address: item.address || '',
      primary_currency: item.primary_currency || 'BOB',
      timezone: item.timezone || 'America/La_Paz',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setForm(INITIAL_FORM)
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesName = item.name?.toLowerCase().includes(filterName.toLowerCase())
      const matchesNit = item.tax_id?.toLowerCase().includes(filterNit.toLowerCase())

      if (filterName && filterNit) return matchesName && matchesNit
      if (filterName) return matchesName
      if (filterNit) return matchesNit
      return true
    })
  }, [items, filterName, filterNit])

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Empresas</h1>
          <p>Gestiona el registro de empresas y completa los campos requeridos por el servidor.</p>
        </div>

        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Empresa' : 'Nueva Empresa'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Plan de Suscripción *</label>
                <div className={Css.inputWrap}>
                  <select
                    name="current_subscription_plan"
                    value={form.current_subscription_plan}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar plan</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · Bs. {Number(plan.monthly_price || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={Css.field}>
                <label>NIT</label>
                <div className={Css.inputWrap}>
                  <input
                    name="tax_id"
                    value={form.tax_id}
                    onChange={handleChange}
                    placeholder="Ej: 1234567890"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Razón Social</label>
                <div className={Css.inputWrap}>
                  <input
                    name="legal_name"
                    value={form.legal_name}
                    onChange={handleChange}
                    placeholder="Razón social de la empresa"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Nombre Comercial *</label>
                <div className={Css.inputWrap}>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Nombre de la empresa"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Correo</label>
                <div className={Css.inputWrap}>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="correo@empresa.com"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Teléfono</label>
                <div className={Css.inputWrap}>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+591 70000000"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Moneda Principal</label>
                <div className={Css.inputWrap}>
                  <select
                    name="primary_currency"
                    value={form.primary_currency}
                    onChange={handleChange}
                  >
                    <option value="BOB">BOB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className={Css.field}>
                <label>Zona Horaria</label>
                <div className={Css.inputWrap}>
                  <select
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                  >
                    <option value="America/La_Paz">America/La_Paz</option>
                    <option value="America/Lima">America/Lima</option>
                    <option value="America/Bogota">America/Bogota</option>
                    <option value="America/Santiago">America/Santiago</option>
                  </select>
                </div>
              </div>

              <div className={Css.field} style={{ gridColumn: '1 / -1' }}>
                <label>Dirección</label>
                <div className={Css.inputWrap}>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Dirección fiscal o comercial"
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
                {editId ? 'Actualizar Empresa' : 'Guardar Empresa'}
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
              <h2 style={{ margin: 0 }}>Empresas Creadas</h2>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                {filtered.length} registro{filtered.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className={Css.formGrid} style={{ marginBottom: '1rem' }}>
              <div className={Css.field}>
                <label>Filtrar por nombre</label>
                <div className={Css.inputWrap}>
                  <input
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Nombre comercial"
                  />
                </div>
              </div>

              <div className={Css.field}>
                <label>Filtrar por NIT</label>
                <div className={Css.inputWrap}>
                  <input
                    value={filterNit}
                    onChange={(e) => setFilterNit(e.target.value)}
                    placeholder="NIT o identificador fiscal"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!loading && filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  No hay empresas registradas.
                </p>
              )}

              {filtered.map((company) => (
                <div
                  key={company.id}
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
                      {company.name || 'Sin nombre'}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      NIT: {company.tax_id || '—'} · Razón Social: {company.legal_name || '—'}
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                      {company.phone || '—'} · {company.email || '—'}
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-hint)' }}>
                      Plan: {plans.find((plan) => String(plan.id) === String(company.current_subscription_plan))?.name || '—'} ·
                      {' '}
                      Moneda: {company.primary_currency || 'BOB'} · Zona horaria: {company.timezone || 'America/La_Paz'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={Css.btnSave}
                      onClick={() => startEdit(company)}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={Css.btnReset}
                      onClick={() => deleteItem(company.id, company.name)}
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
