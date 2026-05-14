import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { restaurantAPI, categoryAPI } from '../../services/api';
import RestaurantCard from '../../components/customer/RestaurantCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function RestaurantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('rating');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [isOpenOnly, setIsOpenOnly] = useState(false);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = { sort: sortBy };
      if (search) params.search = search;
      if (activeCategory) params.category = activeCategory;
      if (isOpenOnly) params.isOpen = true;
      const { data } = await restaurantAPI.getAll(params);
      setRestaurants(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data.data)).catch(console.error);
  }, []);

  useEffect(() => { fetchRestaurants(); }, [search, activeCategory, sortBy, isOpenOnly]);

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, marginBottom: 32 }}>
          All Restaurants
        </h1>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search restaurants..."
              style={{ paddingLeft: 44, height: 46 }}
            />
          </div>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ width: 'auto', minWidth: 160, height: 46, cursor: 'pointer' }}>
            <option value="rating">Sort: Rating</option>
            <option value="deliveryTime">Sort: Fastest</option>
            <option value="deliveryFee">Sort: Cheapest Delivery</option>
            <option value="popular">Sort: Popular</option>
          </select>

          <button
            onClick={() => setIsOpenOnly(!isOpenOnly)}
            className={isOpenOnly ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ height: 46, padding: '0 20px' }}
          >
            Open Now
          </button>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, marginBottom: 32 }}>
            <button
              onClick={() => setActiveCategory('')}
              className={!activeCategory ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ flexShrink: 0, padding: '8px 20px', fontSize: 13, height: 40 }}
            >
              All
            </button>
            {categories.map(cat => (
              <button key={cat._id}
                onClick={() => setActiveCategory(activeCategory === cat._id ? '' : cat._id)}
                className={activeCategory === cat._id ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ flexShrink: 0, padding: '8px 20px', fontSize: 13, height: 40, gap: 6 }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: 80 }}><LoadingSpinner /></div>
        ) : restaurants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>No restaurants found</h3>
            <p>Try a different search or category</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              {restaurants.length} restaurants found
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }} className="fade-in">
              {restaurants.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
