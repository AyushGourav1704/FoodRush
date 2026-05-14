import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import RestaurantCard from '../../components/customer/RestaurantCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await userAPI.getWishlist();
        setWishlist(data.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="page" style={{ paddingTop: 80 }}>
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Heart size={32} color="var(--primary)" fill="var(--primary)" /> My Wishlist
        </h1>
        {loading ? <LoadingSpinner /> : wishlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💔</div>
            <h3 style={{ marginBottom: 8 }}>Your wishlist is empty</h3>
            <p style={{ marginBottom: 24 }}>Save your favourite restaurants by tapping the heart icon</p>
            <Link to="/restaurants" className="btn btn-primary">Browse Restaurants</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {wishlist.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
