import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { Users, Loader, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_COLORS = { customer: '#2196F3', admin: '#FF5722', delivery: '#4CAF50', restaurant_owner: '#FF9800' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try { const { data } = await adminAPI.getUsers({ search, limit: 50 }); setUsers(data.data); } catch { toast.error('Failed'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    try { await adminAPI.toggleUser(id); toast.success('User status updated'); load(); } catch { toast.error('Failed'); }
  };

  const navLinks = [
    { to: '/admin', label: '📊 Dashboard' },
    { to: '/admin/restaurants', label: '🍽️ Restaurants' },
    { to: '/admin/orders', label: '📦 Orders' },
    { to: '/admin/users', label: '👥 Users', active: true },
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
          <Users size={28} color="var(--primary)" /> Manage Users
        </h1>

        <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} onKeyDown={e => e.key === 'Enter' && load()} />
          <button onClick={load} className="btn btn-primary" style={{ height: 48, padding: '0 24px' }}>Search</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader size={32} color="var(--primary)" /></div>
        ) : (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Action'].map(h => (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${ROLE_COLORS[u.role]}30`, display: 'grid', placeItems: 'center', fontWeight: 800, color: ROLE_COLORS[u.role], fontSize: '0.9rem' }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.phone || '—'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.7rem', borderRadius: 99, background: `${ROLE_COLORS[u.role]}20`, color: ROLE_COLORS[u.role], fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.7rem', borderRadius: 99, background: u.isActive ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)', color: u.isActive ? '#4CAF50' : '#f44336', fontSize: '0.75rem', fontWeight: 700 }}>
                        {u.isActive ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '1rem' }}>
                      <button onClick={() => handleToggle(u._id)} title={u.isActive ? 'Ban user' : 'Activate user'}
                        style={{ padding: '0.4rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
                        {u.isActive ? <ToggleRight size={18} color="#4CAF50" /> : <ToggleLeft size={18} color="#f44336" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
