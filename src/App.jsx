import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPages    from './Pages/landingPages'
import Login           from './Pages/Login/Login'
import Register        from './Pages/Login/Register'
import Inicio          from './Pages/Inicio/Index'
import Productos       from './Pages/Productos/Productos'
import Configuracion   from './Pages/Configuracion/Configuracion'
import Categorias      from './Pages/Categorias/Categorias'
import Usuarios        from './Pages/Usuarios/Usuarios'
import Empresas        from './Pages/Empresas/Empresas'
import Suscripciones   from './Pages/Suscripciones/Suscripciones'
import Stores          from './Pages/Stores/Stores'
import Almacenes       from './Pages/Almacenes/Almacenes'
import RolesPermisos   from './Pages/RolesPermisos/RolesPermisos'
import Archivos        from './Pages/Archivos/Archivos'
import FormularioPlanes from './Pages/InscricionSusCricion/FormularioPlanes'
import Pago            from './Pages/InscricionSusCricion/Pago'
import Tienda          from './Pages/TiendaCliente/tienda/Tienda'
import { CartProvider } from './Pages/TiendaCliente/CartContext'
import { authService } from './services/api'
import { canAccessDashboard, isPlatformAdmin, isStoreAdmin } from './utils/access'
import './App.css'

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const applyGlobalTheme = () => {
    const primaryColor = localStorage.getItem('theme_color') || '#F97316';
    const fontFamily = localStorage.getItem('theme_font') || 'Outfit';
    const fontSize = localStorage.getItem('theme_size') || '15px';
    const bgImage = localStorage.getItem('theme_bg_image') || '';
    const bgColor = localStorage.getItem('theme_bg_color') || '';
    const bgOverlay = localStorage.getItem('theme_bg_overlay') || '0';
    const textOpacity = localStorage.getItem('theme_text_opacity') || '1';
    
    document.documentElement.style.setProperty('--app-primary', primaryColor);
    document.documentElement.style.setProperty('--app-font', fontFamily);
    document.documentElement.style.setProperty('--app-size', fontSize);
    document.documentElement.style.fontSize = fontSize;
    document.documentElement.style.setProperty('--bg-overlay', bgOverlay);
    document.documentElement.style.setProperty('--text-opacity', textOpacity);
    
    if (bgImage) {
      document.documentElement.style.setProperty('--app-bg-image', `url(${bgImage})`);
    } else {
      document.documentElement.style.setProperty('--app-bg-image', 'none');
    }

    if (bgColor) {
      document.documentElement.style.setProperty('--app-bg-color', bgColor);
    } else {
      document.documentElement.style.removeProperty('--app-bg-color');
    }
    
    const rgb = hexToRgb(primaryColor);
    if (rgb) {
      document.documentElement.style.setProperty('--app-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      document.documentElement.style.setProperty('--app-primary-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
      document.documentElement.style.setProperty('--app-primary-hover', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      document.documentElement.style.setProperty('--app-primary-active', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`);
    }
};

function App() {
  useEffect(() => {
    applyGlobalTheme();
    // Re-aplicar cuando cambie el localStorage (via evento custom si fuera necesario, 
    // pero por ahora Configuracion lo hace directamente en root)
  }, []);

  return (
    <Router>
      <CartProvider>
        <Routes>
          <Route path="/"              element={<LandingPages />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/inicio"        element={<ProtectedRoute allow={canAccessDashboard}><Inicio /></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute allow={canAccessDashboard}><Configuracion /></ProtectedRoute>} />
          <Route path="/categorias"    element={<ProtectedRoute allow={(user) => isPlatformAdmin(user) || isStoreAdmin(user)}><Categorias /></ProtectedRoute>} />
          <Route path="/productos"     element={<ProtectedRoute allow={(user) => isPlatformAdmin(user) || isStoreAdmin(user)}><Productos /></ProtectedRoute>} />
          <Route path="/usuarios"      element={<ProtectedRoute allow={isPlatformAdmin}><Usuarios /></ProtectedRoute>} />
          <Route path="/empresas"      element={<ProtectedRoute allow={isPlatformAdmin}><Empresas /></ProtectedRoute>} />
          <Route path="/suscripciones" element={<ProtectedRoute allow={canAccessDashboard}><Suscripciones /></ProtectedRoute>} />
          <Route path="/stores"        element={<ProtectedRoute allow={(user) => isPlatformAdmin(user) || isStoreAdmin(user)}><Stores /></ProtectedRoute>} />
          <Route path="/almacenes"     element={<ProtectedRoute allow={(user) => isPlatformAdmin(user) || isStoreAdmin(user)}><Almacenes /></ProtectedRoute>} />
          <Route path="/roles-permisos" element={<ProtectedRoute allow={isPlatformAdmin}><RolesPermisos /></ProtectedRoute>} />
          <Route path="/archivos"      element={<ProtectedRoute allow={isPlatformAdmin}><Archivos /></ProtectedRoute>} />
          <Route path="/formulario-planes" element={<FormularioPlanes />} />
          <Route path="/pago" element={<Pago />} />

          <Route path="/Tienda" element={<Tienda />} />
        </Routes>
      </CartProvider>
    </Router>
  )
}

function ProtectedRoute({ allow, children }) {
  const user = authService.getUser()

  if (!user || !authService.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (!allow(user)) {
    return <Navigate to="/inicio" replace />
  }

  return children
}

export default App
