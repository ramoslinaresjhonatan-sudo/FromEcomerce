import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import estructura from './estructura.json'
import styles from './template.module.css'
import ToastProvider from '../Toast/ToastProvider'
import { authService } from '../../services/api'
import { getStoredUser, isPlatformAdmin, isStoreAdmin } from '../../utils/access'

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

const buildMenuForUser = (user) => {
  if (isPlatformAdmin(user)) {
    return estructura
  }

  if (isStoreAdmin(user)) {
    return estructura
      .map((item) => {
        if (item.nombre === 'Inicio') {
          return item
        }

        if (item.nombre === 'Administración') {
          return {
            ...item,
            items: (item.items || []).filter((sub) =>
              ['/suscripciones', '/stores', '/almacenes'].includes(sub.url),
            ),
          }
        }

        if (item.nombre === 'Ecommerce') {
          return {
            ...item,
            items: (item.items || []).filter((sub) =>
              ['/categorias', '/productos'].includes(sub.url),
            ),
          }
        }

        if (item.nombre === 'Configuración') {
          return item
        }

        return null
      })
      .filter(Boolean)
  }

  return estructura.filter((item) => item.nombre === 'Configuración')
}

export default function Template({ children }) {
  const user = getStoredUser()
  const menu = buildMenuForUser(user)
  const [sidebar, setSidebar] = useState('expanded')
  const [dark, setDark]       = useState(localStorage.getItem('dark_mode') === 'true')
  const [open, setOpen]       = useState(() =>
    menu.reduce((acc, item) => {
      if (item.grupal) {
        acc[item.nombre] = true
      }
      return acc
    }, {})
  )
  const loc = useLocation()
  const effectiveOpen = menu.reduce((acc, item) => {
    if (!item.grupal) {
      return acc
    }

    const hasActiveChild = item.items?.some((sub) => sub.url === loc.pathname)
    acc[item.nombre] = hasActiveChild ? true : (open[item.nombre] ?? true)
    return acc
  }, {})

  useEffect(() => { applySavedTheme() }, [])
  useEffect(() => { localStorage.setItem('dark_mode', dark) }, [dark])

  const toggle = (name) => setOpen(p => ({ ...p, [name]: !p[name] }))

  const cycle = () =>
    setSidebar(s => s === 'expanded' ? 'collapsed' : s === 'collapsed' ? 'hidden' : 'expanded')

  const isExpanded = sidebar === 'expanded'

  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() || user.email : 'Invitado'
  const role = user ? (user.user_type || user.tipo_usuario || user.role_scope || 'Sin rol') : 'Sin rol'
  const initial = fullName.charAt(0).toUpperCase()
  const activeSection = menu.find((item) => {
    if (item.grupal) {
      return item.items?.some((sub) => sub.url === loc.pathname)
    }
    return item['ruta-No-Grupal'] === loc.pathname
  })
  const activeTitle = activeSection?.grupal
    ? activeSection.items?.find((sub) => sub.url === loc.pathname)?.nombre || activeSection.nombre
    : activeSection?.nombre || 'Dashboard'

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

          {menu.map((item, idx) => {
            // Section labels
            const isFirst = idx === 0
            const prevWasGroupal = idx > 0 && menu[idx - 1].grupal

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
                            style={{ transform: effectiveOpen[item.nombre] ? 'rotate(180deg)' : 'none' }}
                          />
                        </>
                      )}
                    </button>

                    {/* Sub-items */}
                    {(effectiveOpen[item.nombre] || sidebar === 'collapsed') && item.items?.map(sub => (
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
        <header className={styles.topbar}>
          <div className={styles.topbarIntro}>
            <span className={styles.topbarEyebrow}>Panel principal</span>
            <h1 className={styles.topbarTitle}>{activeTitle}</h1>
          </div>

          <div className={styles.topbarActions}>
            <button
              type="button"
              className={styles.iconAction}
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <ion-icon name="notifications-outline" />
            </button>

            <Link to="/configuracion" className={styles.profileAction} title="Mi perfil">
              <span className={styles.profileActionIcon}>
                <ion-icon name="person-circle-outline" />
              </span>
              <span>Mi perfil</span>
            </Link>

            <button
              type="button"
              className={styles.iconAction}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              onClick={() => authService.logout()}
            >
              <ion-icon name="log-out-outline" />
            </button>
          </div>
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </main>

      {/* Notificaciones Globales */}
      <ToastProvider />
    </div>
  )
}
