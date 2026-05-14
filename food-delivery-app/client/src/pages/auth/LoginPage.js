import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../redux/slices/authSlice';
import { Eye, EyeOff, Utensils, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(loginUser(form));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Welcome back!');
      const role = res.payload.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'delivery') navigate('/delivery');
      else navigate('/');
    }
  };

  const fillDemo = (role) => {
    const creds = {
      customer: { email: 'customer@foodapp.com', password: 'password123' },
      admin: { email: 'admin@foodapp.com', password: 'password123' },
      delivery: { email: 'delivery@foodapp.com', password: 'password123' },
    };
    setForm(creds[role]);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ background: '#FF5722', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={22} color="#fff" />
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>FoodFlash</span>
          </div>
          <p style={{ color: '#999', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '2rem', border: '1px solid #2a2a2a', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>Email</label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '0.75rem 1rem', background: '#2a2a2a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '0.75rem 2.8rem 0.75rem 1rem', background: '#2a2a2a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '0.85rem', background: loading ? '#555' : '#FF5722', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
              {loading ? <><Loader size={18} className="spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Demo buttons */}
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ color: '#666', fontSize: '0.8rem', textAlign: 'center', marginBottom: '0.75rem' }}>Quick Demo Login</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['customer', 'admin', 'delivery'].map(role => (
                <button key={role} onClick={() => fillDemo(role)}
                  style={{ flex: 1, padding: '0.5rem', background: '#2a2a2a', border: '1px solid #333', borderRadius: 8, color: '#ccc', fontSize: '0.75rem', cursor: 'pointer', textTransform: 'capitalize', fontWeight: 600 }}>
                  {role}
                </button>
              ))}
            </div>
          </div>

          <p style={{ color: '#666', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#FF5722', textDecoration: 'none', fontWeight: 600 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
