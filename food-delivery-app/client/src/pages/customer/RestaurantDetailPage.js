import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, Clock, Bike, MapPin, Phone, Plus, Minus, ShoppingCart } from 'lucide-react';
import { restaurantAPI } from '../../services/api';
import { addItem, updateQuantity, selectCartCount } from '../../redux/slices/cartSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const cartItems = useSelector(s => s.cart.items);
  const cartRestaurantId = useSelector(s => s.cart.restaurantId);
  const cartCount = useSelector(selectCartCount);

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isVegOnly, setIsVegOnly] = useState(false);

  useEffect(() => {
    restaurantAPI.getOne(id).then(({ data }) => {
      setRestaurant(data.data.restaurant);
      setMenu(data.data.menu);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const getCartQty = (itemId) => {
    const item = cartItems.find(i => i._id === itemId);
    return item ? item.quantity : 0;
  };

  const handleAdd = (item) => {
    if (cartRestaurantId && cartRestaurantId !== id) {
      if (!window.confirm('Your cart has items from another restaurant. Clear cart and add this item?')) return;
    }
    dispatch(addItem({ item, restaurantId: id, restaurantName: restaurant.name }));
    toast.success(`${item.name} added to cart`);
  };

  const handleQtyChange = (item, delta) => {
    const current = getCartQty(item._id);
    if (current + delta <= 0) dispatch(updateQuantity({ id: item._id, quantity: 0 }));
    else if (current === 0) handleAdd(item);
    else dispatch(updateQuantity({ id: item._id, quantity: current + delta }));
  };

  if (loading) return <div className="page"><div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><LoadingSpinner /></div></div>;
  if (!restaurant) return <div className="page"><div className="container" style={{ paddingTop: 40 }}>Restaurant not found</div></div>;

  // Group menu by category
  const categories = ['all', ...new Set(menu.map(i => i.category?.name || 'Other'))];
  const filteredMenu = menu.filter(item => {
    if (activeCategory !== 'all' && item.category?.name !== activeCategory) return false;
    if (isVegOnly && !item.isVeg) return false;
    return true;
  });

  return (
    <div className="page">
      {/* Header Banner */}
      <div style={{ height: 280, position: 'relative', overflow: 'hidden' }}>
        <img src={restaurant.image || restaurant.coverImage} alt={restaurant.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800'}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(15,15,15,0.95) 100%)' }} />
      </div>

      <div className="container" style={{ marginTop: -80, position: 'relative', zIndex: 1 }}>
        {/* Restaurant Info */}
        <div className="card" style={{ padding: 28, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, marginBottom: 8 }}>{restaurant.name}</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{restaurant.description}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {restaurant.cuisine?.map(c => (
                  <span key={c} style={{ padding: '4px 12px', background: 'var(--bg-elevated)', borderRadius: 20, fontSize: 13, color: 'var(--text-muted)' }}>{c}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '14px 20px', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', color: restaurant.avgRating >= 4 ? '#4CAF50' : '#FF9800', fontWeight: 800, fontSize: 20 }}>
                  <Star size={16} fill="currentColor" />{restaurant.avgRating?.toFixed(1)}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{restaurant.totalReviews} reviews</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '14px 20px', borderRadius: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={16} />{restaurant.deliveryTime}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>delivery</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '14px 20px', borderRadius: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 20 }}>₹{restaurant.deliveryFee}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>delivery fee</div>
              </div>
            </div>
          </div>

          {restaurant.offers?.length > 0 && (
            <div style={{ marginTop: 20, display: 'flex', gap: 12, overflowX: 'auto' }}>
              {restaurant.offers.map((offer, i) => (
                <div key={i} style={{ padding: '10px 16px', background: 'rgba(255,87,34,0.1)', border: '1px dashed var(--primary)', borderRadius: 10, flexShrink: 0 }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>{offer.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{offer.description} | Code: <strong>{offer.code}</strong></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
          {/* Menu */}
          <div>
            {/* Menu filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1 }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={activeCategory === cat ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ flexShrink: 0, padding: '7px 16px', fontSize: 13, height: 38, textTransform: 'capitalize' }}
                  >{cat}</button>
                ))}
              </div>
              <button onClick={() => setIsVegOnly(!isVegOnly)}
                style={{ padding: '7px 16px', borderRadius: 20, fontSize: 13, height: 38, cursor: 'pointer', background: isVegOnly ? '#1b4332' : 'var(--bg-elevated)', color: isVegOnly ? '#4CAF50' : 'var(--text-muted)', border: `1px solid ${isVegOnly ? '#4CAF50' : 'var(--border)'}`, fontWeight: 600 }}
              >🌿 Veg Only</button>
            </div>

            {/* Food Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredMenu.map(item => {
                const qty = getCartQty(item._id);
                return (
                  <div key={item._id} className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ width: 16, height: 16, border: `2px solid ${item.isVeg ? '#4CAF50' : '#ef5350'}`, borderRadius: 3, display: 'grid', placeItems: 'center' }}>
                          <div style={{ width: 8, height: 8, background: item.isVeg ? '#4CAF50' : '#ef5350', borderRadius: '50%' }} />
                        </div>
                        {item.isBestseller && <span style={{ background: '#2a1f00', color: '#FF9800', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>★ BESTSELLER</span>}
                      </div>
                      <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{item.name}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.4, marginBottom: 10 }}>{item.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {item.discountedPrice ? (
                          <>
                            <span style={{ fontWeight: 800, fontSize: 18 }}>₹{item.discountedPrice}</span>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)', fontSize: 14 }}>₹{item.price}</span>
                          </>
                        ) : (
                          <span style={{ fontWeight: 800, fontSize: 18 }}>₹{item.price}</span>
                        )}
                        {item.ratings?.avg > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>⭐ {item.ratings.avg.toFixed(1)}</span>}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 100, height: 90, borderRadius: 12, overflow: 'hidden' }}>
                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'} />
                      </div>
                      {qty === 0 ? (
                        <button onClick={() => handleAdd(item)} className="btn btn-primary" style={{ padding: '7px 20px', fontSize: 13, width: 100 }}>
                          <Plus size={14} /> ADD
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary)', borderRadius: 8, padding: '6px 12px', width: 100, justifyContent: 'space-between' }}>
                          <button onClick={() => handleQtyChange(item, -1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Minus size={14} /></button>
                          <span style={{ fontWeight: 700, color: 'white' }}>{qty}</span>
                          <button onClick={() => handleQtyChange(item, 1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Plus size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Cart Summary */}
          {cartCount > 0 && (
            <div style={{ position: 'sticky', top: 88 }}>
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Your Order</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {cartItems.map(item => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{item.name} x{item.quantity}</span>
                      <span style={{ fontWeight: 600 }}>₹{(item.discountedPrice || item.price) * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16 }}>
                    <span>Subtotal</span>
                    <span>₹{cartItems.reduce((s, i) => s + (i.discountedPrice || i.price) * i.quantity, 0)}</span>
                  </div>
                </div>
                <Link to="/cart" className="btn btn-primary" style={{ width: '100%', fontSize: 15 }}>
                  <ShoppingCart size={18} /> View Cart ({cartCount})
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
