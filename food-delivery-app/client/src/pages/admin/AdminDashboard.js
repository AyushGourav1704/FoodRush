import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { TrendingUp, Users, ShoppingBag, Store, IndianRupee, LayoutDashboard } from 'lucide-react';

const StatCard = ({ icon, label, value, color = 'var(--primary)', sub }) => (
  <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}20`, display: 'grid', placeItems: 'center', color, flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem' }}>{value}</div>
      {sub && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminAPI.getAnalytics();
        setAnalytics(data.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const navLinks = [
    { to: '/admin', label: '📊 Dashboard', active: true },
    { to: '/admin/restaurants', label: '🍽️ Restaurants' },
    { to: '/admin/orders', label: '📦 Orders' },
    { to: '/admin/users', label: '👥 Users' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', padding: '1.5rem 1rem', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
          Food<span style={{ color: 'var(--primary)' }}>Flash</span> Admin
        </div>
        {navLinks.map(l => (
          <Link key={l.to} to={l.to} style={{ display: 'block', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: 4, color: l.active ? 'var(--primary)' : 'var(--text-muted)', background: l.active ? 'rgba(255,87,34,0.1)' : 'transparent', fontWeight: l.active ? 700 : 500, fontSize: '0.9rem' }}>
            {l.label}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <Link to="/" style={{ display: 'block', padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>← Back to App</Link>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
          <LayoutDashboard size={28} color="var(--primary)" />
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Dashboard</h1>
        </div>

        {loading ? <LoadingSpinner /> : !analytics ? (
          <p style={{ color: 'var(--text-muted)' }}>No analytics data available. Make sure the server is running.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: '2rem' }}>
              <StatCard icon={<IndianRupee size={24} />} label="Total Revenue" value={`₹${(analytics.stats?.totalRevenue || 0).toLocaleString('en-IN')}`} sub="All time" />
              <StatCard icon={<ShoppingBag size={24} />} label="Total Orders" value={analytics.stats?.totalOrders || 0} color="#2196F3" sub="All time" />
              <StatCard icon={<Users size={24} />} label="Total Users" value={analytics.stats?.totalUsers || 0} color="#4CAF50" />
              <StatCard icon={<Store size={24} />} label="Restaurants" value={analytics.stats?.totalRestaurants || 0} color="#FF9800" />
            </div>

            {/* Order Status Breakdown */}
            {analytics.ordersByStatus && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Orders by Status</h2>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {analytics.ordersByStatus.map(({ _id, count }) => (
                    <div key={_id} style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-elevated)', borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>{count}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'capitalize' }}>{_id}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {analytics.recentOrders && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontWeight: 700 }}>Recent Orders</h2>
                  <Link to="/admin/orders" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>View all →</Link>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Order #', 'Customer', 'Restaurant', 'Total', 'Status'].map(h => (
                          <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentOrders.map(o => (
                        <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>#{o.orderNumber}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{o.customer?.name}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{o.restaurant?.name}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>₹{o.pricing?.total}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: 99, background: 'rgba(76,175,80,0.15)', color: '#4CAF50', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{o.orderStatus}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
