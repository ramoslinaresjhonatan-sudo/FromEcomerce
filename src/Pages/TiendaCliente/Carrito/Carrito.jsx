import { useCart } from '../CartContext';
import './Carrito.css';

const CartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 01-8 0"></path>
  </svg>
);

const Carrito = () => {
  const { items, isOpen, totalItems, totalPrice, removeItem, updateQty, clearCart, closeCart, openCart } = useCart();

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={closeCart} />

      <button className={`cart-floating-btn ${!isOpen ? 'visible' : ''}`} onClick={openCart}>
        <div className="cart-floating-icon">
          <CartIcon />
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </div>
        <span> Carrito</span>
      </button>

      <aside className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-container">
          <div className="cart-header">
            <h2><CartIcon /> Mi Pedido</h2>
            <button className="cart-close" onClick={closeCart}>✕</button>
          </div>

          <div className="cart-body">
            {items.length === 0 ? (
              <div className="cart-empty" style={{textAlign: 'center', padding: '40px 20px'}}>
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="cart-items-list">
                {items.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-img">
                      <img src={item.url || 'placeholder.png'} alt={item.nombre} style={{width: '100%'}} />
                    </div>
                    <div className="cart-item-info">
                      <div className="cart-item-top">
                        <h4>{item.nombre}</h4>
                        <button className="cart-item-remove" onClick={() => removeItem(item.id)}>✕</button>
                      </div>
                      <div className="cart-item-bottom">
                        <div className="qty-control">
                          <button onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}>−</button>
                          <span>{item.qty}</span>
                          <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                        </div>
                        <span className="cart-item-price">${(Number(item.precio) * item.qty).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="cart-footer">
              <div className="cart-summary">
                <div className="cart-summary-row total">
                  <span>Total</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <button className="btn-checkout">Proceder al Pago</button>
              <button className="btn-clear" onClick={clearCart}>Vaciar Carrito</button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Carrito;