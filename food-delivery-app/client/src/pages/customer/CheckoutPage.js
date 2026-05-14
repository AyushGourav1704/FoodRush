import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, CreditCard, Wallet, Banknote } from 'lucide-react';
import { orderAPI, paymentAPI } from '../../services/api';
import { clearCart, selectCartTotal } from '../../redux/slices/cartSlice';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, restaurantId } = useSelector(s => s.cart);
  const { user } = useSelector(s => s.auth);
  const total = useSelector(selectCartTotal);
  const deliveryFee = 30;
  const tax = Math.round(total * 0.05);
  const grandTotal = total + deliveryFee + tax;

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    label: 'Home', street: '', city: '', state: 'Odisha', zipCode: '', country: 'India'
  });
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handlePlaceOrder = async () => {
    if (!address.street || !address.city || !address.zipCode) {
      return toast.error('Please fill in your delivery address');
    }
    setLoading(true);
    try {
      const orderData = {
        restaurantId,
        items: items.map(i => ({ foodItemId: i._id, quantity: i.quantity })),
        deliveryAddress: address,
        paymentMethod,
        specialInstructions
      };

      const { data } = await orderAPI.create(orderData);
      const order = data.data;

      if (paymentMethod === 'razorpay') {
        const { data: payData } = await paymentAPI.createOrder({ orderId: order._id });
        const rzpOptions = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: payData.data.amount,
          currency: 'INR',
          name: 'FoodRush',
          description: `Order #${order.orderNumber}`,
          order_id: payData.data.razorpayOrderId,
          handler: async (response) => {
            await paymentAPI.verify({ ...response, orderId: order._id });
            dispatch(clearCart());
            toast.success('Order placed & payment successful!');
            navigate(`/orders/${order._id}/track`);
          },
          theme: { color: '#FF5722' }
        };
        const rzp = new window.Razorpay(rzpOptions);
        rzp.open();
      } else {
        dispatch(clearCart());
        toast.success('Order placed successfully! 🎉');
        navigate(`/orders/${order._id}/track`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place order');
    }
    setLoading(false);
  };

  const payMethods = [
    { id: 'cod', label: 'Cash on Delivery', icon: <Banknote size={20} />, desc: 'Pay when your order arrives' },
    { id: 'razorpay', label: 'Online Payment', icon: <CreditCard size={20} />, desc: 'UPI, Card, Net Banking' },
  ];

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, marginBottom: 32 }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Delivery Address */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={20} style={{ color: 'var(--primary)' }} /> Delivery Address
              </h3>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Label</label>
                    <select value={address.label} onChange={e => setAddress({ ...address, label: e.target.value })} style={{ height: 46 }}>
                      <option>Home</option><option>Work</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Zip Code *</label>
                    <input value={address.zipCode} onChange={e => setAddress({ ...address, zipCode: e.target.value })} placeholder="751001" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Street Address *</label>
                  <input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} placeholder="House no., Street name, Area" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>City *</label>
                    <input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} placeholder="Bhubaneswar" />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>State</label>
                    <input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Wallet size={20} style={{ color: 'var(--primary)' }} /> Payment Method
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {payMethods.map(m => (
                  <div key={m.id} onClick={() => setPaymentMethod(m.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18, borderRadius: 12, border: `2px solid ${paymentMethod === m.id ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', background: paymentMethod === m.id ? 'rgba(255,87,34,0.05)' : 'transparent', transition: 'all 0.2s' }}>
                    <div style={{ color: paymentMethod === m.id ? 'var(--primary)' : 'var(--text-muted)' }}>{m.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{m.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.desc}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', border: `2px solid ${paymentMethod === m.id ? 'var(--primary)' : 'var(--border)'}`, background: paymentMethod === m.id ? 'var(--primary)' : 'transparent', display: 'grid', placeItems: 'center' }}>
                      {paymentMethod === m.id && <div style={{ width: 8, height: 8, background: 'white', borderRadius: '50%' }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Special Instructions</h3>
              <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)}
                placeholder="Any special instructions for the restaurant or delivery partner..." rows={3} style={{ resize: 'vertical' }} />
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ position: 'sticky', top: 88 }}>
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Order Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {items.map(item => (
                  <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.name} x{item.quantity}</span>
                    <span>₹{(item.discountedPrice || item.price) * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {[['Subtotal', total], ['Delivery Fee', deliveryFee], ['GST (5%)', tax]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)' }}>
                    <span>{l}</span><span style={{ color: 'var(--text)' }}>₹{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20, color: 'var(--primary)', marginTop: 4 }}>
                  <span>Total</span><span>₹{grandTotal}</span>
                </div>
              </div>
              <button onClick={handlePlaceOrder} disabled={loading} className="btn btn-primary" style={{ width: '100%', fontSize: 16, padding: 14 }}>
                {loading ? 'Placing Order...' : `Place Order ₹${grandTotal}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
