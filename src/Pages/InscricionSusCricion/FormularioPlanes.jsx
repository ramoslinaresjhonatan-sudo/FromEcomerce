import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, Zap, Shield, Crown } from 'lucide-react'
import Css from './FormularioPlanes.module.css'
import api from '../../services/api'

const buildFeatures = (plan) => {
  const features = []

  features.push(`Hasta ${plan.store_limit ?? 'ilimitadas'} tiendas`)
  features.push(`Hasta ${plan.warehouse_limit ?? 'ilimitados'} almacenes`)
  features.push(`Hasta ${plan.user_limit ?? 'ilimitados'} usuarios`)
  features.push(`Hasta ${plan.product_limit ?? 'ilimitados'} productos`)
  features.push(plan.includes_crm ? 'Incluye CRM' : 'Sin CRM incluido')
  features.push(plan.includes_ai ? 'Incluye IA asistida' : 'Sin IA incluida')
  features.push(`Soporte ${plan.support_level || 'estándar'}`)

  return features
}

const getPlanIcon = (index, plan) => {
  if (plan.includes_ai) return <Crown size={24} />
  if ((plan.support_level || '').toLowerCase().includes('premium')) return <Shield size={24} />
  return index === 0 ? <Zap size={24} /> : index % 2 === 0 ? <Shield size={24} /> : <Crown size={24} />
}

export default function FormularioPlanes() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])

  useEffect(() => {
    api.get('/suscripciones/planes/')
      .then((resp) => {
        const allPlans = Array.isArray(resp.data) ? resp.data : []
        setPlans(allPlans.filter((plan) => String(plan.status || '').toUpperCase() === 'ACTIVE'))
      })
      .catch(() => setPlans([]))
  }, [])

  const highlightedPlanId = useMemo(() => {
    if (!plans.length) return null

    const sorted = [...plans].sort((a, b) => Number(b.monthly_price || 0) - Number(a.monthly_price || 0))
    return sorted[Math.floor(sorted.length / 2)]?.id || sorted[0]?.id
  }, [plans])

  const displayedPlans = useMemo(() => {
    if (!plans.length || !highlightedPlanId) return plans

    const highlightedPlan = plans.find((plan) => plan.id === highlightedPlanId)
    const otherPlans = plans.filter((plan) => plan.id !== highlightedPlanId)
    const middleIndex = Math.floor(plans.length / 2)
    const arranged = [...otherPlans]

    if (highlightedPlan) {
      arranged.splice(middleIndex, 0, highlightedPlan)
    }

    return arranged
  }, [plans, highlightedPlanId])

  const handleSelectPlan = (plan) => {
    sessionStorage.setItem('selected_plan', JSON.stringify(plan))
    navigate('/pago', { state: { plan } })
  }

  return (
    <div className={Css.page}>
      <section className={Css.titleSection}>
        <h1>Selecciona tu Plan</h1>
        <p>Potencie su negocio con nuestras soluciones personalizadas y escalables.</p>
      </section>

      <div className={Css.container}>
        {displayedPlans.map((plan, index) => {
          const features = buildFeatures(plan)
          const isPopular = plan.id === highlightedPlanId

          return (
            <div
              key={plan.id}
              className={`${Css.card} ${isPopular ? Css.popularCard : ''}`}
            >
              {isPopular && <div className={Css.popularBadge}>MÁS ELEGIDO</div>}

              <div className={Css.cardHeader}>
                <div className={Css.iconWrapper}>
                  {getPlanIcon(index, plan)}
                </div>
                <h3>Plan {plan.name}</h3>
              </div>

              <div className={Css.cardBody}>
                <div className={Css.priceContainer}>
                  <span className={Css.currency}>Bs.</span>
                  <span className={Css.amount}>{Number(plan.monthly_price || 0).toFixed(0)}</span>
                  <span className={Css.period}>/mes</span>
                </div>
                <p className={Css.description}>{plan.description || 'Plan activo disponible en la plataforma.'}</p>

                <div className={Css.divider}></div>

                <ul className={Css.featuresList}>
                  {features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={Css.featureItem}>
                      <div className={Css.checkWrapper}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`${Css.ctaButton} ${isPopular ? Css.popular : ''}`}
                onClick={() => handleSelectPlan(plan)}
              >
                <span>Elegir Plan {plan.name}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
