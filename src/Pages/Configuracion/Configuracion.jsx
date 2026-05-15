import { useState, useEffect } from 'react'
import Template from '../../Componentes/Template/template'
import Css from './Configuracion.module.css'
import api from '../../services/api'

const FONTS = [
  { label: 'Outfit (Predeterminado)', value: 'Outfit' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Montserrat', value: 'Montserrat' },
]

const FONT_SIZES = [
  { label: 'Pequeño', value: '13px' },
  { label: 'Mediano', value: '15px' },
  { label: 'Grande', value: '17px' },
]

const PRESETS = [
  { label: 'Naranja', value: '#F97316' },
  { label: 'Índigo', value: '#6366F1' },
  { label: 'Esmeralda', value: '#10B981' },
  { label: 'Azul', value: '#3B82F6' },
  { label: 'Rosa', value: '#EC4899' },
  { label: 'Rojo', value: '#EF4444' },
]

const PREDEFINED_BGS = [
  '/fondos/bloom_blue_1776918759942.png',
  '/fondos/bloom_purple_1776918904122.png',
  '/fondos/bloom_orange_1776918919955.png',
  '/fondos/bloom_dark_1776919136021.png',
  '/fondos/bloom_silver_1776919153876.png',
]

const BG_COLORS = [
  '#0c0a09',
  '#f4f2ee',
  '#1e1b4b',
  '#064e3b',
  '#7f1d1d',
]

function loadTheme() {
  return {
    primaryColor: localStorage.getItem('theme_color') || '#F97316',
    fontFamily: localStorage.getItem('theme_font') || 'Outfit',
    fontSize: localStorage.getItem('theme_size') || '15px',
    backgroundImage: localStorage.getItem('theme_bg_image') || '',
    backgroundColor: localStorage.getItem('theme_bg_color') || '',
    bgOverlay: localStorage.getItem('theme_bg_overlay') || '0',
    textOpacity: localStorage.getItem('theme_text_opacity') || '1',
  }
}

function applyTheme({ primaryColor, fontFamily, fontSize, backgroundImage, backgroundColor, bgOverlay, textOpacity }) {
  const root = document.documentElement
  root.style.setProperty('--app-primary', primaryColor)
  root.style.setProperty('--app-font', fontFamily)
  root.style.setProperty('--app-size', fontSize)
  root.style.fontSize = fontSize
  root.style.setProperty('--bg-overlay', bgOverlay)
  root.style.setProperty('--text-opacity', textOpacity)

  if (backgroundImage) {
    root.style.setProperty('--app-bg-image', `url(${backgroundImage})`)
  } else {
    root.style.setProperty('--app-bg-image', 'none')
  }

  if (backgroundColor) {
    root.style.setProperty('--app-bg-color', backgroundColor)
  } else {
    root.style.removeProperty('--app-bg-color')
  }

  const rgb = hexToRgb(primaryColor)
  if (rgb) {
    root.style.setProperty('--app-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
    root.style.setProperty('--app-primary-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`)
    root.style.setProperty('--app-primary-hover', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`)
    root.style.setProperty('--app-primary-active', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`)
  }

  document.body.style.fontFamily = `'${fontFamily}', sans-serif`
  document.body.style.fontSize = fontSize

  const id = `gfont-${fontFamily}`
  if (!document.getElementById(id)) {
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;600;700;800&display=swap`
    document.head.appendChild(link)
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

const emptyCompany = {
  id: '',
  name: '',
  tax_id: '',
  email: '',
  phone: '',
  address: '',
  legal_name: '',
  primary_currency: 'BOB',
  timezone: 'America/La_Paz',
}

export default function Configuracion() {
  const [profile, setProfile] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    cargo: '',
    password: '',
    confirm: '',
  })
  const [profileSaved, setProfileSaved] = useState(false)

  const [company, setCompany] = useState(emptyCompany)
  const [companySaved, setCompanySaved] = useState(false)

  const [theme, setTheme] = useState(loadTheme)
  const [themeSaved, setThemeSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const bootstrap = async () => {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) return

      const roleValue = user.user_type || user.role_scope || ''
      const adminLike = ['SUPERUSER', 'MODERATOR', 'STORE_ADMIN', 'SYSTEM', 'COMPANY', 'STORE'].includes(roleValue)

      setProfile({
        nombre: user.first_name || user.nombres || '',
        apellido: user.last_name || user.apellidos || '',
        correo: user.email || '',
        telefono: user.phone || user.telefono || '',
        cargo: roleValue || 'Usuario',
        password: '',
        confirm: '',
      })
      setIsAdmin(adminLike)

      const companyId = user.current_company || user.company || user.active_company_id
      if (companyId) {
        try {
          const { data } = await api.get(`/tiendas/${companyId}/`)
          setCompany({
            id: data.id || '',
            name: data.name || '',
            tax_id: data.tax_id || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            legal_name: data.legal_name || '',
            primary_currency: data.primary_currency || 'BOB',
            timezone: data.timezone || 'America/La_Paz',
          })
        } catch (err) {
          console.error(err)
        }
      }
    }

    bootstrap()
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const handleProfile = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setProfileSaved(false)
  }

  const handleCompany = (e) => {
    setCompany((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setCompanySaved(false)
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    if (profile.password && profile.password !== profile.confirm) {
      alert('Las contraseñas no coinciden')
      return
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const payload = {
        first_name: profile.nombre,
        last_name: profile.apellido,
        email: profile.correo,
        phone: profile.telefono || null,
      }

      if (profile.password) {
        payload.password = profile.password
      }

      const { data } = await api.patch(`/usuarios/${user.id}/`, payload)
      localStorage.setItem('user', JSON.stringify(data))
      setProfileSaved(true)
      setProfile((prev) => ({ ...prev, password: '', confirm: '' }))
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err) {
      console.error(err)
      alert('Error al guardar perfil')
    }
  }

  const saveCompany = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: company.name,
        tax_id: company.tax_id || null,
        email: company.email || null,
        phone: company.phone || null,
        address: company.address || null,
        legal_name: company.legal_name || null,
        primary_currency: company.primary_currency || 'BOB',
        timezone: company.timezone || 'America/La_Paz',
      }
      const { data } = await api.put(`/tiendas/${company.id}/`, payload)
      setCompany({
        id: data.id || '',
        name: data.name || '',
        tax_id: data.tax_id || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        legal_name: data.legal_name || '',
        primary_currency: data.primary_currency || 'BOB',
        timezone: data.timezone || 'America/La_Paz',
      })
      setCompanySaved(true)
      setTimeout(() => setCompanySaved(false), 3000)
    } catch (err) {
      console.error(err)
      alert('Error al guardar datos de la empresa')
    }
  }

  const updateTheme = (key, value) => {
    setTheme((prev) => ({ ...prev, [key]: value }))
    setThemeSaved(false)
  }

  const saveTheme = () => {
    localStorage.setItem('theme_color', theme.primaryColor)
    localStorage.setItem('theme_font', theme.fontFamily)
    localStorage.setItem('theme_size', theme.fontSize)
    localStorage.setItem('theme_bg_overlay', theme.bgOverlay)
    localStorage.setItem('theme_text_opacity', theme.textOpacity)

    if (theme.backgroundImage) {
      localStorage.setItem('theme_bg_image', theme.backgroundImage)
    } else {
      localStorage.removeItem('theme_bg_image')
    }

    if (theme.backgroundColor) {
      localStorage.setItem('theme_bg_color', theme.backgroundColor)
    } else {
      localStorage.removeItem('theme_bg_color')
    }

    setThemeSaved(true)
    setTimeout(() => setThemeSaved(false), 3000)
  }

  const resetTheme = () => {
    const def = { primaryColor: '#F97316', fontFamily: 'Outfit', fontSize: '15px', backgroundImage: '', backgroundColor: '', bgOverlay: '0', textOpacity: '1' }
    setTheme(def)
    localStorage.removeItem('theme_color')
    localStorage.removeItem('theme_font')
    localStorage.removeItem('theme_size')
    localStorage.removeItem('theme_bg_image')
    localStorage.removeItem('theme_bg_color')
    localStorage.removeItem('theme_bg_overlay')
    localStorage.removeItem('theme_text_opacity')
    applyTheme(def)
  }

  const selectBackgroundImage = (url) => {
    updateTheme('backgroundImage', url)
    updateTheme('backgroundColor', '')
  }

  const selectBackgroundColor = (color) => {
    updateTheme('backgroundImage', '')
    updateTheme('backgroundColor', color)
  }

  const removeBackground = () => {
    updateTheme('backgroundImage', '')
    updateTheme('backgroundColor', '')
  }

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Configuración</h1>
          <p>Personaliza tu perfil, la apariencia y los datos principales de tu empresa.</p>
        </div>

        <div className={Css.tabs}>
          <button className={`${Css.tab} ${activeTab === 'profile' ? Css.tabActive : ''}`} onClick={() => setActiveTab('profile')}>
            <ion-icon name="person-circle-outline" /> Perfil
          </button>

          {isAdmin && company.id && (
            <button className={`${Css.tab} ${activeTab === 'company' ? Css.tabActive : ''}`} onClick={() => setActiveTab('company')}>
              <ion-icon name="business-outline" /> Empresa
            </button>
          )}

          <button className={`${Css.tab} ${activeTab === 'theme' ? Css.tabActive : ''}`} onClick={() => setActiveTab('theme')}>
            <ion-icon name="color-palette-outline" /> Apariencia
          </button>
        </div>

        {activeTab === 'profile' && (
          <form className={Css.card} onSubmit={saveProfile}>
            <div className={Css.avatarSection}>
              <div className={Css.avatarBig}>
                {(profile.nombre[0] || 'U')}{(profile.apellido[0] || '')}
              </div>
              <div>
                <p className={Css.avatarName}>{profile.nombre} {profile.apellido}</p>
                <span className={Css.roleBadge}>
                  <ion-icon name="shield-checkmark-outline" /> {profile.cargo}
                </span>
              </div>
            </div>

            <div className={Css.formGrid}>
              <div className={Css.field}>
                <label>Nombre</label>
                <div className={Css.inputWrap}>
                  <ion-icon name="person-outline" />
                  <input name="nombre" value={profile.nombre} onChange={handleProfile} placeholder="Nombre" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Apellido</label>
                <div className={Css.inputWrap}>
                  <ion-icon name="person-outline" />
                  <input name="apellido" value={profile.apellido} onChange={handleProfile} placeholder="Apellido" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Correo electrónico</label>
                <div className={Css.inputWrap}>
                  <ion-icon name="mail-outline" />
                  <input name="correo" type="email" value={profile.correo} onChange={handleProfile} placeholder="correo@ejemplo.com" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Teléfono</label>
                <div className={Css.inputWrap}>
                  <ion-icon name="call-outline" />
                  <input name="telefono" value={profile.telefono} onChange={handleProfile} placeholder="+591 70000000" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Cargo / Rol</label>
                <div className={Css.inputWrap}>
                  <ion-icon name="briefcase-outline" />
                  <input name="cargo" value={profile.cargo} disabled />
                </div>
              </div>
              <div className={Css.field}>
                <label>Nueva contraseña</label>
                <div className={Css.inputWrap}>
                  <ion-icon name="lock-closed-outline" />
                  <input name="password" type="password" value={profile.password} onChange={handleProfile} placeholder="••••••••" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Confirmar contraseña</label>
                <div className={Css.inputWrap}>
                  <ion-icon name="lock-closed-outline" />
                  <input name="confirm" type="password" value={profile.confirm} onChange={handleProfile} placeholder="••••••••" />
                </div>
              </div>
            </div>

            <div className={Css.actions}>
              <button type="submit" className={Css.btnSave}>
                <ion-icon name="save-outline" />
                {profileSaved ? '¡Guardado!' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'company' && isAdmin && company.id && (
          <form className={Css.card} onSubmit={saveCompany}>
            <div className={Css.section}>
              <h2><ion-icon name="business-outline" /> Datos de la Empresa</h2>
              <p style={{ marginBottom: '20px', opacity: 0.7 }}>Estos datos se sincronizan con el modelo actual de empresas del backend.</p>

              <div className={Css.formGrid}>
                <div className={Css.field}>
                  <label>Nombre Comercial</label>
                  <div className={Css.inputWrap}>
                    <ion-icon name="storefront-outline" />
                    <input name="name" value={company.name} onChange={handleCompany} placeholder="Nombre Comercial" required />
                  </div>
                </div>
                <div className={Css.field}>
                  <label>Razón Social</label>
                  <div className={Css.inputWrap}>
                    <ion-icon name="document-text-outline" />
                    <input name="legal_name" value={company.legal_name} onChange={handleCompany} placeholder="Razón social" />
                  </div>
                </div>
                <div className={Css.field}>
                  <label>NIT</label>
                  <div className={Css.inputWrap}>
                    <ion-icon name="card-outline" />
                    <input name="tax_id" value={company.tax_id} onChange={handleCompany} placeholder="12345678-9" />
                  </div>
                </div>
                <div className={Css.field}>
                  <label>Correo Corporativo</label>
                  <div className={Css.inputWrap}>
                    <ion-icon name="mail-outline" />
                    <input name="email" type="email" value={company.email} onChange={handleCompany} placeholder="empresa@ejemplo.com" />
                  </div>
                </div>
                <div className={Css.field}>
                  <label>Teléfono Corporativo</label>
                  <div className={Css.inputWrap}>
                    <ion-icon name="call-outline" />
                    <input name="phone" value={company.phone} onChange={handleCompany} placeholder="+591 70000000" />
                  </div>
                </div>
                <div className={Css.field}>
                  <label>Moneda Principal</label>
                  <div className={Css.inputWrap}>
                    <select name="primary_currency" value={company.primary_currency} onChange={handleCompany}>
                      <option value="BOB">BOB</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div className={Css.field}>
                  <label>Zona Horaria</label>
                  <div className={Css.inputWrap}>
                    <select name="timezone" value={company.timezone} onChange={handleCompany}>
                      <option value="America/La_Paz">America/La_Paz</option>
                      <option value="America/Lima">America/Lima</option>
                      <option value="America/Bogota">America/Bogota</option>
                      <option value="America/Santiago">America/Santiago</option>
                    </select>
                  </div>
                </div>
                <div className={Css.field} style={{ gridColumn: '1 / -1' }}>
                  <label>Dirección Física</label>
                  <div className={Css.inputWrap}>
                    <ion-icon name="location-outline" />
                    <input name="address" value={company.address} onChange={handleCompany} placeholder="Av. Principal #123, Ciudad" />
                  </div>
                </div>
              </div>
            </div>

            <div className={Css.actions}>
              <button type="submit" className={Css.btnSave}>
                <ion-icon name="save-outline" />
                {companySaved ? '¡Guardado!' : 'Guardar Datos de Empresa'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'theme' && (
          <div className={Css.card}>
            <div className={Css.section}>
              <h2><ion-icon name="color-fill-outline" /> Color principal</h2>
              <div className={Css.presets}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    className={`${Css.presetBtn} ${theme.primaryColor === preset.value ? Css.presetActive : ''}`}
                    style={{ background: preset.value }}
                    title={preset.label}
                    onClick={() => updateTheme('primaryColor', preset.value)}
                  />
                ))}
                <label className={Css.colorPickerWrap} title="Color personalizado">
                  <ion-icon name="add-outline" />
                  <input
                    type="color"
                    value={theme.primaryColor}
                    className={Css.colorPicker}
                    onChange={(e) => updateTheme('primaryColor', e.target.value)}
                  />
                </label>
              </div>
              <div className={Css.previewChip} style={{ background: theme.primaryColor }}>
                Vista previa: {theme.primaryColor}
              </div>
            </div>

            <div className={Css.section}>
              <h2><ion-icon name="text-outline" /> Estilo de letra</h2>
              <div className={Css.fontGrid}>
                {FONTS.map((font) => (
                  <button
                    key={font.value}
                    className={`${Css.fontBtn} ${theme.fontFamily === font.value ? Css.fontBtnActive : ''}`}
                    style={{ fontFamily: font.value }}
                    onClick={() => updateTheme('fontFamily', font.value)}
                  >
                    Aa — {font.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={Css.section}>
              <h2><ion-icon name="expand-outline" /> Tamaño de letra</h2>
              <div className={Css.sizeButtons}>
                {FONT_SIZES.map((size) => (
                  <button
                    key={size.value}
                    className={`${Css.sizeBtn} ${theme.fontSize === size.value ? Css.sizeBtnActive : ''}`}
                    style={{ fontSize: size.value }}
                    onClick={() => updateTheme('fontSize', size.value)}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={Css.section}>
              <div className={Css.sectionHeader}>
                <h2><ion-icon name="image-outline" /> Fondo de la aplicación</h2>
                {(theme.backgroundImage || theme.backgroundColor) && (
                  <button className={Css.btnReset} onClick={removeBackground} style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}>
                    Restablecer fondo
                  </button>
                )}
              </div>

              <h3 className={Css.subLabel}>Imágenes prediseñadas</h3>
              <div className={Css.bgScroll}>
                {PREDEFINED_BGS.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => selectBackgroundImage(url)}
                    className={Css.bgThumb}
                    style={{
                      backgroundImage: `url(${url})`,
                      border: theme.backgroundImage === url ? '3px solid var(--app-primary)' : '2px solid var(--border)',
                    }}
                  />
                ))}
              </div>

              <h3 className={Css.subLabel}>Colores sólidos</h3>
              <div className={Css.colorSwatches}>
                {BG_COLORS.map((color, i) => (
                  <div
                    key={i}
                    onClick={() => selectBackgroundColor(color)}
                    className={Css.colorSwatch}
                    style={{
                      backgroundColor: color,
                      border: theme.backgroundColor === color ? '3px solid var(--app-primary)' : '2px solid var(--border)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className={Css.section}>
              <h2><ion-icon name="contrast-outline" /> Oscurecer fondo</h2>
              <div className={Css.sliderRow}>
                <input type="range" min="0" max="0.95" step="0.05" value={theme.bgOverlay} onChange={(e) => updateTheme('bgOverlay', e.target.value)} className={Css.slider} />
                <span className={Css.sliderValue}>{Math.round(theme.bgOverlay * 100)}%</span>
              </div>
            </div>

            <div className={Css.section}>
              <h2><ion-icon name="text-outline" /> Intensidad del texto</h2>
              <div className={Css.sliderRow}>
                <input type="range" min="0.1" max="1" step="0.05" value={theme.textOpacity} onChange={(e) => updateTheme('textOpacity', e.target.value)} className={Css.slider} />
                <span className={Css.sliderValue}>{Math.round(theme.textOpacity * 100)}%</span>
              </div>
            </div>

            <div className={Css.actions}>
              <button className={Css.btnReset} onClick={resetTheme}>Restablecer</button>
              <button className={Css.btnSave} onClick={saveTheme}>{themeSaved ? '¡Guardado!' : 'Guardar apariencia'}</button>
            </div>
          </div>
        )}
      </div>
    </Template>
  )
}
