import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Star, Clock, ChevronRight, Zap, Shield, Truck } from 'lucide-react';
import { restaurantAPI, categoryAPI } from '../../services/api';
import RestaurantCard from '../../components/customer/RestaurantCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function LandingPage() {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, resRes] = await Promise.all([
          categoryAPI.getAll(),
          restaurantAPI.getAll({ featured: true, limit: 6 })
        ]);
        setCategories(catRes.data.data);
        setFeatured(resRes.data.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/restaurants?search=${query}`);
    else navigate('/restaurants');
  };

  const features = [
    { icon: <Zap size={20} />, title: 'Fast Delivery', desc: 'Get food in 30 minutes or less' },
    { icon: <Shield size={20} />, title: 'Safe & Secure', desc: 'Hygienic delivery every time' },
    { icon: <Truck size={20} />, title: 'Live Tracking', desc: 'Track your order in real-time' },
  ];

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <section style={{
        minHeight: '80vh', display: 'flex', alignItems: 'center',
        background: 'radial-gradient(ellipse at 60% 50%, rgba(255,87,34,0.12) 0%, transparent 70%)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: 400, height: 400, background: 'rgba(255,87,34,0.06)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 300, height: 300, background: 'rgba(255,138,101,0.05)', borderRadius: '50%', filter: 'blur(50px)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 680 }}>
            <div className="badge badge-primary" style={{ marginBottom: 24, fontSize: 13 }}>
              🔥 50+ restaurants near you
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 8vw, 88px)',
              fontWeight: 800, lineHeight: 1.0, letterSpacing: '-2px', marginBottom: 24
            }}>
              Hungry?<br />
              <span style={{ color: 'var(--primary)' }}>We Got You.</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 18, lineHeight: 1.6, marginBottom: 40, maxWidth: 500 }}>
              Order from your favorite restaurants and track delivery in real-time. Fast, fresh, delivered.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, maxWidth: 540 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search restaurants or cuisines..."
                  style={{ paddingLeft: 48, background: '#1a1a1a', border: '1px solid #2a2a2a', fontSize: 15, height: 52 }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: 52, padding: '0 28px', fontSize: 15, whiteSpace: 'nowrap' }}>
                Find Food
              </button>
            </form>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
              {[['500+', 'Dishes'], ['4.8★', 'Rating'], ['30min', 'Delivery']].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--text)' }}>{val}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {features.map(f => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 24, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ width: 44, height: 44, background: 'rgba(255,87,34,0.12)', borderRadius: 12, display: 'grid', placeItems: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section style={{ padding: '60px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32 }}>Browse by Category</h2>
              <Link to="/restaurants" style={{ color: 'var(--primary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
              {categories.map(cat => (
                <Link key={cat._id} to={`/restaurants?category=${cat._id}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 28px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', flexShrink: 0, transition: 'all 0.2s', cursor: 'pointer', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(255,87,34,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                >
                  <span style={{ fontSize: 32 }}>{cat.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Restaurants */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32 }}>Featured Restaurants</h2>
            <Link to="/restaurants" style={{ color: 'var(--primary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ChevronRight size={16} />
            </Link>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {featured.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 0', borderTop: '1px solid var(--border)', marginTop: 40 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>
            Food<span style={{ color: 'var(--primary)' }}>Rush</span>
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>© 2024 FoodRush. Built with ❤️ for food lovers.</span>
        </div>
      </footer>
    </div>
  );
}
