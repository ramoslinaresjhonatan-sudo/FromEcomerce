import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useCart } from '../CartContext';
import Carrito from '../Carrito/Carrito';
import './Tienda.css';

import heroImg from '../../../assets/tienda/hero_furniture.png';
import armchairImg from '../../../assets/tienda/armchair_gray.png';
import sofaImg from '../../../assets/tienda/sofa_gray.png';
import sideTableImg from '../../../assets/tienda/side_table.png';
import diningChairImg from '../../../assets/tienda/dining_chair.png';
import livingRoomImg from '../../../assets/tienda/living_room.png';

const fallbackImages = [armchairImg, sofaImg, sideTableImg, diningChairImg];

const StarIcon = () => (
  <svg viewBox="0 0 20 20"><path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" /></svg>
);
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
);
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);

const ProductCard = ({ prod, idx, addItem, getProductImage, onQuickView }) => {
  const [activeImg, setActiveImg] = useState(null);

  // Extraemos las URLs de la relación 'imagenes' o usamos la URL principal
  const images = (prod.imagenes && prod.imagenes.length > 0)
    ? prod.imagenes.map(img => img.url)
    : [prod.url || getProductImage(prod, idx)];

  const handleOpen = (e) => {
    e.stopPropagation();
    console.log('Abriendo producto:', prod.nombre, 'Imágenes:', images.length);
    onQuickView(prod);
  };

  return (
    <div className="product-card" onClick={handleOpen}>
      <div className="product-img-wrap">
        {idx % 3 === 0 && <span className="product-tag tag-new">NUEVO</span>}
        {idx % 5 === 0 && idx !== 0 && <span className="product-tag tag-sale">-20%</span>}
        <img src={activeImg || images[0]} alt={prod.nombre} />

        <div className="product-actions">
          <button title="Favorito" onClick={e => e.stopPropagation()}><HeartIcon /></button>
          <button title="Vista rápida" onClick={handleOpen}><EyeIcon /></button>
          <button title="Agregar al carrito" onClick={e => { e.stopPropagation(); addItem(prod); }}><CartIcon /></button>
        </div>

        {/* Gallery Dots - Siempre visibles si hay más de una */}
        {images.length > 1 && (
          <div className="product-gallery-dots" onClick={e => e.stopPropagation()}>
            {images.slice(0, 5).map((img, i) => (
              <span
                key={i}
                className={(activeImg === img || (!activeImg && i === 0)) ? 'active' : ''}
                onMouseEnter={() => setActiveImg(img)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="product-info">
        <div className="product-stars">
          {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
        </div>
        <h4>{prod.nombre}</h4>
        <div className="product-price">
          <span className="current">${Number(prod.precio).toFixed(2)}</span>
          {idx % 5 === 0 && idx !== 0 && (
            <span className="old">${(Number(prod.precio) * 1.25).toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickViewModal = ({ prod, onClose, addItem }) => {
  const [activeImg, setActiveImg] = useState(0);

  if (!prod) return null;

  const images = (prod.imagenes && prod.imagenes.length > 0)
    ? prod.imagenes.map(img => img.url)
    : [prod.url || fallbackImages[0]];

  return (
    <div className="qv-overlay" onClick={onClose} style={{ display: 'flex' }}>
      <div className="qv-content" onClick={e => e.stopPropagation()}>
        <button className="qv-close" onClick={onClose}>✕</button>
        <div className="qv-grid">
          <div className="qv-gallery">
            <div className="qv-main-img">
              <img src={images[activeImg] || prod.url} alt={prod.nombre} />
            </div>
            {images.length > 1 && (
              <div className="qv-thumbnails">
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    className={activeImg === i ? 'active' : ''}
                    onClick={() => setActiveImg(i)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="qv-details">
            <div className="qv-stars">
              {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
              <span>(12 reseñas)</span>
            </div>
            <h2>{prod.nombre}</h2>
            <div className="qv-price">
              <span className="current">${Number(prod.precio).toFixed(2)}</span>
            </div>
            <p className="qv-desc">
              {prod.descripcion || 'Sin descripción disponible para este producto.'}
            </p>

            <div className="qv-meta">
              <p><strong>Disponibilidad:</strong> En stock</p>
              <p><strong>Categoría:</strong> Mobiliario Premium</p>
            </div>

            <button className="qv-add-btn" onClick={() => { addItem(prod); onClose(); }}>
              <CartIcon /> Agregar al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Tienda = () => {
  const navigate = useNavigate();
  const { addItem, openCart, totalItems } = useCart();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [heroSlide, setHeroSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [countdown, setCountdown] = useState({ d: 654, h: 8, m: 23, s: 10 });

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(prev => {
        let { d, h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; d--; }
        if (d < 0) return prev;
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    console.log('Iniciando carga de datos...');
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/productos/', { params: { estado: 'true', q: busqueda || undefined } }),
        api.get('/categorias/', { params: { estado: 'true' } }),
      ]);
      const fetchedProds = (prodRes.data.results || prodRes.data || []).filter(p => p && p.id);
      const fetchedCats = (catRes.data.results || catRes.data || []).filter(c => c && c.id);

      console.log('Productos cargados (válidos):', fetchedProds.length);
      console.log('Categorías cargadas (válidas):', fetchedCats.length);

      setProductos(fetchedProds);
      setCategorias(fetchedCats);
    } catch (err) {
      console.error('Error al cargar datos de la tienda:', err);
      setProductos([]);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }, [busqueda]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const productosFiltrados = filtro === 'todos'
    ? productos
    : productos.filter(p => {
      if (!p.categorias) return false;
      return p.categorias.some(c => {
        const catId = typeof c === 'object' ? c.id : c;
        return Number(catId) === Number(filtro);
      });
    });

  const getProductImage = (prod, idx) => {
    if (prod.url) return prod.url;
    return fallbackImages[idx % fallbackImages.length];
  };

  const getCategoryImage = (cat, idx) => {
    if (!cat || !cat.imagen_url) return fallbackImages[idx % fallbackImages.length];
    return cat.imagen_url;
  };

  return (
    <div className="tienda-page">
      {/* ── NAVBAR ── */}
      <nav className="store-navbar">
        <a href="/Tienda" className="store-logo">
          <span className="logo-dot"></span> DAVICI
        </a>
        <ul className="nav-links">
          <li><a href="/Tienda" className="active">Inicio</a></li>
          <li><a href="#categorias">Tienda</a></li>
          <li><a href="#productos">Productos</a></li>
          <li><a href="#newsletter">Contacto</a></li>
        </ul>
        <div className="nav-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="nav-actions">
          <button onClick={() => navigate('/login')} title="Mi cuenta">
            <UserIcon />
          </button>
          <button title="Carrito" onClick={openCart}>
            <CartIcon />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="store-hero">
        <div className="hero-content">
          <span className="hero-badge">Nuevos Productos</span>
          <p className="hero-subtitle">Colección Primavera 2026</p>
          <h1 className="hero-title">
            Spring<br /><span>Collection</span>
          </h1>
          <a href="#productos" className="hero-btn">
            Comprar Ahora <ArrowIcon />
          </a>
          <div className="hero-dots">
            {[0, 1, 2].map(i => (
              <span key={i} className={heroSlide === i ? 'active' : ''} onClick={() => setHeroSlide(i)} />
            ))}
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-circle"></div>
          <img src={heroImg} alt="Spring Collection" />
        </div>
        <span className="hero-number">0{heroSlide + 1}</span>
      </section>

      {/* ── CATEGORÍAS ── */}
      <section className="store-categories" id="categorias">
        <div className="section-header">
          <h2>Compra por<br />Categorías</h2>
          <a href="#categorias">Ver todas <ArrowIcon /></a>
        </div>
        <div className="categories-grid">
          {categorias.length > 0 ? categorias.map((cat, idx) => (
            <div className="category-card" key={cat.id} onClick={() => setFiltro(String(cat.id))}>
              <img src={getCategoryImage(cat, idx)} alt={cat.nombre} />
              <h3>{cat.nombre}</h3>
            </div>
          )) : (
            <p className="no-data-msg">No hay categorías disponibles en este momento.</p>
          )}
        </div>
      </section>

      {/* ── ROOM BANNERS ── */}
      <section className="store-rooms">
        <div className="room-card">
          <img src={livingRoomImg} alt="Sala de estar" />
          <div className="room-overlay">
            <h3>Sala de Estar</h3>
            <button className="room-btn">Ver más <ArrowIcon /></button>
          </div>
        </div>
        <div className="room-card">
          <img src={livingRoomImg} alt="Comedor" />
          <div className="room-overlay">
            <h3>Comedor</h3>
            <button className="room-btn">Ver más <ArrowIcon /></button>
          </div>
        </div>
      </section>

      {/* ── PRODUCTOS ── */}
      <section className="store-hot" id="productos">
        <div className="section-header">
          <h2>Productos Destacados</h2>
          <div className="filter-tabs">
            <button className={filtro === 'todos' ? 'active' : ''} onClick={() => setFiltro('todos')}>
              Todos
            </button>
            {categorias.slice(0, 4).map(cat => (
              <button
                key={cat.id}
                className={filtro === String(cat.id) ? 'active' : ''}
                onClick={() => setFiltro(String(cat.id))}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="store-loading"><div className="spinner"></div></div>
        ) : (
          <div className="products-grid">
            {(productosFiltrados.length > 0 ? productosFiltrados : productos).map((prod, idx) => (
              <ProductCard
                key={prod.id}
                prod={prod}
                idx={idx}
                addItem={addItem}
                getProductImage={getProductImage}
                onQuickView={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── COUNTDOWN ── */}
      <div className="countdown-banner">
        <div className="countdown-text">
          <h3>Ofertas Especiales de Temporada</h3>
          <p>No te pierdas nuestros descuentos exclusivos</p>
        </div>
        <div className="countdown-timer">
          <div className="time-box"><span className="num">{countdown.d}</span><span className="label">Días</span></div>
          <div className="time-box"><span className="num">{String(countdown.h).padStart(2, '0')}</span><span className="label">Hrs</span></div>
          <div className="time-box"><span className="num">{String(countdown.m).padStart(2, '0')}</span><span className="label">Min</span></div>
          <div className="time-box"><span className="num">{String(countdown.s).padStart(2, '0')}</span><span className="label">Seg</span></div>
        </div>
      </div>

      {/* ── NEWSLETTER ── */}
      <section className="store-newsletter" id="newsletter">
        <h2>Suscríbete a Nuestro Newsletter</h2>
        <p>Recibe las últimas novedades y ofertas exclusivas directamente en tu correo.</p>
        <form className="newsletter-form" onSubmit={e => e.preventDefault()}>
          <input type="email" placeholder="Tu correo electrónico" />
          <button type="submit">Suscribirse</button>
        </form>
      </section>

      {/* ── FOOTER ── */}
      <footer className="store-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="/Tienda" className="store-logo">
              <span className="logo-dot"></span> DAVICI
            </a>
            <p>Muebles de alta calidad diseñados para transformar tu hogar en un espacio único y acogedor.</p>
          </div>
          <div className="footer-col">
            <h4>Tienda</h4>
            <ul>
              <li><a href="#categorias">Categorías</a></li>
              <li><a href="#productos">Productos</a></li>
              <li><a href="#productos">Ofertas</a></li>
              <li><a href="#productos">Novedades</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Soporte</h4>
            <ul>
              <li><a href="#newsletter">Contacto</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Envíos</a></li>
              <li><a href="#">Devoluciones</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Términos</a></li>
              <li><a href="#">Privacidad</a></li>
              <li><a href="#">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 DAVICI. Todos los derechos reservados.</p>
          <div className="footer-social">
            <a href="#">f</a>
            <a href="#">𝕏</a>
            <a href="#">in</a>
          </div>
        </div>
      </footer>
      <Carrito />
      <QuickViewModal
        key={selectedProduct?.id || 'empty'}
        prod={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        addItem={addItem}
      />
    </div>
  );
};

export default Tienda;
