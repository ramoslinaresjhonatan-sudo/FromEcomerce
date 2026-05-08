import Css from './FormularioPlanes.module.css'
import planesData from './Planes.json'
import { Check, ArrowRight, Zap, Shield, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function FormularioPlanes() {
    const navigate = useNavigate();

    const handleSelectPlan = (planName) => {
        navigate('/pago', { state: { plan: planName } });
    };

    return (
        <div className={Css.page}>
            <section className={Css.titleSection}>
                <h1>Selecciona tu Plan</h1>
                <p>Potencie su negocio con nuestras soluciones personalizadas y escalables.</p>
            </section>

            <div className={Css.container}>
                {planesData?.planes?.map((plan) => (
                    <div 
                        key={plan.id} 
                        className={`${Css.card} ${plan.popular ? Css.popularCard : ''}`}
                    >
                        {plan.popular && <div className={Css.popularBadge}>MÁS ELEGIDO</div>}
                        
                        <div className={Css.cardHeader}>
                            <div className={Css.iconWrapper}>
                                {plan.nombre === 'Básico' && <Zap size={24} />}
                                {plan.nombre === 'Pro' && <Crown size={24} />}
                                {plan.nombre === 'Empresarial' && <Shield size={24} />}
                            </div>
                            <h3>Plan {plan.nombre}</h3>
                        </div>
                        
                        <div className={Css.cardBody}>
                            <div className={Css.priceContainer}>
                                <span className={Css.currency}>$</span>
                                <span className={Css.amount}>{plan.precio}</span>
                                <span className={Css.period}>/mes</span>
                            </div>
                            <p className={Css.description}>{plan.descripcion}</p>

                            <div className={Css.divider}></div>

                            <ul className={Css.featuresList}>
                                {plan.caracteristicas.map((feature, index) => (
                                    <li key={index} className={Css.featureItem}>
                                        <div className={Css.checkWrapper}>
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button 
                            className={`${Css.ctaButton} ${plan.popular ? Css.popular : ''}`}
                            onClick={() => handleSelectPlan(plan.nombre)}
                        >
                            <span>Elegir Plan {plan.nombre}</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}