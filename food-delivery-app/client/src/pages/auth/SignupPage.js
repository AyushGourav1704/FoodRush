import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../redux/slices/authSlice';
import { Eye, EyeOff, Utensils, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    const res = await dispatch(registerUser(form));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Account created!');
      navigate('/');
    }
  };

  const inp = (field, label, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>{label}</label>
      <input type={type} required value={form[field]} placeholder={placeholder}
        onChange={e => setForm({ ...form, [field]: e.target.value })}
        style={{ width: '100%', padding: '0.75rem 1rem', background: '#2a2a2a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: '#FF5722', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={22} color="#fff" />
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>FoodFlash</span>
          </div>
          <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '0.5rem' }}>Create your account</p>
        </div>
        <div style={{ background: '#1e1e1e', borderRadius: 16, padding: '2rem', border: '1px solid #2a2a2a' }}>
          <form onSubmit={handleSubmit}>
            {inp('name', 'Full Name', 'text', 'John Doe')}
            {inp('email', 'Email', 'email', 'you@example.com')}
            {inp('phone', 'Phone', 'tel', '9876543210')}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} required value={form.password} placeholder="Min 6 characters"
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 2.8rem 0.75rem 1rem', background: '#2a2a2a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                style={{ width: '100%', padding: '0.75rem 1rem', background: '#2a2a2a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}>
                <option value="customer">Customer</option>
                <option value="delivery">Delivery Partner</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '0.85rem', background: loading ? '#555' : '#FF5722', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? <><Loader size={18} /> Creating Account...</> : 'Create Account'}
            </button>
          </form>
          <p style={{ color: '#666', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#FF5722', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
