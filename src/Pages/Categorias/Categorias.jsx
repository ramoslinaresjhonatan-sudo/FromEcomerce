import { useEffect, useMemo, useState } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api, { authService } from '../../services/api'
import { getCurrentCompanyId, getCurrentStoreId, isStoreAdmin } from '../../utils/access'

const INITIAL_FORM = {
  store: '',
  name: '',
  description: '',
  status: 'ACTIVE',
}

export default function Categorias() {
  const [items, setItems] = useState([])
  const [stores, setStores] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  const user = authService.getUser()
  const storeAdminView = isStoreAdmin(user)
  const userId = user?.id
  const currentCompanyId = String(getCurrentCompanyId(user) || '')
  const initialStoreId = String(getCurrentStoreId(user) || '')
  const [activeStoreId, setActiveStoreId] = useState(initialStoreId)

  const syncUserStore = async (storeId) => {
    if (!userId) return

    await api.patch(`/usuarios/${userId}/`, {
      current_store: storeId ? Number(storeId) : null,
      store: storeId ? Number(storeId) : null,
      current_company: currentCompanyId ? Number(currentCompanyId) : null,
      company: currentCompanyId ? Number(currentCompanyId) : null,
    })

    const nextUser = {
      ...authService.getUser(),
      current_store: storeId ? Number(storeId) : null,
      store: storeId ? Number(storeId) : null,
      current_company: currentCompanyId ? Number(currentCompanyId) : null,
      company: currentCompanyId ? Number(currentCompanyId) : null,
    }

    localStorage.setItem('user', JSON.stringify(nextUser))
  }

  const loadStores = async () => {
    try {
      const resp = await api.get('/stores/')
      const records = Array.isArray(resp.data) ? resp.data : []
      const available = storeAdminView
        ? records.filter((store) => String(store.company) === currentCompanyId)
        : records
      setStores(available)
    } catch {
      setStores([])
      showToast('No se pudieron cargar las tiendas.', 'error')
    }
  }

  const loadCategories = async () => {
    setLoading(true)
    try {
      const resp = await api.get('/categorias/', { params: { q: search || undefined } })
      const records = Array.isArray(resp.data) ? resp.data : []
      setItems(records)
    } catch {
      setItems([])
      showToast('No se pudieron cargar las categorías.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [])

  useEffect(() => {
    if (!storeAdminView) return

    setForm((prev) => {
      const nextStore = activeStoreId
      if (prev.store === nextStore) return prev
      return { ...prev, store: nextStore }
    })
  }, [storeAdminView, activeStoreId])

  useEffect(() => {
    loadCategories()
  }, [search, activeStoreId])

  const selectedStoreId = storeAdminView ? activeStoreId : form.store

  const visibleItems = useMemo(() => {
    if (!selectedStoreId) return items
    return items.filter((item) => String(item.store) === String(selectedStoreId))
  }, [items, selectedStoreId])

  const handleChange = async (event) => {
    const { name, value } = event.target

    if (name === 'store') {
      setForm((prev) => ({ ...prev, store: value }))
      if (storeAdminView) {
        try {
          setActiveStoreId(value)
          await syncUserStore(value)
          loadCategories()
        } catch {
          showToast('No se pudo cambiar la tienda activa.', 'error')
        }
      }
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const storeId = storeAdminView ? activeStoreId : form.store
    if (!storeId || !form.name.trim()) {
      showToast('Debes seleccionar una tienda y escribir el nombre de la categoría.', 'error')
      return
    }

    const payload = {
      store: Number(storeId),
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status,
    }

    try {
      const endpoint = editId ? `/categorias/${editId}/` : '/categorias/'
      const method = editId ? 'put' : 'post'
      await api[method](endpoint, payload)
      showToast(editId ? 'Categoría actualizada.' : 'Categoría creada.', 'success')
      cancelEdit()
      loadCategories()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    }
  }

  const startEdit = (item) => {
    setEditId(item.id)
    setForm({
      store: item.store ? String(item.store) : '',
      name: item.name || '',
      description: item.description || '',
      status: item.status || 'ACTIVE',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setForm({
      ...INITIAL_FORM,
      store: storeAdminView ? activeStoreId : '',
    })
  }

  const removeItem = async (item) => {
    if (!confirm(`¿Eliminar la categoría "${item.name}"?`)) return
    try {
      await api.delete(`/categorias/${item.id}/`)
      showToast('Categoría eliminada.', 'success')
      loadCategories()
    } catch {
      showToast('No se pudo eliminar la categoría.', 'error')
    }
  }

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Categorías</h1>
          <p>
            {storeAdminView
              ? 'Gestiona categorías separadas por cada tienda de tu empresa.'
              : 'Gestiona categorías por tienda dentro de la plataforma.'}
          </p>
        </div>

        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Tienda *</label>
                <div className={Css.inputWrap}>
                  <select name="store" value={storeAdminView ? activeStoreId : form.store} onChange={handleChange} required>
                    <option value="">Seleccionar tienda</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={Css.field}>
                <label>Estado</label>
                <div className={Css.inputWrap}>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="ACTIVE">Activa</option>
                    <option value="INACTIVE">Inactiva</option>
                  </select>
                </div>
              </div>

              <div className={Css.field}>
                <label>Nombre *</label>
                <div className={Css.inputWrap}>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="Ej: Electrónica" />
                </div>
              </div>

              <div className={Css.field}>
                <label>Descripción</label>
                <div className={Css.inputWrap}>
                  <input name="description" value={form.description} onChange={handleChange} placeholder="Descripción breve" />
                </div>
              </div>
            </div>

            <div className={Css.actions} style={{ marginTop: '1rem' }}>
              {editId && <button type="button" className={Css.btnReset} onClick={cancelEdit}>Cancelar</button>}
              <button type="submit" className={Css.btnSave}>{editId ? 'Actualizar Categoría' : 'Guardar Categoría'}</button>
            </div>
          </div>
        </form>

        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Lista de Categorías</h2>
            </div>

            <div className={Css.inputWrap} style={{ marginBottom: '1rem' }}>
              <ion-icon name="search-outline" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar categoría..." />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!loading && visibleItems.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  No hay categorías registradas para esta tienda.
                </p>
              )}

              {visibleItems.map((item) => {
                const store = stores.find((entry) => String(entry.id) === String(item.store))
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      background: 'var(--surface)',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {item.name}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Tienda: {store?.name || '—'} · Estado: {item.status}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                        {item.description || 'Sin descripción'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                      <button type="button" className={Css.btnSave} onClick={() => startEdit(item)} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>
                        Editar
                      </button>
                      <button type="button" className={Css.btnReset} onClick={() => removeItem(item)} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', color: '#EF4444' }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Template>
  )
}
