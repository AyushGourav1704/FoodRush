import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Circle, Clock, MapPin, Phone, Package } from 'lucide-react';
import { orderAPI } from '../../services/api';
import { connectSocket, joinOrderRoom } from '../../services/socket';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '📋', desc: 'Your order has been placed' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅', desc: 'Restaurant confirmed your order' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳', desc: 'Restaurant is preparing your food' },
  { key: 'ready', label: 'Ready', icon: '📦', desc: 'Order is ready for pickup' },
  { key: 'picked_up', label: 'Picked Up', icon: '🛵', desc: 'Delivery partner picked up your order' },
  { key: 'out_for_delivery', label: 'On the Way', icon: '🚀', desc: 'Your order is out for delivery' },
  { key: 'delivered', label: 'Delivered', icon: '🎉', desc: 'Enjoy your meal!' },
];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryLocation, setDeliveryLocation] = useState(null);

  useEffect(() => {
    orderAPI.getOne(id).then(({ data }) => {
      setOrder(data.data);
      setLoading(false);
    }).catch(console.error);

    // Connect socket for live updates
    const socket = connectSocket();
    joinOrderRoom(id);
    socket.on('order_status_update', ({ status }) => {
      setOrder(prev => prev ? { ...prev, orderStatus: status } : prev);
    });
    socket.on('delivery_location', (loc) => setDeliveryLocation(loc));

    return () => {
      socket.off('order_status_update');
      socket.off('delivery_location');
    };
  }, [id]);

  if (loading) return <div className="page"><div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><LoadingSpinner /></div></div>;
  if (!order) return <div className="page"><div className="container" style={{ paddingTop: 40 }}>Order not found</div></div>;

  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 760 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32 }}>Live Tracking</h1>
          <div style={{ background: 'var(--bg-elevated)', padding: '8px 16px', borderRadius: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            #{order.orderNumber}
          </div>
        </div>

        {/* Status Banner */}
        <div className="card" style={{ padding: 24, marginBottom: 28, background: isCancelled ? '#3b0a0a' : 'rgba(255,87,34,0.08)', borderColor: isCancelled ? '#ef5350' : 'var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 40 }}>{isCancelled ? '❌' : STATUS_STEPS[currentStepIdx]?.icon}</div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>
                {isCancelled ? 'Order Cancelled' : STATUS_STEPS[currentStepIdx]?.label}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
                {isCancelled ? order.cancelReason || 'Your order was cancelled' : STATUS_STEPS[currentStepIdx]?.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {!isCancelled && (
          <div className="card" style={{ padding: 28, marginBottom: 28 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 24 }}>Order Progress</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {STATUS_STEPS.map((step, idx) => {
                const done = idx <= currentStepIdx;
                const active = idx === currentStepIdx;
                return (
                  <div key={step.key} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? 'var(--primary)' : 'var(--bg-elevated)', border: `2px solid ${done ? 'var(--primary)' : 'var(--border)'}`, display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0, boxShadow: active ? '0 0 0 4px rgba(255,87,34,0.2)' : 'none', transition: 'all 0.3s' }}>
                        {done ? '✓' : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />}
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div style={{ width: 2, height: 32, background: done && idx < currentStepIdx ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: idx < STATUS_STEPS.length - 1 ? 16 : 0, paddingTop: 4 }}>
                      <div style={{ fontWeight: active ? 700 : 500, color: done ? 'var(--text)' : 'var(--text-dim)', fontSize: 15 }}>
                        {step.icon} {step.label}
                      </div>
                      {active && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{step.desc}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Restaurant */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Restaurant</h4>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.restaurant?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{order.restaurant?.address?.city}</div>
          </div>

          {/* Delivery Partner */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivery Partner</h4>
            {order.deliveryPartner ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.deliveryPartner.name}</div>
                <a href={`tel:${order.deliveryPartner.phone}`} style={{ color: 'var(--primary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={12} /> {order.deliveryPartner.phone}
                </a>
              </>
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Assigning partner...</div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Order Items</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{item.quantity}x</span>
                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: 600 }}>₹{item.subtotal}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>
            <span>Total Paid</span>
            <span>₹{order.pricing?.total}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Link to="/orders" className="btn btn-outline" style={{ flex: 1 }}>View All Orders</Link>
          {['pending', 'confirmed'].includes(order.orderStatus) && (
            <button className="btn" style={{ flex: 1, background: 'rgba(244,67,54,0.1)', color: '#ef5350', border: '1px solid #ef5350' }}
              onClick={() => orderAPI.cancel(id, { reason: 'Customer cancelled' }).then(() => window.location.reload())}>
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
