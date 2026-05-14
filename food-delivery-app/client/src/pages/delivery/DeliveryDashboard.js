import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { orderAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Truck, MapPin, CheckCircle, Clock, Package, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUS_FLOW = { picked_up: 'out_for_delivery', out_for_delivery: 'delivered' };
const STATUS_LABELS = { pending: '⏳ Pending', confirmed: '✅ Confirmed', preparing: '👨‍🍳 Preparing', ready: '📦 Ready for Pickup', picked_up: '🛵 Picked Up', out_for_delivery: '🚀 Out for Delivery', delivered: '✅ Delivered' };

export default function DeliveryDashboard() {
  const { user } = useSelector(s => s.auth);
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('available');
  const socketRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [avail, mine] = await Promise.all([
        orderAPI.getAll({ status: 'ready', limit: 20 }),
        orderAPI.getUserOrders({ limit: 20 })
      ]);
      setAvailable(avail.data.data || []);
      setMyDeliveries(mine.data.data?.filter(o => o.deliveryPartner === user?._id || ['picked_up','out_for_delivery'].includes(o.orderStatus)) || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Socket for live location
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    socket.emit('join_delivery', user?._id);
    return () => socket.off();
  }, [user]);

  const sendLocation = (orderId) => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      socketRef.current?.emit('update_location', { orderId, lat: coords.latitude, lng: coords.longitude });
      toast.success('Location updated!');
    }, () => toast.error('Could not get location'));
  };

  const handleAccept = async (orderId) => {
    try {
      await orderAPI.updateStatus(orderId, { status: 'picked_up', note: 'Picked up by delivery partner' });
      toast.success('Order accepted!');
      load();
    } catch { toast.error('Failed to accept'); }
  };

  const handleNextStatus = async (order) => {
    const next = STATUS_FLOW[order.orderStatus];
    if (!next) return;
    try {
      await orderAPI.updateStatus(order._id, { status: next });
      toast.success(`Marked as ${next.replace(/_/g, ' ')}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const OrderCard = ({ order, isActive }) => (
    <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{order.restaurant?.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{order.orderNumber}</div>
        </div>
        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{order.pricing?.total}</div>
      </div>
      <div style={{ padding: '1rem 1.25rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem', display: 'flex', gap: 6 }}>
          <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          {order.items?.map(i => `${i.name} ×${i.quantity}`).join(', ')}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isActive ? (
            <button onClick={() => handleAccept(order._id)} className="btn btn-primary" style={{ flex: 1 }}>
              Accept Order
            </button>
          ) : (
            <>
              <button onClick={() => sendLocation(order._id)} style={{ padding: '0.6rem 1rem', background: 'rgba(33,150,243,0.1)', border: '1px solid rgba(33,150,243,0.3)', borderRadius: 10, color: '#2196F3', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} /> Update Location
              </button>
              {STATUS_FLOW[order.orderStatus] && (
                <button onClick={() => handleNextStatus(order)} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <CheckCircle size={14} /> Mark {STATUS_FLOW[order.orderStatus]?.replace(/_/g, ' ')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Truck size={24} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Delivery Partner</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.name}</div>
          </div>
        </div>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <LogOut size={16} /> Exit
        </Link>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: 600, margin: '0 auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 12, padding: 4, marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
          {[['available', <Package size={14} />, 'Available Orders'], ['active', <Truck size={14} />, 'My Deliveries']].map(([t, icon, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: 'none', background: tab === t ? 'var(--primary)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
        ) : tab === 'available' ? (
          available.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <Clock size={48} style={{ marginBottom: 16 }} />
              <h3>No orders available</h3>
              <p style={{ marginTop: 8 }}>Check back soon for new delivery requests</p>
            </div>
          ) : available.map(o => <OrderCard key={o._id} order={o} isActive={false} />)
        ) : (
          myDeliveries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <Truck size={48} style={{ marginBottom: 16 }} />
              <h3>No active deliveries</h3>
              <p style={{ marginTop: 8 }}>Accept an order to start delivering</p>
            </div>
          ) : myDeliveries.map(o => <OrderCard key={o._id} order={o} isActive={true} />)
        )}
      </div>
    </div>
  );
}
