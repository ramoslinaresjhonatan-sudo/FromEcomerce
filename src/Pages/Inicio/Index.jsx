import { useEffect, useState } from 'react'
import Template from '../../Componentes/Template/template'
import styles from './Inicio.module.css'
import api, { authService } from '../../services/api'
import {
  getCurrentCompanyId,
  isPlatformAdmin,
  isStoreAdmin,
} from '../../utils/access'

const getStatus = (value) => String(value || '').trim().toUpperCase()

const getCurrentSubscription = (subscriptions, companyId) =>
  subscriptions
    .filter((item) => String(item.company) === String(companyId))
    .sort((a, b) => new Date(b.created_at || b.start_date || 0) - new Date(a.created_at || a.start_date || 0))[0] || null

const getRemainingDays = (endDate) => {
  if (!endDate) return 'Sin fecha fin'

  const today = new Date()
  const target = new Date(endDate)
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))

  if (diff < 0) return 'Vencida'
  if (diff === 0) return 'Vence hoy'
  return `${diff} día${diff === 1 ? '' : 's'} restantes`
}

export default function Inicio() {
  const user = authService.getUser()
  const [cards, setCards] = useState([])
  const [subtitle, setSubtitle] = useState('Cargando métricas...')

  useEffect(() => {
    if (!user) return

    const loadMetrics = async () => {
      if (isPlatformAdmin(user)) {
        const [companiesResp, subscriptionsResp, storesResp, warehousesResp] = await Promise.all([
          api.get('/tiendas/'),
          api.get('/suscripciones/'),
          api.get('/stores/'),
          api.get('/almacenes/'),
        ])

        const companies = Array.isArray(companiesResp.data) ? companiesResp.data : []
        const subscriptions = Array.isArray(subscriptionsResp.data) ? subscriptionsResp.data : []
        const stores = Array.isArray(storesResp.data) ? storesResp.data : []
        const warehouses = Array.isArray(warehousesResp.data) ? warehousesResp.data : []

        setSubtitle(`Bienvenido ${user.first_name || ''} ${user.last_name || ''}`.trim())
        setCards([
          { icon: 'business-outline', value: companies.length, label: 'Empresas registradas' },
          {
            icon: 'card-outline',
            value: subscriptions.filter((item) => getStatus(item.status) === 'ACTIVE').length,
            label: 'Suscripciones activas',
          },
          {
            icon: 'storefront-outline',
            value: stores.filter((item) => getStatus(item.status) === 'ACTIVE').length,
            label: 'Tiendas activas',
          },
          {
            icon: 'archive-outline',
            value: warehouses.filter((item) => getStatus(item.status) === 'ACTIVE').length,
            label: 'Almacenes activos',
          },
        ])
        return
      }

      if (isStoreAdmin(user)) {
        const companyId = getCurrentCompanyId(user)
        const [companiesResp, subscriptionsResp, storesResp, warehousesResp, plansResp] = await Promise.all([
          api.get('/tiendas/'),
          api.get('/suscripciones/'),
          api.get('/stores/'),
          api.get('/almacenes/'),
          api.get('/suscripciones/planes/'),
        ])

        const companies = Array.isArray(companiesResp.data) ? companiesResp.data : []
        const subscriptions = Array.isArray(subscriptionsResp.data) ? subscriptionsResp.data : []
        const stores = Array.isArray(storesResp.data) ? storesResp.data : []
        const warehouses = Array.isArray(warehousesResp.data) ? warehousesResp.data : []
        const plans = Array.isArray(plansResp.data) ? plansResp.data : []

        const company = companies.find((item) => String(item.id) === String(companyId))
        const currentPlanId = company?.current_subscription_plan || company?.plan_suscripcion_actual_id
        const currentPlan = plans.find((item) => String(item.id) === String(currentPlanId))
        const currentSubscription = getCurrentSubscription(subscriptions, companyId)

        const companyStores = stores.filter((item) => String(item.company) === String(companyId))
        const companyWarehouses = warehouses.filter((item) => String(item.company) === String(companyId))

        setSubtitle(`Resumen operativo de ${company?.name || 'tu empresa'}`)
        setCards([
          {
            icon: 'storefront-outline',
            value: companyStores.filter((item) => getStatus(item.status) === 'ACTIVE').length,
            label: 'Tiendas activas de tu empresa',
          },
          {
            icon: 'archive-outline',
            value: companyWarehouses.filter((item) => getStatus(item.status) === 'ACTIVE').length,
            label: 'Almacenes activos de tu empresa',
          },
          {
            icon: 'pricetag-outline',
            value: currentPlan?.name || 'Sin plan',
            label: 'Plan actual',
          },
          {
            icon: 'calendar-outline',
            value: getRemainingDays(currentSubscription?.end_date),
            label: 'Estado de suscripción',
          },
        ])
      }
    }

    loadMetrics().catch(() => {
      setSubtitle('No se pudieron cargar las métricas del dashboard.')
      setCards([])
    })
  }, [user])

  return (
    <Template>
      <div className={styles.content}>
        <h1>Dashboard</h1>
        <p>{subtitle}</p>

        <div className={styles.cards}>
          {cards.map((card) => (
            <div key={card.label} className={styles.card}>
              <ion-icon name={card.icon} />
              <div>
                <span className={styles.cardValue}>{card.value}</span>
                <span className={styles.cardLabel}>{card.label}</span>
              </div>
            </div>
          ))}
        </div>

        {!user && <p>Debes iniciar sesión para ver el dashboard.</p>}
      </div>
    </Template>
  )
}
