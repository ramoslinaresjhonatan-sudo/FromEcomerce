import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import estructura from './estructura.json'
import styles from './template.module.css'
import ToastProvider from '../Toast/ToastProvider'

const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : null
}

const applySavedTheme = () => {
  const color = localStorage.getItem('theme_color') || '#F97316'
  const font  = localStorage.getItem('theme_font')  || 'Outfit'
  const size  = localStorage.getItem('theme_size')   || '15px'
  const bgImg = localStorage.getItem('theme_bg_image') || ''
  const bgColor = localStorage.getItem('theme_bg_color') || ''
  const bgOverlay = localStorage.getItem('theme_bg_overlay') || '0'
  const textOpacity = localStorage.getItem('theme_text_opacity') || '1'

  document.documentElement.style.setProperty('--app-primary', color)
  document.documentElement.style.setProperty('--app-font', font)
  document.documentElement.style.setProperty('--app-size', size)
  document.documentElement.style.fontSize = size
  document.documentElement.style.setProperty('--bg-overlay', bgOverlay)
  document.documentElement.style.setProperty('--text-opacity', textOpacity)
  
  if (bgImg) {
    document.documentElement.style.setProperty('--app-bg-image', `url(${bgImg})`)
  } else {
    document.documentElement.style.setProperty('--app-bg-image', 'none')
  }

  if (bgColor) {
    document.documentElement.style.setProperty('--app-bg-color', bgColor)
  } else {
    document.documentElement.style.removeProperty('--app-bg-color')
  }

  const rgb = hexToRgb(color)
  if (rgb) {
    document.documentElement.style.setProperty('--app-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
    document.documentElement.style.setProperty('--app-primary-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`)
    document.documentElement.style.setProperty('--app-primary-hover', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`)
    document.documentElement.style.setProperty('--app-primary-active', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`)
  }
}

// Icon mapping
const icons = {
  'icon-cube':     'cube-outline',
  'icon-home':     'home-outline',
  'icon-cart':     'cart-outline',
  'icon-bag':      'bag-outline',
  'icon-people':   'people-outline',
  'icon-receipt':  'receipt-outline',
  'icon-settings': 'settings-outline',
}

function Icon({ name }) {
  return <ion-icon name={icons[name] || 'ellipse-outline'} />
}

export default function Template({ children }) {
  const [sidebar, setSidebar] = useState('expanded')
  const [dark, setDark]       = useState(localStorage.getItem('dark_mode') === 'true')
  const [open, setOpen]       = useState({})
  const loc = useLocation()

  useEffect(() => { applySavedTheme() }, [])
  useEffect(() => { localStorage.setItem('dark_mode', dark) }, [dark])

  const toggle = (name) => setOpen(p => ({ ...p, [name]: !p[name] }))

  const cycle = () =>
    setSidebar(s => s === 'expanded' ? 'collapsed' : s === 'collapsed' ? 'hidden' : 'expanded')

  const isExpanded = sidebar === 'expanded'

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() || user.email : 'Invitado'
  const role = user ? user.tipo_usuario : 'Sin rol'
  const initial = fullName.charAt(0).toUpperCase()

  return (
    <div className={`${styles.layout} ${dark ? styles.dark : styles.light}`}>

      {/* ─── SIDEBAR ─── */}
      <aside className={`${styles.sidebar} ${styles[sidebar]}`}>

        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandDot}>
            <img src="/logo.png" alt="EcomSaaS" className={styles.brandLogo} />
          </div>
          {isExpanded && <span className={styles.brandName}>EcomSaaS</span>}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>

          {estructura.map((item, idx) => {
            // Section labels
            const isFirst = idx === 0
            const prevWasGroupal = idx > 0 && estructura[idx - 1].grupal
            const showLabel = isExpanded && (
              (isFirst && item.grupal)  ||
              (!item.grupal && prevWasGroupal)
            )

            return (
              <div key={item.nombre}>

                {/* Section divider label */}
                {isFirst && isExpanded && (
                  <div className={styles.sectionLabel}>Menú</div>
                )}
                {!item.grupal && prevWasGroupal && isExpanded && (
                  <div className={styles.sectionLabel}>General</div>
                )}

                {item.grupal ? (
                  <>
                    {/* Group header */}
                    <button
                      className={`${styles.navItem} ${styles.groupHeader}`}
                      onClick={() => toggle(item.nombre)}
                      title={!isExpanded ? item.nombre : undefined}
                    >
                      <span className={styles.navIcon}><Icon name={item['ion-icon']} /></span>
                      {isExpanded && (
                        <>
                          <span className={styles.navLabel}>{item.nombre}</span>
                          <ion-icon
                            name="chevron-down-outline"
                            class={styles.chevron}
                            style={{ transform: open[item.nombre] ? 'rotate(180deg)' : 'none' }}
                          />
                        </>
                      )}
                    </button>

                    {/* Sub-items */}
                    {(open[item.nombre] || sidebar === 'collapsed') && item.items?.map(sub => (
                      <Link
                        key={sub.url}
                        to={sub.url}
                        className={`${styles.navItem} ${styles.subItem} ${loc.pathname === sub.url ? styles.active : ''}`}
                        title={!isExpanded ? sub.nombre : undefined}
                      >
                        <span className={styles.navIcon}><Icon name={sub['ion-icon']} /></span>
                        {isExpanded && <span className={styles.navLabel}>{sub.nombre}</span>}
                      </Link>
                    ))}
                  </>
                ) : (
                  <Link
                    to={item['ruta-No-Grupal']}
                    className={`${styles.navItem} ${loc.pathname === item['ruta-No-Grupal'] ? styles.active : ''}`}
                    title={!isExpanded ? item.nombre : undefined}
                  >
                    <span className={styles.navIcon}><Icon name={item['ion-icon']} /></span>
                    {isExpanded && <span className={styles.navLabel}>{item.nombre}</span>}
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className={styles.sidebarBottom}>
          <button
            className={styles.themeBtn}
            onClick={() => setDark(d => !d)}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            <ion-icon name={dark ? 'sunny-outline' : 'moon-outline'} />
            {isExpanded && <span>{dark ? 'Claro' : 'Oscuro'}</span>}
          </button>

          <div className={styles.userPill} title={!isExpanded ? fullName : undefined}>
            <div className={styles.userAvatar}>{initial}</div>
            {isExpanded && (
              <div className={styles.userMeta}>
                <span className={styles.userName}>{fullName}</span>
                <span className={styles.userRole}>{role}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Toggle */}
      <button
        className={`${styles.toggleBtn} ${sidebar === 'hidden' ? styles.toggleBtnHidden : ''}`}
        onClick={cycle}
        title="Menú"
      >
        <ion-icon name={sidebar === 'collapsed' ? 'contract-outline' : 'menu-outline'} />
      </button>

      {/* ─── MAIN ─── */}
      <main className={`${styles.main} ${styles[`main_${sidebar}`]}`}>
        {children}
      </main>

      {/* Notificaciones Globales */}
      <ToastProvider />
    </div>
  )
}