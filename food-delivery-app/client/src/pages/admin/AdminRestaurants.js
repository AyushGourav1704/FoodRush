import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { restaurantAPI } from '../../services/api';
import { Store, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const { data } = await restaurantAPI.getAll({ limit: 50 }); setRestaurants(data.data); } catch (e) { toast.error('Failed to load'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    try { await restaurantAPI.toggle(id); toast.success('Status updated'); load(); } catch { toast.error('Failed'); }
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await restaurantAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const navLinks = [
    { to: '/admin', label: '📊 Dashboard' },
    { to: '/admin/restaurants', label: '🍽️ Restaurants', active: true },
    { to: '/admin/orders', label: '📦 Orders' },
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, display: 'flex', alignItems: 'center', gap: 10 }}><Store size={28} color="var(--primary)" /> Restaurants</h1>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader size={32} color="var(--primary)" /></div>
        ) : (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Restaurant', 'City', 'Rating', 'Orders', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {restaurants.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={r.image || 'https://via.placeholder.com/40'} alt={r.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{r.cuisine?.join(', ')}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{r.address?.city}</td>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>⭐ {r.avgRating}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{r.totalOrders}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.7rem', borderRadius: 99, background: r.isOpen ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)', color: r.isOpen ? '#4CAF50' : '#f44336', fontSize: '0.75rem', fontWeight: 700 }}>
                        {r.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleToggle(r._id)} title="Toggle open/close"
                          style={{ padding: '0.4rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                          {r.isOpen ? <ToggleRight size={16} color="#4CAF50" /> : <ToggleLeft size={16} />}
                        </button>
                        <button onClick={() => handleDelete(r._id, r.name)} title="Delete"
                          style={{ padding: '0.4rem', background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.2)', borderRadius: 8, cursor: 'pointer', color: '#f44336', display: 'flex' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {restaurants.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No restaurants found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
