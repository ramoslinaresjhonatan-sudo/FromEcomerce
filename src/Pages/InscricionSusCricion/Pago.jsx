import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, User, Mail, Phone, MapPin, Globe, FastForward } from 'lucide-react'
import Css from './Pago.module.css'

const Pago = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const planSeccionado = location.state?.plan || "Básico"
    
    // Obtener precio basado en el plan (esto podría venir de un estado global o del JSON directo)
    const precios = { "Básico": 19, "Pro": 49, "Empresarial": 99 }
    const precio = precios[planSeccionado] || 19

    const handleSubmit = (e) => {
        e.preventDefault()
        alert('Pago procesado correctamente. ¡Bienvenido!')
        navigate('/')
    }

    return (
        <div className={Css.page}>
            <div className={Css.container}>
                {/* Panel Izquierdo: Resumen */}
                <div className={Css.summaryPanel}>
                    <div className={Css.summaryHeader}>
                        <button onClick={() => navigate(-1)} className={Css.backBtn}>
                            <ArrowLeft size={16} /> Volver
                        </button>
                        <h2>Resumen</h2>
                        <p>Detalles de tu nueva suscripción</p>
                    </div>

                    <div className={Css.planCard}>
                        <span className={Css.planText}>Plan suscrito</span>
                        <span className={Css.planName}>{planSeccionado}</span>
                        <div className={Css.planLine}></div>
                        <p className={Css.planDesc}>Facturación mensual recurrente</p>
                    </div>

                    <div className={Css.totalRow}>
                        <span className={Css.totalLabel}>Total a pagar</span>
                        <span className={Css.totalAmount}>${precio}.00</span>
                    </div>

                    <div className={Css.trustBadge}>
                        <ShieldCheck size={18} color="var(--orange)" /> 
                        <span>Conexión cifrada de extremo a extremo</span>
                    </div>
                </div>

                {/* Panel Derecho: Formulario */}
                <div className={Css.formPanel}>
                    <form onSubmit={handleSubmit} className={Css.formGrid}>
                        <h3 className={Css.fullWidth}>Información Personal</h3>
                        
                        <div className={Css.inputGroup}>
                            <label><User size={12} /> Nombre</label>
                            <input type="text" placeholder='Ej: Juan' required />
                        </div>
                        
                        <div className={Css.inputGroup}>
                            <label>Apellido</label>
                            <input type="text" placeholder='Ej: Pérez' required />
                        </div>

                        <div className={`${Css.inputGroup} ${Css.fullWidth}`}>
                            <label><Mail size={12} /> Correo Electrónico</label>
                            <input type="email" placeholder='juan@correo.com' required />
                        </div>

                        <div className={Css.inputGroup}>
                            <label><Phone size={12} /> Teléfono</label>
                            <input type="text" placeholder='+51 900...' />
                        </div>

                        <div className={Css.inputGroup}>
                            <label><MapPin size={12} /> Código Postal</label>
                            <input type="text" placeholder='15001' />
                        </div>

                        <h3 className={`${Css.fullWidth} ${Css.spacingTop}`}>Dirección de Envío</h3>

                        <div className={`${Css.inputGroup} ${Css.fullWidth}`}>
                            <label>Dirección</label>
                            <input type="text" placeholder='Av. Siempreviva 123' required />
                        </div>

                        <div className={Css.inputGroup}>
                            <label><Globe size={12} /> Ciudad</label>
                            <input type="text" placeholder='Lima' required />
                        </div>

                        <div className={Css.inputGroup}>
                            <label>País</label>
                            <input type="text" placeholder='Perú' required />
                        </div>

                        <h3 className={`${Css.fullWidth} ${Css.spacingTop}`}>Detalles de Pago</h3>

                        <div className={`${Css.inputGroup} ${Css.fullWidth}`}>
                            <label><CreditCard size={12} /> Número de Tarjeta</label>
                            <div className={Css.cardInputWrapper}>
                                <input type="text" placeholder='0000 0000 0000 0000' required />
                            </div>
                        </div>

                        <div className={Css.inputGroup}>
                            <label>Vencimiento</label>
                            <input type="text" placeholder='MM/YY' required />
                        </div>

                        <div className={Css.inputGroup}>
                            <label>CVV</label>
                            <input type="password" placeholder='***' required maxLength="4" />
                        </div>

                        <button type='submit' className={`${Css.submitBtn} ${Css.fullWidth}`}>
                            <FastForward size={16} /> Confirmar Pago de ${precio}.00
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

// Icono auxiliar local para no fallar si faltan imports
const ShieldCheck = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
)

export default Pago