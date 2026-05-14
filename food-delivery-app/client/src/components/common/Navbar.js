import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, User, LogOut, Heart, Package, LayoutDashboard, Truck, Menu, X } from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { selectCartCount } from '../../redux/slices/cartSlice';
import toast from 'react-hot-toast';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector(s => s.auth);
  const cartCount = useSelector(selectCartCount);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out!');
    navigate('/');
  };

  const navLinks = [
    { to: '/restaurants', label: 'Restaurants' },
    ...(isAuthenticated ? [
      { to: '/orders', label: 'Orders', icon: <Package size={14} /> },
      { to: '/wishlist', label: 'Saved', icon: <Heart size={14} /> },
    ] : []),
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid #1e1e1e', height: 72,
      display: 'flex', alignItems: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 18 }}>🍔</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>
            Food<span style={{ color: 'var(--primary)' }}>Rush</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="btn btn-ghost" style={{
              fontSize: 14,
              color: location.pathname === link.to ? 'var(--primary)' : 'var(--text-muted)',
              padding: '8px 16px'
            }}>
              {link.icon} {link.label}
            </Link>
          ))}

          {/* Admin/Delivery shortcuts */}
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn btn-ghost" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              <LayoutDashboard size={14} /> Admin
            </Link>
          )}
          {user?.role === 'delivery' && (
            <Link to="/delivery" className="btn btn-ghost" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              <Truck size={14} /> Delivery
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Cart */}
          <Link to="/cart" style={{ position: 'relative', display: 'grid', placeItems: 'center', padding: 10, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--primary)', color: 'white',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center'
              }}>{cartCount}</span>
            )}
          </Link>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 14 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ color: 'var(--text-muted)' }}>{user?.name?.split(' ')[0]}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: 10 }}>
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" className="btn btn-outline" style={{ padding: '8px 18px', fontSize: 14 }}>Login</Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
