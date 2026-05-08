import { useState, useEffect } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'

const API = 'http://localhost:8000/api/usuarios/'

export default function Usuarios() {
  const [items, setItems]               = useState([])
  const [search, setSearch]             = useState('')
  const [showInactive, setShowInactive] = useState(false)

  /* form */
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [apellidoM, setApellidoM] = useState('')
  const [editId, setEditId]       = useState(null)

  /* ── Fetch ── */
  const load = () => {
    const p = new URLSearchParams()
    if (search) p.set('q', search)
    fetch(`${API}?${p}`)
      .then(r => r.json())
      .then(data => setItems(data))
  }

  useEffect(() => { load() }, [search])

  /* ── Create / Update ── */
  const handleSubmit = (e) => {
    e.preventDefault()

    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (firstName && !nameRegex.test(firstName)) {
      showToast('El nombre no debe contener caracteres especiales o números.', 'error')
      return
    }
    if (lastName && !nameRegex.test(lastName)) {
      showToast('El apellido paterno no debe contener caracteres especiales o números.', 'error')
      return
    }
    if (apellidoM && !nameRegex.test(apellidoM)) {
      showToast('El apellido materno no debe contener caracteres especiales o números.', 'error')
      return
    }

    if (editId) {
      /* Update — PATCH para no requerir password */
      const body = {
        first_name: firstName,
        last_name: lastName,
        apellido_m: apellidoM,
        email,
      }
      if (password) body.password = password
      fetch(`${API}${editId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      .then(async r => {
        const data = await r.json()
        if (!r.ok) {
          const msg = data.email ? 'Este correo ya está registrado.' : JSON.stringify(data)
          throw new Error(msg)
        }
        return data
      })
      .then(() => {
        showToast('Datos de empleado actualizados', 'success');
        cancelEdit(); 
        load();
      })
      .catch(err => showToast(err.message, 'error'))
    } else {
      /* Create */
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password,
          first_name: firstName,
          last_name: lastName,
          apellido_m: apellidoM,
        })
      })
      .then(async r => {
        const data = await r.json()
        if (!r.ok) {
          const msg = data.email ? 'Este correo ya está registrado.' : JSON.stringify(data)
          throw new Error(msg)
        }
        return data
      })
      .then(() => {
        showToast('Empleado registrado exitosamente', 'success');
        cancelEdit(); 
        load();
      })
      .catch(err => showToast(err.message, 'error'))
    }
  }

  /* ── Toggle estado (is_active) ── */
  const toggleEstado = (id) => {
    fetch(`${API}${id}/toggle_estado/`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        showToast(data.is_active ? 'Empleado reactivado' : 'Empleado desactivado', 'info');
        load();
      })
      .catch(() => showToast('Error al cambiar estado', 'error'))
  }

  /* ── Delete permanente ── */
  const deletePermanent = (id, name) => {
    if (!confirm(`¿Eliminar permanentemente a "${name}"?`)) return
    fetch(`${API}${id}/`, { method: 'DELETE' })
      .then(() => {
        showToast('Empleado eliminado del sistema', 'success');
        load();
      })
      .catch(() => showToast('Error al eliminar', 'error'))
  }

  /* ── Edit ── */
  const startEdit = (u) => {
    setEditId(u.id)
    setEmail(u.email)
    setFirstName(u.first_name || '')
    setLastName(u.last_name || '')
    setApellidoM(u.apellido_m || '')
    setPassword('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setApellidoM('')
  }

  const filtered = items.filter(u => showInactive ? !u.is_active : u.is_active)

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Empleados</h1>
          <p>Añade y gestiona a las personas de tu equipo.</p>
        </div>

        {/* ── Formulario ── */}
        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Empleado' : 'Añadir Empleado'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Correo Electrónico *</label>
                <div className={Css.inputWrap}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="correo@ejemplo.com" />
                </div>
              </div>
              <div className={Css.field}>
                <label>{editId ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}</label>
                <div className={Css.inputWrap}>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editId} placeholder="••••••••" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Nombres</label>
                <div className={Css.inputWrap}>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} maxLength="100" placeholder="Juan" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Apellido Paterno</label>
                <div className={Css.inputWrap}>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} maxLength="100" placeholder="Pérez" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Apellido Materno</label>
                <div className={Css.inputWrap}>
                  <input value={apellidoM} onChange={e => setApellidoM(e.target.value)} maxLength="100" placeholder="López" />
                </div>
              </div>
            </div>
            <div className={Css.actions} style={{ marginTop: '1rem' }}>
              {editId && <button type="button" className={Css.btnReset} onClick={cancelEdit}>Cancelar</button>}
              <button type="submit" className={Css.btnSave}>{editId ? 'Actualizar' : 'Guardar Empleado'}</button>
            </div>
          </div>
        </form>

        {/* ── Lista ── */}
        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Equipo</h2>
              <button
                type="button" className={Css.btnReset}
                onClick={() => setShowInactive(!showInactive)}
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
              >
                {showInactive ? 'Ver activos' : 'Ver inactivos'}
              </button>
            </div>

            {/* Buscador */}
            <div className={Css.inputWrap} style={{ marginBottom: '1rem' }}>
              <ion-icon name="search-outline" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empleado…" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  {showInactive ? 'No hay empleados inactivos.' : 'No hay empleados.'}
                </p>
              )}
              {filtered.map(u => (
                <div
                  key={u.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px',
                    background: 'var(--surface)', opacity: u.is_active ? 1 : 0.6,
                    gap: '0.75rem', flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {u.first_name} {u.last_name}
                      {!u.is_active && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginLeft: '0.5rem' }}>Inactivo</span>}
                    </h3>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{u.email}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '20px',
                      background: 'var(--accent-soft)', color: 'var(--accent)',
                      fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize'
                    }}>
                      {u.tipo_usuario || 'usuario'}
                    </span>
                    {u.is_active && (
                      <button className={Css.btnSave} onClick={() => startEdit(u)} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>Editar</button>
                    )}
                    <button className={Css.btnReset} onClick={() => toggleEstado(u.id)} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>
                      {u.is_active ? 'Desactivar' : 'Reactivar'}
                    </button>
                    {!u.is_active && (
                      <button className={Css.btnReset} onClick={() => deletePermanent(u.id, `${u.first_name} ${u.last_name}`)} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', color: '#EF4444' }}>Eliminar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Template>
  )
}
