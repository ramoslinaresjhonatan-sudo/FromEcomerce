import { useState, useEffect } from 'react'
import Template from '../../Componentes/Template/template'
import Css from '../Configuracion/Configuracion.module.css'
import { showToast } from '../../Componentes/Toast/ToastProvider'

const API_PROD = 'http://localhost:8000/api/productos/'
const API_CAT  = 'http://localhost:8000/api/categorias/'

export default function Productos() {
  const [items, setItems]               = useState([])
  const [todasCategorias, setTodasCat]  = useState([])
  const [search, setSearch]             = useState('')
  const [showInactive, setShowInactive] = useState(false)

  /* form */
  const [nombre, setNombre]       = useState('')
  const [url, setUrl]             = useState('')
  const [precio, setPrecio]       = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [sku, setSku]             = useState('')
  const [unidadMedida, setUnidadMedida] = useState('unidad')
  const [stockInicial, setStockInicial] = useState('0')
  const [proveedor, setProveedor] = useState('')
  const [selectedCats, setSelCats]= useState([])
  const [editId, setEditId]       = useState(null)
  
  /* Image Upload states */
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews]           = useState([])
  const [existingImages, setExistingImages] = useState([])
  const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY

  /* ── Fetch ── */
  const loadProducts = () => {
    const p = new URLSearchParams()
    if (search) p.set('q', search)
    fetch(`${API_PROD}?${p}`)
      .then(r => r.json())
      .then(data => setItems(data))
  }

  const loadCats = () => {
    fetch(API_CAT).then(r => r.json()).then(setTodasCat)
  }

  useEffect(() => { loadCats() }, [])
  useEffect(() => { loadProducts() }, [search])

  const handleCatChange = (id) => {
    setSelCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => setPreviews(prev => [...prev, reader.result])
        reader.readAsDataURL(file)
      })
    }
  }

  const removePreview = (index, isExisting = false) => {
    if (isExisting) {
      setExistingImages(prev => prev.filter((_, i) => i !== index))
    } else {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index))
      setPreviews(prev => prev.filter((_, i) => i !== index))
    }
  }

  const uploadImagesToImgBB = async () => {
    const uploadedUrls = []
    
    // Upload new files
    for (const file of selectedFiles) {
      const formData = new FormData()
      formData.append('image', file)
      try {
        const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData
        })
        const data = await resp.json()
        if (data.success) {
          uploadedUrls.push(data.data.url)
        }
      } catch (err) {
        console.error("Error uploading image:", err)
      }
    }
    
    // Combine with existing images that were NOT removed
    return [...existingImages, ...uploadedUrls]
  }

  /* ── Create / Update ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      showToast('Guardando producto e imágenes...', 'info')
      const allImageUrls = await uploadImagesToImgBB()
      
      const endpoint = editId ? `${API_PROD}${editId}/` : API_PROD
      const method   = editId ? 'PUT' : 'POST'
      
      const resp = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          url: allImageUrls[0] || '', // Usamos la primera como principal
          precio: parseFloat(precio) || 0,
          descripcion,
          sku,
          unidad_medida: unidadMedida,
          stock_inicial: parseInt(stockInicial) || 0,
          proveedor,
          categorias: selectedCats,
          imagenes_urls: allImageUrls
        })
      })
      
      const data = await resp.json()
      if (!resp.ok) {
        let msg = 'Error al guardar'
        if (data.nombre) msg = 'Ya existe un producto con ese nombre.'
        else if (typeof data === 'object') msg = JSON.stringify(data)
        else msg = data
        throw new Error(msg)
      }
      
      showToast(editId ? 'Producto actualizado' : 'Producto guardado', 'success')
      cancelEdit()
      loadProducts()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  /* ── Toggle estado ── */
  const toggleEstado = (id) => {
    fetch(`${API_PROD}${id}/toggle_estado/`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        showToast(data.estado ? 'Producto reactivado' : 'Producto desactivado', 'info');
        loadProducts();
      })
      .catch(() => showToast('Error al cambiar estado', 'error'))
  }

  /* ── Delete permanente ── */
  const deletePermanent = (id, nombre) => {
    if (!confirm(`¿Eliminar permanentemente "${nombre}"?`)) return
    fetch(`${API_PROD}${id}/`, { method: 'DELETE' })
      .then(() => {
        showToast('Producto eliminado permanentemente', 'success');
        loadProducts();
      })
      .catch(() => showToast('Error al eliminar', 'error'))
  }

  const startEdit = (p) => {
    setEditId(p.id)
    setNombre(p.nombre)
    setUrl(p.url || '')
    setPrecio(String(p.precio))
    setDescripcion(p.descripcion || '')
    setSku(p.sku || '')
    setUnidadMedida(p.unidad_medida || 'unidad')
    setStockInicial(String(p.stock_inicial || 0))
    setProveedor(p.proveedor || '')
    setSelCats(p.categorias || [])
    setExistingImages(p.imagenes ? p.imagenes.map(img => img.url) : [])
    setSelectedFiles([])
    setPreviews([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setNombre('')
    setUrl('')
    setPrecio('')
    setDescripcion('')
    setSku('')
    setUnidadMedida('unidad')
    setStockInicial('0')
    setProveedor('')
    setSelCats([])
    setSelectedFiles([])
    setPreviews([])
    setExistingImages([])
  }

  const filtered = items.filter(p => showInactive ? !p.estado : p.estado)

  return (
    <Template>
      <div className={Css.page}>
        <div className={Css.header}>
          <h1>Productos</h1>
          <p>Gestiona los productos de la plataforma.</p>
        </div>

        {/* ── Formulario ── */}
        <form className={Css.card} onSubmit={handleSubmit}>
          <div className={Css.section}>
            <h2>{editId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <div className={Css.formGrid} style={{ marginTop: '1rem' }}>
              <div className={Css.field}>
                <label>Nombre *</label>
                <div className={Css.inputWrap}>
                  <input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Laptop Pro" />
                </div>
              </div>
              <div className={Css.field} style={{ gridColumn: 'span 2' }}>
                <label>Imágenes del Producto (Puedes seleccionar varias)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                  {/* Existentes */}
                  {existingImages.map((img, idx) => (
                    <div key={`ex-${idx}`} style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <img src={img} alt="existente" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                      <button 
                        type="button" 
                        onClick={() => removePreview(idx, true)}
                        style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}
                      >✕</button>
                    </div>
                  ))}
                  
                  {/* Nuevas previsualizaciones */}
                  {previews.map((img, idx) => (
                    <div key={`pre-${idx}`} style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--app-primary)' }} />
                      <button 
                        type="button" 
                        onClick={() => removePreview(idx)}
                        style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}
                      >✕</button>
                    </div>
                  ))}

                  {/* Botón de añadir */}
                  <div 
                    onClick={() => document.getElementById('fileInput').click()}
                    style={{
                      width: '100px', height: '100px', borderRadius: '12px',
                      border: '2px dashed rgba(255,255,255,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', background: 'rgba(255,255,255,0.05)',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{ textAlign: 'center', color: 'var(--text-hint)' }}>
                      <ion-icon name="add-outline" style={{ fontSize: '1.5rem' }} />
                      <div style={{ fontSize: '0.7rem' }}>Añadir</div>
                    </div>
                  </div>
                </div>

                <input 
                  id="fileInput"
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handleFileChange} 
                  style={{ display: 'none' }}
                />
                
                <div className={Css.inputWrap} style={{ marginTop: '1rem' }}>
                  <input 
                    value={url} 
                    onChange={e => setUrl(e.target.value)} 
                    placeholder="O pega una URL externa para añadir a la lista..." 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (url) {
                          setExistingImages(prev => [...prev, url])
                          setUrl('')
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div className={Css.field}>
                <label>Precio *</label>
                <div className={Css.inputWrap}>
                  <input type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} required placeholder="0.00" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Stock Inicial</label>
                <div className={Css.inputWrap}>
                  <input type="number" value={stockInicial} onChange={e => setStockInicial(e.target.value)} placeholder="0" min="0" />
                </div>
              </div>
              <div className={Css.field}>
                <label>SKU</label>
                <div className={Css.inputWrap}>
                  <input value={sku} onChange={e => setSku(e.target.value)} placeholder="Ej: PROD-001" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Unidad de Medida</label>
                <div className={Css.inputWrap}>
                  <input value={unidadMedida} onChange={e => setUnidadMedida(e.target.value)} placeholder="Ej: unidad, kg, litro" />
                </div>
              </div>
              <div className={Css.field}>
                <label>Proveedor</label>
                <div className={Css.inputWrap}>
                  <input value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="Nombre del proveedor" />
                </div>
              </div>
              <div className={Css.field} style={{ gridColumn: 'span 2' }}>
                <label>Descripción</label>
                <div className={Css.inputWrap}>
                  <textarea 
                    value={descripcion} 
                    onChange={e => setDescripcion(e.target.value)} 
                    placeholder="Descripción detallada del producto..."
                    style={{ minHeight: '80px', padding: '0.8rem', width: '100%', background: 'none', border: 'none', color: 'inherit', outline: 'none', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Categorías selector */}
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Categorías</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {todasCategorias.filter(c => c.estado).map(cat => {
                  const sel = selectedCats.includes(cat.id)
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleCatChange(cat.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: sel ? 'rgba(var(--app-primary-rgb, 249,115,22), 0.5)' : 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        padding: '0.5rem 1rem',
                        borderRadius: '25px 25px 25px 8px',
                        border: '1px solid rgba(255,255,255,0.6)',
                        borderBottomColor: 'rgba(255,255,255,0.2)', borderRightColor: 'rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        color: sel ? '#000' : 'var(--text-primary)',
                        fontWeight: sel ? 'bold' : 600,
                        fontSize: '0.85rem',
                        boxShadow: sel
                          ? 'inset 3px 3px 6px rgba(255,255,255,0.9), inset -3px -3px 6px rgba(0,0,0,0.2), 0 6px 12px rgba(var(--app-primary-rgb),0.3)'
                          : 'inset 2px 2px 4px rgba(255,255,255,0.7), inset -2px -2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.3s', userSelect: 'none',
                        transform: sel ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      {cat.nombre}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={Css.actions} style={{ marginTop: '1rem' }}>
              {editId && <button type="button" className={Css.btnReset} onClick={cancelEdit}>Cancelar</button>}
              <button type="submit" className={Css.btnSave}>{editId ? 'Actualizar' : 'Guardar Producto'}</button>
            </div>
          </div>
        </form>

        {/* ── Lista ── */}
        <div className={Css.card} style={{ marginTop: '1.5rem' }}>
          <div className={Css.section}>
            <div className={Css.sectionHeader}>
              <h2>Lista de Productos</h2>
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto…" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.length === 0 && (
                <p style={{ color: 'var(--text-hint)', textAlign: 'center', padding: '2rem 0' }}>
                  {showInactive ? 'No hay productos inactivos.' : 'No hay productos registrados.'}
                </p>
              )}
              {filtered.map(prod => (
                <div
                  key={prod.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px',
                    background: 'var(--surface)', opacity: prod.estado ? 1 : 0.6,
                    flexWrap: 'wrap',
                  }}
                >
                  {prod.url && (
                    <img src={prod.url} alt={prod.nombre} style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {prod.nombre}
                      {!prod.estado && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginLeft: '0.5rem' }}>Inactivo</span>}
                    </h3>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.9rem', color: 'var(--app-primary)', fontWeight: 'bold' }}>Bs. {prod.precio}</p>
                    {prod.categorias && prod.categorias.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        {prod.categorias.map(catId => {
                          const c = todasCategorias.find(x => x.id === catId)
                          return c ? (
                            <span key={c.id} style={{ fontSize: '0.72rem', background: 'rgba(var(--app-primary-rgb),0.15)', color: 'var(--app-primary)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{c.nombre}</span>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    {prod.estado && (
                      <button className={Css.btnSave} onClick={() => startEdit(prod)} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>Editar</button>
                    )}
                    <button className={Css.btnReset} onClick={() => toggleEstado(prod.id)} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}>
                      {prod.estado ? 'Desactivar' : 'Reactivar'}
                    </button>
                    {!prod.estado && (
                      <button className={Css.btnReset} onClick={() => deletePermanent(prod.id, prod.nombre)} style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', color: '#EF4444' }}>Eliminar</button>
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
