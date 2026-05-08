import styles from './landingPages.module.css'
import { Link } from 'react-router-dom'
import { ShoppingBag, ShoppingCart, CreditCard, Package, BarChart2, Star, ArrowRight, CheckCircle } from 'lucide-react'

const services = [
  { icon: <ShoppingCart size={32} />, title: 'Gestión de Productos', desc: 'Sube, edita y organiza tu catálogo con variantes, precios e inventario.' },
  { icon: <CreditCard size={32} />, title: 'Pagos Integrados', desc: 'Acepta tarjetas, transferencias y billeteras digitales sin comisiones extra.' },
  { icon: <Package size={32} />, title: 'Logística & Envíos', desc: 'Conecta con las principales transportadoras y haz tracking en tiempo real.' },
  { icon: <BarChart2 size={32} />, title: 'Analíticas Avanzadas', desc: 'Dashboards con ventas, conversión y comportamiento del cliente.' },
]

const steps = [
  { num: '1', label: 'Crea tu cuenta', desc: 'Regístrate gratis en menos de 60 segundos.' },
  { num: '2', label: 'Personaliza tu tienda', desc: 'Elige un template y agrega tus productos.' },
  { num: '3', label: 'Activa los pagos', desc: 'Conecta tu pasarela de pago favorita.' },
  { num: '4', label: '¡Empieza a vender!', desc: 'Comparte tu tienda y recibe tus primeros pedidos.' },
]

const testimonials = [
  { name: 'Andrés López', role: 'Fundador, TiendaLux', text: 'En 3 semanas triplicamos nuestras ventas online. La plataforma es increíblemente intuitiva.' },
  { name: 'María Gutierrez', role: 'CEO, ModoFashion', text: '¡La mejor inversión! La integración con redes sociales nos abrió un mercado enorme.' },
  { name: 'Carlos Ramírez', role: 'Emprendedor', text: 'Las analíticas me permitieron identificar mis mejores productos y enfocar mis campañas.' },
]

export default function LandingPages() {
  return (
    <div className={styles.page}>

      {/* ── NAVBAR ── */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <ShoppingBag size={22} />
          <span>EcomSaaS</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#services">Servicios</a>
          <a href="#steps">Cómo funciona</a>
          <Link to="/formulario-planes">Planes</Link>
          <a href="#testimonials">Clientes</a>
        </div>
        <Link to="/formulario-planes" className={styles.navCta}>Empezar gratis</Link>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.heroTag}>🛒 La plataforma #1 para ecommerce</p>
          <h1>
            Lanza tu <span className={styles.highlight}>tienda online</span>{' '}
            sin complicaciones
          </h1>
          <p className={styles.heroSubtitle}>
            Gestiona productos, pagos, envíos y analíticas desde un solo lugar.
            Escala tu negocio con herramientas de nivel enterprise.
          </p>
          <div className={styles.heroActions}>
            <Link to="/formulario-planes" className={styles.btnOrange}>
              Comenzar gratis <ArrowRight size={16} />
            </Link>
            <Link to="/login" className={styles.btnGhost}>Iniciar Sesión</Link>
          </div>
          <div className={styles.heroStars}>
            {[1,2,3,4,5].map(i => <Star key={i} size={15} fill="#F59E0B" color="#F59E0B" />)}
            <span>+8,000 tiendas activas</span>
          </div> 
        </div>
        <div className={styles.heroImg}>
          <img src="/images/hero.png" alt="Ecommerce SaaS dashboard 3D illustration" />
        </div>
      </section>

      <section id="services" className={styles.services}>
        <div className={styles.sectionHeader}>
          <h2>Todo lo que necesitas para <span className={styles.highlight}>vender online</span></h2>
          <p>Herramientas potentes, integradas en un solo lugar para que te enfoques en crecer.</p>
        </div>
        <div className={styles.servicesGrid}>
          {services.map((s, i) => (
            <div key={i} className={styles.serviceCard}>
              <div className={styles.serviceIcon}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="steps" className={styles.stepsSection}>
        <div className={styles.stepsImg}>
          <img src="/images/seller.png" alt="Vendedor usando la plataforma" />
        </div>
        <div className={styles.stepsContent}>
          <p className={styles.sectionTag}>¡Así de simple!</p>
          <h2>Comienza a vender en <span className={styles.highlight}>4 pasos</span></h2>
          <div className={styles.stepsList}>
            {steps.map((s, i) => (
              <div key={i} className={styles.stepItem}>
                <span className={styles.stepNum}>{s.num}</span>
                <div>
                  <strong>{s.label}</strong>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/formulario-planes" className={styles.btnOrange}>Empezar ahora <ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* ── ANALYTICS ── */}
      <section className={styles.analyticsSection}>
        <div className={styles.analyticsContent}>
          <p className={styles.sectionTag}>Inteligencia de negocio</p>
          <h2>Toma decisiones basadas en <span className={styles.highlight}>datos reales</span></h2>
          <ul className={styles.analyticsFeatures}>
            {['Ventas en tiempo real', 'Tasa de conversión', 'Productos más vendidos', 'Comportamiento del cliente'].map((f, i) => (
              <li key={i}><CheckCircle size={18} className={styles.check} /> {f}</li>
            ))}
          </ul>
          <button className={styles.btnOrange}>Ver analíticas <ArrowRight size={16} /></button>
        </div>
        <div className={styles.analyticsImg}>
          <img src="/images/analytics.png" alt="Dashboard de analíticas 3D" />
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className={styles.testimonials}>
        <div className={styles.sectionHeader}>
          <h2>Lo que dicen nuestros <span className={styles.highlight}>clientes</span></h2>
          <p>Miles de emprendedores ya confían en EcomSaaS para hacer crecer su negocio.</p>
        </div>
        <div className={styles.testimonialsGrid}>
          {testimonials.map((t, i) => (
            <div key={i} className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>
                {[1,2,3,4,5].map(s => <Star key={s} size={13} fill="#F59E0B" color="#F59E0B" />)}
              </div>
              <p>"{t.text}"</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.avatar}>{t.name[0]}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className={styles.ctaBanner}>
        <h2>¿Listo para comenzar?</h2>
        <p>Únete a miles de emprendedores que ya venden con EcomSaaS.</p>
        <Link to="/formulario-planes" className={styles.btnWhite}>Crear mi tienda gratis</Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <div className={styles.logo}><ShoppingBag size={20} /><span>EcomSaaS</span></div>
            <p className={styles.footerDesc}>La plataforma más rápida para lanzar tu tienda online.</p>
          </div>
          <div>
            <strong>Producto</strong>
            <ul><li>Características</li><li>Precios</li><li>Demo</li><li>Novedades</li></ul>
          </div>
          <div>
            <strong>Empresa</strong>
            <ul><li>Sobre nosotros</li><li>Blog</li><li>Carreras</li><li>Contacto</li></ul>
          </div>
          <div>
            <strong>Recursos</strong>
            <ul><li>Documentación</li><li>Comunidad</li><li>Soporte</li><li>API</li></ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2024 EcomSaaS Inc. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  )
}