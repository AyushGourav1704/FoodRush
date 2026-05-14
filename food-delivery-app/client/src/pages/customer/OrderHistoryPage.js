import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Package, ChevronRight, MapPin } from 'lucide-react';

const STATUS_COLORS = {
  pending: '#FF9800', confirmed: '#2196F3', preparing: '#9C27B0',
  ready: '#00BCD4', picked_up: '#FF5722', out_for_delivery: '#FF5722',
  delivered: '#4CAF50', cancelled: '#f44336'
};

const STATUS_LABELS = {
  pending: '⏳ Pending', confirmed: '✅ Confirmed', preparing: '👨‍🍳 Preparing',
  ready: '📦 Ready', picked_up: '🛵 Picked Up', out_for_delivery: '🚀 On the Way',
  delivered: '🎉 Delivered', cancelled: '❌ Cancelled'
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await orderAPI.getUserOrders({ status: filter || undefined });
        setOrders(data.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [filter]);

  const tabs = ['', 'pending', 'out_for_delivery', 'delivered', 'cancelled'];
  const tabLabels = { '': 'All', pending: 'Active', out_for_delivery: 'On Way', delivered: 'Delivered', cancelled: 'Cancelled' };

  return (
    <div className="page" style={{ paddingTop: 80 }}>
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: 700 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Package size={32} color="var(--primary)" /> My Orders
        </h1>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: 4 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{ padding: '0.5rem 1.2rem', borderRadius: 99, border: `1px solid ${filter === t ? 'var(--primary)' : 'var(--border)'}`, background: filter === t ? 'rgba(255,87,34,0.12)' : 'transparent', color: filter === t ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
            <h3 style={{ marginBottom: 8 }}>No orders yet</h3>
            <p style={{ marginBottom: 24 }}>Your order history will appear here</p>
            <Link to="/restaurants" className="btn btn-primary">Order Now</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => (
              <div key={order._id} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{order.restaurant?.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <span style={{ padding: '0.3rem 0.8rem', borderRadius: 99, background: `${STATUS_COLORS[order.orderStatus]}20`, color: STATUS_COLORS[order.orderStatus], fontSize: '0.8rem', fontWeight: 700 }}>
                    {STATUS_LABELS[order.orderStatus]}
                  </span>
                </div>
                {/* Items */}
                <div style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                    {order.items.map(i => `${i.name} × ${i.quantity}`).join(', ')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{order.pricing?.total}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['out_for_delivery', 'picked_up'].includes(order.orderStatus) && (
                        <Link to={`/orders/${order._id}/track`} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={14} /> Track
                        </Link>
                      )}
                      <Link to={`/orders/${order._id}/track`} style={{ padding: '0.5rem 1rem', background: 'var(--bg-elevated)', color: 'var(--text)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Details <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
