import styles from './Login.module.css'
import { ShoppingBag, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/api'
import { canAccessDashboard } from '../../utils/access'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authService.login(email, password)
      if (!canAccessDashboard(result.user)) {
        authService.logout()
        throw new Error('Tu usuario no tiene acceso a este dashboard.')
      }
      navigate('/inicio')
    } catch (err) {
      const msg =
        err.message ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Error al iniciar sesión. Verifica tus credenciales.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Left panel – brand */}
      <div className={styles.panel}>
        <div className={styles.panelContent}>
          <div className={styles.logo}>
            <ShoppingBag size={28} />
            <span>EcomSaaS</span>
          </div>
          <h2>La plataforma más rápida para vender online</h2>
          <p>Gestiona productos, pagos y analíticas desde un solo lugar.</p>
          <div className={styles.stats}>
            <div><strong>+8,000</strong><span>Tiendas activas</span></div>
            <div><strong>99.9%</strong><span>Uptime</span></div>
            <div><strong>4.9★</strong><span>Valoración</span></div>
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className={styles.formSide}>
        <div className={styles.formBox}>
          <h1>Bienvenido de nuevo</h1>
          <p className={styles.subtitle}>Inicia sesión para gestionar tu tienda</p>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Correo electrónico</label>
              <div className={styles.inputWrapper}>
                <Mail size={16} className={styles.icon} />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Contraseña</label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.icon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.row}>
              <label className={styles.checkLabel}>
                <input type="checkbox" /> Recordarme
              </label>
              <a href="#" className={styles.forgot}>¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? (
                <><Loader2 size={18} className={styles.spinner} /> Ingresando…</>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <p className={styles.register}>
            ¿No tienes cuenta? <Link to="/register" className={styles.link}>Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
