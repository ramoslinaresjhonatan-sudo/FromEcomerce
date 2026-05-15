import { useEffect, useMemo, useState } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'
import api, { authService } from '../../services/api'
import axios from 'axios'
import { getCurrentCompanyId, getCurrentStoreId, isStoreAdmin } from '../../utils/access'

const INITIAL_FORM = {
  store: '',
  category: '',
  name: '',
  description: '',
  sku: '',
  barcode: '',
  sale_price: '',
  unit_of_measure: 'UNIT',
  status: 'ACTIVE',
  image_url: '',
}

const unitOptions = ['UNIT', 'KG', 'LITER', 'BOX', 'PACK']

export default function Productos() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [stores, setStores] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [uploading, setUploading] = useState(false)

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
    try {
      const resp = await api.get('/categorias/')
      setCategories(Array.isArray(resp.data) ? resp.data : [])
    } catch {
      setCategories([])
      showToast('No se pudieron cargar las categorías.', 'error')
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const resp = await api.get('/productos/', { params: { q: search || undefined } })
      setItems(Array.isArray(resp.data) ? resp.data : [])
    } catch {
      setItems([])
      showToast('No se pudieron cargar los productos.', 'error')
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
      if (prev.store === activeStoreId) return prev
      return { ...prev, store: activeStoreId, category: '' }
    })
  }, [storeAdminView, activeStoreId])

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [search, activeStoreId])

  const selectedStoreId = storeAdminView ? activeStoreId : form.store

  const visibleCategories = useMemo(() => {
    if (!selectedStoreId) return categories
    return categories.filter((item) => String(item.store) === String(selectedStoreId))
  }, [categories, selectedStoreId])

  const visibleItems = useMemo(() => {
    if (!selectedStoreId) return items
    return items.filter((item) => String(item.store) === String(selectedStoreId))
  }, [items, selectedStoreId])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const handleChange = async (event) => {
    const { name, value } = event.target

    if (name === 'store') {
      setForm((prev) => ({ ...prev, store: value, category: '' }))
      if (storeAdminView) {
        try {
          setActiveStoreId(value)
          await syncUserStore(value)
          loadCategories()
          loadProducts()
        } catch {
          showToast('No se pudo cambiar la tienda activa.', 'error')
        }
      }
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const uploadImage = async () => {
    if (!selectedFile) return form.image_url.trim() || null

    const formData = new FormData()
    formData.append('image', selectedFile)
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY
    const resp = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData)
    return resp.data?.success ? resp.data.data.url : null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const storeId = storeAdminView ? activeStoreId : form.store
    if (!storeId || !form.category || !form.name.trim() || !form.sku.trim() || !form.sale_price) {
      showToast('Tienda, categoría, nombre, SKU y precio son obligatorios.', 'error')
      return
    }

    setUploading(true)
    try {
      const imageUrl = await uploadImage()
      const payload = {
        store: Number(storeId),
        category: Number(form.category),
        name: form.name.trim(),
        description: form.description.trim() || null,
        sku: form.sku.trim(),
        barcode: form.barcode.trim() || null,
        sale_price: Number(form.sale_price),
        unit_of_measure: form.unit_of_measure,
        status: form.status,
        image_url: imageUrl,
      }

      const endpoint = editId ? `/productos/${editId}/` : '/productos/'
      const method = editId ? 'put' : 'post'
      await api[method](endpoint, payload)
      showToast(editId ? 'Producto actualizado.' : 'Producto creado.', 'success')
      cancelEdit()
      loadProducts()
    } catch (err) {
      showToast(err.response?.data ? JSON.stringify(err.response.data) : err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const startEdit = (item) => {
    setEditId(item.id)
    setForm({
      store: item.store ? String(item.store) : '',
      category: item.category ? String(item.category) : '',
      name: item.name || '',
      description: item.description || '',
      sku: item.sku || '',
      barcode: item.barcode || '',
      sale_price: item.sale_price ?? '',
      unit_of_measure: item.unit_of_measure || 'UNIT',
      status: item.status || 'ACTIVE',
      image_url: item.image_url || '',
    })
    setPreview(item.image_url || '')
    setSelectedFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setForm({
      ...INITIAL_FORM,
      store: storeAdminView ? activeStoreId : '',
    })
    setPreview('')
    setSelectedFile(null)
  }

  const removeItem = async (item) => {
    if (!confirm(`¿Eliminar el producto "${item.name}"?`)) return
    try {
      await api.delete(`/productos/${item.id}/`)
      showToast('Producto eliminado.', 'success')
      loadProducts()
    } catch {
      showToast('No se pudo eliminar el producto.', 'error')
    }
  }

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Productos</h1>
          <p>
            {storeAdminView
              ? 'Gestiona productos separados por cada tienda que configures en tu empresa.'
              : 'Gestiona productos por tienda dentro de la plataforma.'}
          </p>
        </div>

        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
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
                <label>Categoría *</label>
                <div className={Css.inputWrap}>
                  <select name="category" value={form.category} onChange={handleChange} required>
                    <option value="">Seleccionar categoría</option>
                    {visibleCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={Css.field}>
                <label>Nombre *</label>
                <div className={Css.inputWrap}>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="Ej: Laptop Pro" />
                </div>
              </div>

              <div className={Css.field}>
                <label>SKU *</label>
                <div className={Css.inputWrap}>
                  <input name="sku" value={form.sku} onChange={handleChange} required placeholder="PROD-001" />
                </div>
              </div>

              <div className={Css.field}>
                <label>Código de barras</label>
                <div className={Css.inputWrap}>
                  <input name="barcode" value={form.barcode} onChange={handleChange} placeholder="Opcional" />
                </div>
              </div>

              <div className={Css.field}>
                <label>Precio de venta *</label>
                <div className={Css.inputWrap}>
                  <input name="sale_price" type="number" step="0.01" min="0" value={form.sale_price} onChange={handleChange} required placeholder="0.00" />
                </div>
              </div>

              <div className={Css.field}>
                <label>Unidad de medida</label>
                <div className={Css.inputWrap}>
                  <select name="unit_of_measure" value={form.unit_of_measure} onChange={handleChange}>
                    {unitOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={Css.field}>
                <label>Estado</label>
                <div className={Css.inputWrap}>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="DISCONTINUED">Descontinuado</option>
                  </select>
                </div>
              </div>

              <div className={Css.field}>
                <label>Imagen</label>
                <div className={Css.inputWrap}>
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>

              <div className={Css.field} style={{ gridColumn: '1 / -1' }}>
                <label>Descripción</label>
                <div className={Css.inputWrap}>
                  <input name="description" value={form.description} onChange={handleChange} placeholder="Descripción del producto" />
                </div>
              </div>
            </div>

            {preview && (
              <div style={{ marginTop: '1rem' }}>
                <img src={preview} alt="preview" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border)' }} />
              </div>
            )}

            <div className={Css.actions} style={{ marginTop: '1rem' }}>
              {editId && <button type="button" className={Css.btnReset} onClick={cancelEdit}>Cancelar</button>}
              <button type="submit" className={Css.btnSave} disabled={uploading}>
                {uploading ? 'Guardando...' : editId ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
            </div>
          </div>
        </form>

        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Lista de Productos</h2>
            </div>

            <div className={Css.inputWrap} style={{ marginBottom: '1rem' }}>
              <ion-icon name="search-outline" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto..." />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!loading && visibleItems.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  No hay productos registrados para esta tienda.
                </p>
              )}

              {visibleItems.map((item) => {
                const store = stores.find((entry) => String(entry.id) === String(item.store))
                const category = categories.find((entry) => String(entry.id) === String(item.category))

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
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: '240px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#9ca3af' }}>
                            N/A
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{item.name}</h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Tienda: {store?.name || '—'} · Categoría: {category?.name || '—'} · SKU: {item.sku}
                        </p>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-hint)' }}>
                          Precio: Bs. {item.sale_price} · Unidad: {item.unit_of_measure} · Estado: {item.status}
                        </p>
                      </div>
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
