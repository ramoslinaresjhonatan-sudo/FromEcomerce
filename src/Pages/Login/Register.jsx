import styles from '../Login/Login.module.css'
import { ShoppingBag, Mail, Lock, User, Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/api'

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    apellido_m: '',
    email: '',
    password: '',
    tienda_nombre: '',
    tienda_nit: '',
    tienda_nro_corporativo: '',
    tienda_direccion: '',
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
      await authService.register(formData)
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
            <ShoppingBag size={28} />
            <span>EcomSaaS</span>
          </div>
          <h2>Únete a la red de empleados más grande</h2>
          <p>Gestiona tu trabajo de forma eficiente y profesional.</p>
          <div className={styles.stats}>
            <div><strong>Gratis</strong><span>Registro de empleado</span></div>
            <div><strong>24/7</strong><span>Soporte</span></div>
          </div>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formBox}>
          <h1>Crea tu cuenta gratis</h1>
          <p className={styles.subtitle}>Regístrate como administrador para comenzar</p>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Nombre</label>
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

            <div className={styles.row}>
              <div className={styles.field} style={{flex: 1}}>
                <label>Apellido P.</label>
                <div className={styles.inputWrapper}>
                  <input
                    name="last_name"
                    type="text"
                    placeholder="Pérez"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className={styles.field} style={{flex: 1}}>
                <label>Apellido M.</label>
                <div className={styles.inputWrapper}>
                  <input
                    name="apellido_m"
                    type="text"
                    placeholder="García"
                    value={formData.apellido_m}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field} style={{flex: 1}}>
                <label>Nombre de la Tienda</label>
                <div className={styles.inputWrapper}>
                  <ShoppingBag size={16} className={styles.icon} />
                  <input
                    name="tienda_nombre"
                    type="text"
                    placeholder="Mi Tienda SA"
                    value={formData.tienda_nombre}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className={styles.field} style={{flex: 1}}>
                <label>NIT Tienda</label>
                <div className={styles.inputWrapper}>
                  <input
                    name="tienda_nit"
                    type="text"
                    placeholder="123456789"
                    value={formData.tienda_nit}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field} style={{flex: 1}}>
                <label>Nro. Corporativo</label>
                <div className={styles.inputWrapper}>
                  <input
                    name="tienda_nro_corporativo"
                    type="text"
                    placeholder="+1 234 567 890"
                    value={formData.tienda_nro_corporativo}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className={styles.field} style={{flex: 1}}>
                <label>Dirección Tienda</label>
                <div className={styles.inputWrapper}>
                  <input
                    name="tienda_direccion"
                    type="text"
                    placeholder="Av. Principal #123"
                    value={formData.tienda_direccion}
                    onChange={handleChange}
                  />
                </div>
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
