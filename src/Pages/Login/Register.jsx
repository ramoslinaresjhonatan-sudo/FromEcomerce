import styles from '../Login/Login.module.css'
import { Mail, Lock, User, Loader2, Phone } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/api'

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authService.register({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        password: formData.password,
      })
      navigate('/inicio')
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Error al registrarse. Revisa los datos.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.panelContent}>
          <div className={styles.logo}>
            <User size={28} />
            <span>EcomSaaS</span>
          </div>
          <h2>Crea tu acceso al sistema</h2>
          <p>Registra un usuario con el modelo actual del backend y empieza a trabajar de inmediato.</p>
          <div className={styles.stats}>
            <div><strong>Rápido</strong><span>Alta de usuario</span></div>
            <div><strong>Seguro</strong><span>Autenticación JWT</span></div>
          </div>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formBox}>
          <h1>Crear cuenta</h1>
          <p className={styles.subtitle}>Registra tus datos básicos para ingresar al dashboard</p>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Nombres</label>
              <div className={styles.inputWrapper}>
                <User size={16} className={styles.icon} />
                <input
                  name="first_name"
                  type="text"
                  placeholder="Juan"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Apellidos</label>
              <div className={styles.inputWrapper}>
                <User size={16} className={styles.icon} />
                <input
                  name="last_name"
                  type="text"
                  placeholder="Pérez López"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Correo electrónico</label>
              <div className={styles.inputWrapper}>
                <Mail size={16} className={styles.icon} />
                <input
                  name="email"
                  type="email"
                  placeholder="juan@empresa.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Teléfono</label>
              <div className={styles.inputWrapper}>
                <Phone size={16} className={styles.icon} />
                <input
                  name="phone"
                  type="text"
                  placeholder="+591 70000000"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Contraseña</label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.icon} />
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? (
                <><Loader2 size={18} className={styles.spinner} /> Registrando…</>
              ) : (
                'Registrarse'
              )}
            </button>
          </form>

          <p className={styles.register}>
            ¿Ya tienes cuenta? <Link to="/login" className={styles.link}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
