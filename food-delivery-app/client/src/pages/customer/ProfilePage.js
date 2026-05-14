import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { authAPI } from '../../services/api';
import { updateUser } from '../../redux/slices/authSlice';
import { User, Phone, Mail, Shield, Save, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      dispatch(updateUser(data.user));
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    setSaving(false);
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    setChangingPw(true);
    try {
      await authAPI.changePassword(pwForm);
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    setChangingPw(false);
  };

  const card = (children, title) => (
    <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '1.5rem' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '1rem' }}>{title}</div>
      <div style={{ padding: '1.5rem' }}>{children}</div>
    </div>
  );

  return (
    <div className="page" style={{ paddingTop: 80 }}>
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: 560 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <User size={32} color="var(--primary)" /> My Profile
        </h1>

        {/* Avatar + Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #FF8A65)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 800 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{user?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Mail size={13} /> {user?.email}
            </div>
            <span style={{ display: 'inline-block', marginTop: 6, padding: '0.2rem 0.7rem', background: 'rgba(255,87,34,0.12)', color: 'var(--primary)', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
              <Shield size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{user?.role}
            </span>
          </div>
        </div>

        {card(
          <form onSubmit={handleSave}>
            {[['name', 'Full Name', 'text', User], ['phone', 'Phone Number', 'tel', Phone]].map(([field, label, type, Icon]) => (
              <div key={field} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <Icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type={type} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                    style={{ paddingLeft: 40 }} />
                </div>
              </div>
            ))}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>Email</label>
              <input type="email" value={user?.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {saving ? <Loader size={16} /> : <Save size={16} />} {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>,
          '👤 Edit Profile'
        )}

        {card(
          <form onSubmit={handlePwChange}>
            {[['currentPassword', 'Current Password'], ['newPassword', 'New Password (min 6 chars)']].map(([field, label]) => (
              <div key={field} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>{label}</label>
                <input type="password" required value={pwForm[field]} onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })} placeholder="••••••••" />
              </div>
            ))}
            <button type="submit" disabled={changingPw} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {changingPw ? <><Loader size={16} /> Changing...</> : '🔒 Change Password'}
            </button>
          </form>,
          '🔐 Security'
        )}
      </div>
    </div>
  );
}
