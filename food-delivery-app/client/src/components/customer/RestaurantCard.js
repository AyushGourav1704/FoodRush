import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Bike } from 'lucide-react';

export default function RestaurantCard({ restaurant: r }) {
  return (
    <Link to={`/restaurants/${r._id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Image */}
        <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
          <img src={r.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'} alt={r.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'}
          />
          {!r.isOpen && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center' }}>
              <span style={{ background: '#333', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>Closed</span>
            </div>
          )}
          {r.offers?.length > 0 && (
            <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {r.offers[0].title}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, fontFamily: 'var(--font-display)' }}>{r.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: r.avgRating >= 4 ? '#1b4332' : '#2a1f00', color: r.avgRating >= 4 ? '#4CAF50' : '#FF9800', padding: '3px 8px', borderRadius: 8, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              <Star size={12} fill="currentColor" />{r.avgRating?.toFixed(1)}
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14, lineHeight: 1.4 }}>
            {r.cuisine?.join(' • ')}
          </p>

          <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} /> {r.deliveryTime}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Bike size={13} /> ₹{r.deliveryFee} delivery
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
              Min ₹{r.minOrderAmount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
