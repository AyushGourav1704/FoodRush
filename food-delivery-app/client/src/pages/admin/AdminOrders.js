import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { Package, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = { pending: '#FF9800', confirmed: '#2196F3', preparing: '#9C27B0', ready: '#00BCD4', picked_up: '#FF5722', out_for_delivery: '#FF5722', delivered: '#4CAF50', cancelled: '#f44336' };
const ALL_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getAll({ status: filter || undefined, limit: 50 });
      setOrders(data.data);
    } catch { toast.error('Failed to load orders'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try { await orderAPI.updateStatus(orderId, { status }); toast.success('Status updated'); load(); }
    catch { toast.error('Failed to update status'); }
    setUpdatingId(null);
  };

  const navLinks = [
    { to: '/admin', label: '📊 Dashboard' },
    { to: '/admin/restaurants', label: '🍽️ Restaurants' },
    { to: '/admin/orders', label: '📦 Orders', active: true },
    { to: '/admin/users', label: '👥 Users' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 240, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', padding: '1.5rem 1rem', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', marginBottom: '2rem', padding: '0 0.5rem' }}>FoodFlash <span style={{ color: 'var(--primary)' }}>Admin</span></div>
        {navLinks.map(l => <Link key={l.to} to={l.to} style={{ display: 'block', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: 4, color: l.active ? 'var(--primary)' : 'var(--text-muted)', background: l.active ? 'rgba(255,87,34,0.1)' : 'transparent', fontWeight: l.active ? 700 : 500, fontSize: '0.9rem' }}>{l.label}</Link>)}
        <Link to="/" style={{ display: 'block', padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>← Back to App</Link>
      </div>

      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Package size={28} color="var(--primary)" /> Manage Orders
        </h1>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('')} style={{ padding: '0.4rem 1rem', borderRadius: 99, border: `1px solid ${!filter ? 'var(--primary)' : 'var(--border)'}`, background: !filter ? 'rgba(255,87,34,0.12)' : 'transparent', color: !filter ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>All</button>
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '0.4rem 1rem', borderRadius: 99, border: `1px solid ${filter === s ? STATUS_COLORS[s] : 'var(--border)'}`, background: filter === s ? `${STATUS_COLORS[s]}20` : 'transparent', color: filter === s ? STATUS_COLORS[s] : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>{s.replace(/_/g, ' ')}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader size={32} color="var(--primary)" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found</div>}
            {orders.map(o => (
              <div key={o._id} style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>#{o.orderNumber}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{o.customer?.name} · {o.restaurant?.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>{new Date(o.createdAt).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{o.pricing?.total}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ padding: '0.3rem 0.8rem', borderRadius: 99, background: `${STATUS_COLORS[o.orderStatus]}20`, color: STATUS_COLORS[o.orderStatus], fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize' }}>
                    {o.orderStatus?.replace(/_/g, ' ')}
                  </span>
                  {updatingId === o._id ? <Loader size={16} /> : (
                    <select value={o.orderStatus} onChange={e => handleStatusChange(o._id, e.target.value)}
                      style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: 'auto', background: 'var(--bg-elevated)' }}>
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
