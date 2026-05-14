import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchProfile } from './redux/slices/authSlice';

// Pages - Auth
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Pages - Customer
import LandingPage from './pages/customer/LandingPage';
import RestaurantsPage from './pages/customer/RestaurantsPage';
import RestaurantDetailPage from './pages/customer/RestaurantDetailPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';
import ProfilePage from './pages/customer/ProfilePage';
import WishlistPage from './pages/customer/WishlistPage';

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';

// Pages - Delivery
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

// Components
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated, loading } = useSelector(s => s.auth);
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(s => s.auth);
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

export default function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector(s => s.auth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) dispatch(fetchProfile());
  }, [dispatch]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' },
          success: { iconTheme: { primary: '#FF5722', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public Auth */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* Customer Routes */}
        <Route path="/" element={<><Navbar /><LandingPage /></>} />
        <Route path="/restaurants" element={<><Navbar /><RestaurantsPage /></>} />
        <Route path="/restaurants/:id" element={<><Navbar /><RestaurantDetailPage /></>} />
        <Route path="/cart" element={<ProtectedRoute><Navbar /><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Navbar /><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders/:id/track" element={<ProtectedRoute><Navbar /><OrderTrackingPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Navbar /><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Navbar /><ProfilePage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Navbar /><WishlistPage /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/restaurants" element={<ProtectedRoute roles={['admin']}><AdminRestaurants /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />

        {/* Delivery Routes */}
        <Route path="/delivery" element={<ProtectedRoute roles={['delivery']}><DeliveryDashboard /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
