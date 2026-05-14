import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { updateQuantity, removeItem, clearCart, selectCartTotal } from '../../redux/slices/cartSlice';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, restaurantName } = useSelector(s => s.cart);
  const total = useSelector(selectCartTotal);
  const deliveryFee = 30;
  const tax = Math.round(total * 0.05);

  if (items.length === 0) return (
    <div className="page">
      <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: 12 }}>Your cart is empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Add some delicious food to get started!</p>
        <Link to="/restaurants" className="btn btn-primary" style={{ padding: '12px 32px' }}>Browse Restaurants</Link>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36 }}>Your Cart</h1>
          <button onClick={() => dispatch(clearCart())} className="btn btn-ghost" style={{ color: 'var(--error)', fontSize: 14 }}>
            <Trash2 size={16} /> Clear Cart
          </button>
        </div>

        <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 14 }}>
          From: <strong style={{ color: 'var(--text)' }}>{restaurantName}</strong>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => (
              <div key={item._id} className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                <img src={item.image} alt={item.name} style={{ width: 80, height: 70, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                  onError={e => e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 4 }}>{item.name}</h4>
                  <div style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{item.discountedPrice || item.price}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', borderRadius: 8, padding: '6px 12px', border: '1px solid var(--border)' }}>
                    <button onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'grid', placeItems: 'center' }}><Minus size={14} /></button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'grid', placeItems: 'center' }}><Plus size={14} /></button>
                  </div>
                  <div style={{ fontWeight: 700, minWidth: 70, textAlign: 'right' }}>
                    ₹{(item.discountedPrice || item.price) * item.quantity}
                  </div>
                  <button onClick={() => dispatch(removeItem(item._id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'grid', placeItems: 'center', padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ position: 'sticky', top: 88 }}>
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, marginBottom: 24 }}>Order Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                {[['Subtotal', `₹${total}`], ['Delivery Fee', `₹${deliveryFee}`], ['GST (5%)', `₹${tax}`]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)' }}>
                    <span>{l}</span><span style={{ color: 'var(--text)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>₹{total + deliveryFee + tax}</span>
                </div>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn btn-primary" style={{ width: '100%', fontSize: 16, padding: '14px' }}>
                Proceed to Checkout <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
