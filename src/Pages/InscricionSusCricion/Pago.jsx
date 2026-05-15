import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, User, Mail, Phone, MapPin, Globe, FastForward, LockKeyhole } from 'lucide-react'
import Css from './Pago.module.css'
import api, { authService } from '../../services/api'
import { showToast } from '../../Componentes/Toast/ToastProvider'

const INITIAL_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  company_name: '',
  legal_name: '',
  tax_id: '',
  address: '',
  city: '',
  country: '',
  postal_code: '',
  card_number: '',
  expiration: '',
  cvv: '',
}

const normalizePlan = (locationPlan) => {
  if (locationPlan && typeof locationPlan === 'object') {
    return locationPlan
  }

  const stored = sessionStorage.getItem('selected_plan')
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

const buildUsernameFromEmail = (email) =>
  String(email || '')
    .trim()
    .toLowerCase()
    .split('@')[0]
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_') || 'usuario'

const Pago = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  const selectedPlan = useMemo(
    () => normalizePlan(location.state?.plan),
    [location.state],
  )

  useEffect(() => {
    if (!selectedPlan) {
      navigate('/formulario-planes', { replace: true })
    }
  }, [selectedPlan, navigate])

  const price = Number(selectedPlan?.monthly_price || 0).toFixed(2)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedPlan) return

    setSubmitting(true)

    try {
      const normalizedEmail = form.email.trim().toLowerCase()
      const generatedUsername = buildUsernameFromEmail(normalizedEmail)
      const normalizedTaxId = form.tax_id.trim()
      const companiesResp = await api.get('/tiendas/')
      const companies = Array.isArray(companiesResp.data) ? companiesResp.data : []
      const existingCompany = companies.find(
        (item) => String(item.tax_id || '').trim().toLowerCase() === normalizedTaxId.toLowerCase(),
      )

      if (existingCompany) {
        throw new Error(`El NIT ${normalizedTaxId} ya está registrado en otra empresa. Usa un NIT diferente o inicia sesión si esa empresa ya te pertenece.`)
      }

      const signupResp = await api.post('/usuarios/signup-company/', {
        plan_id: selectedPlan.id,
        company_name: form.company_name.trim(),
        legal_name: form.legal_name.trim() || '',
        tax_id: normalizedTaxId,
        company_email: normalizedEmail,
        phone: form.phone.trim() || '',
        address: `${form.address.trim()} - ${form.city.trim()} - ${form.country.trim()} (${form.postal_code.trim()})`,
        primary_currency: 'BOB',
        timezone: 'America/La_Paz',
        username: generatedUsername,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: normalizedEmail,
        password: form.password,
      })

      if (signupResp.data?.access) {
        localStorage.setItem('access_token', signupResp.data.access)
      }
      if (signupResp.data?.refresh) {
        localStorage.setItem('refresh_token', signupResp.data.refresh)
      }
      if (signupResp.data?.user) {
        localStorage.setItem('user', JSON.stringify(signupResp.data.user))
      } else {
        await authService.login(normalizedEmail, form.password)
      }

      sessionStorage.removeItem('selected_plan')
      navigate('/inicio', { replace: true })
    } catch (err) {
      const message =
        err.message ||
        err.response?.data?.detail ||
        (err.response?.data?.tax_id?.[0]
          ? `El NIT ${form.tax_id.trim()} ya está registrado en otra empresa.`
          : err.response?.data
            ? JSON.stringify(err.response.data)
            : 'No se pudo completar el alta de la empresa y el usuario.')
      showToast(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!selectedPlan) {
    return null
  }

  return (
    <div className={Css.page}>
      <div className={Css.container}>
        <div className={Css.summaryPanel}>
          <div className={Css.summaryHeader}>
            <button onClick={() => navigate(-1)} className={Css.backBtn}>
              <ArrowLeft size={16} /> Volver
            </button>
            <h2>Resumen</h2>
            <p>Detalles de tu nueva suscripción</p>
          </div>

          <div className={Css.planCard}>
            <span className={Css.planText}>Plan suscrito</span>
            <span className={Css.planName}>{selectedPlan.name}</span>
            <div className={Css.planLine}></div>
            <p className={Css.planDesc}>
              Facturación mensual recurrente para la plataforma con los límites del plan elegido.
            </p>
          </div>

          <div className={Css.totalRow}>
            <span className={Css.totalLabel}>Total a pagar</span>
            <span className={Css.totalAmount}>Bs. {price}</span>
          </div>

          <div className={Css.trustBadge}>
            <ShieldCheck size={18} color="var(--orange)" />
            <span>Conexión cifrada de extremo a extremo</span>
          </div>
        </div>

        <div className={Css.formPanel}>
          <form onSubmit={handleSubmit} className={Css.formGrid}>
            <h3 className={Css.fullWidth}>Información Personal</h3>

            <div className={Css.inputGroup}>
              <label><User size={12} /> Nombre</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} type="text" placeholder="Ej: Juan" required />
            </div>

            <div className={Css.inputGroup}>
              <label>Apellido</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} type="text" placeholder="Ej: Pérez" required />
            </div>

            <div className={`${Css.inputGroup} ${Css.fullWidth}`}>
              <label><Mail size={12} /> Correo Electrónico</label>
              <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="juan@correo.com" required />
            </div>

            <div className={Css.inputGroup}>
              <label><Phone size={12} /> Teléfono</label>
              <input name="phone" value={form.phone} onChange={handleChange} type="text" placeholder="70000000" required pattern="[0-9 ]+" />
            </div>

            <div className={Css.inputGroup}>
              <label><LockKeyhole size={12} /> Contraseña</label>
              <input name="password" value={form.password} onChange={handleChange} type="password" placeholder="Mínimo 8 caracteres" required minLength="8" />
            </div>

            <h3 className={`${Css.fullWidth} ${Css.spacingTop}`}>Datos de la Empresa</h3>

            <div className={`${Css.inputGroup} ${Css.fullWidth}`}>
              <label>Nombre Comercial</label>
              <input name="company_name" value={form.company_name} onChange={handleChange} type="text" placeholder="Mi empresa" required />
            </div>

            <div className={`${Css.inputGroup} ${Css.fullWidth}`}>
              <label>Razón Social</label>
              <input name="legal_name" value={form.legal_name} onChange={handleChange} type="text" placeholder="Mi empresa SRL" required />
            </div>

            <div className={Css.inputGroup}>
              <label><MapPin size={12} /> NIT</label>
              <input name="tax_id" value={form.tax_id} onChange={handleChange} type="text" placeholder="123456789" required />
            </div>

            <div className={Css.inputGroup}>
              <label><MapPin size={12} /> Código Postal</label>
              <input name="postal_code" value={form.postal_code} onChange={handleChange} type="text" placeholder="15001" required pattern="[0-9]+" />
            </div>

            <div className={`${Css.inputGroup} ${Css.fullWidth}`}>
              <label>Dirección</label>
              <input name="address" value={form.address} onChange={handleChange} type="text" placeholder="Av. Siempreviva 123" required />
            </div>

            <div className={Css.inputGroup}>
              <label><Globe size={12} /> Ciudad</label>
              <input name="city" value={form.city} onChange={handleChange} type="text" placeholder="La Paz" required />
            </div>

            <div className={Css.inputGroup}>
              <label>País</label>
              <input name="country" value={form.country} onChange={handleChange} type="text" placeholder="Bolivia" required />
            </div>

            <h3 className={`${Css.fullWidth} ${Css.spacingTop}`}>Detalles de Pago</h3>

            <div className={`${Css.inputGroup} ${Css.fullWidth}`}>
              <label><CreditCard size={12} /> Número de Tarjeta</label>
              <div className={Css.cardInputWrapper}>
                <input
                  name="card_number"
                  value={form.card_number}
                  onChange={handleChange}
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  required
                  pattern="[0-9 ]{12,19}"
                />
              </div>
            </div>

            <div className={Css.inputGroup}>
              <label>Vencimiento</label>
              <input
                name="expiration"
                value={form.expiration}
                onChange={handleChange}
                type="text"
                placeholder="MMYY"
                required
                pattern="[0-9]{4}"
              />
            </div>

            <div className={Css.inputGroup}>
              <label>CVV</label>
              <input
                name="cvv"
                value={form.cvv}
                onChange={handleChange}
                type="password"
                placeholder="123"
                required
                maxLength="4"
                pattern="[0-9]{3,4}"
              />
            </div>

            <button type="submit" className={`${Css.submitBtn} ${Css.fullWidth}`} disabled={submitting}>
              <FastForward size={16} />
              {submitting ? 'Procesando...' : `Confirmar Pago de Bs. ${price}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const ShieldCheck = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export default Pago
