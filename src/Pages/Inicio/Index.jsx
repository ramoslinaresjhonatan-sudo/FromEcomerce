import Template from '../../Componentes/Template/template'
import styles from './Inicio.module.css'

export default function Inicio() {
  return (
    <Template>
      <div className={styles.content}>
        <h1>Dashboard</h1>
        <p>Bienvenido a tu panel de ecommerce. Aquí verás tus métricas principales.</p>

        {/* Placeholder KPI cards */}
        <div className={styles.cards}>
          <div className={styles.card}>
            <ion-icon name="cart-outline" />
            <div>
              <span className={styles.cardValue}>248</span>
              <span className={styles.cardLabel}>Pedidos hoy</span>
            </div>
          </div>
          <div className={styles.card}>
            <ion-icon name="cash-outline" />
            <div>
              <span className={styles.cardValue}>$12,840</span>
              <span className={styles.cardLabel}>Ingresos del mes</span>
            </div>
          </div>
          <div className={styles.card}>
            <ion-icon name="people-outline" />
            <div>
              <span className={styles.cardValue}>1,092</span>
              <span className={styles.cardLabel}>Clientes activos</span>
            </div>
          </div>
          <div className={styles.card}>
            <ion-icon name="bag-outline" />
            <div>
              <span className={styles.cardValue}>384</span>
              <span className={styles.cardLabel}>Productos</span>
            </div>
          </div>
        </div>
      </div>
    </Template>
  )
}