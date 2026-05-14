import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token refresh on 401
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${process.env.REACT_APP_API_URL}/auth/refresh-token`,
            { refreshToken }
          );
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.token}`;
          return API(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (data) => API.put('/auth/profile', data),
  logout: () => API.post('/auth/logout'),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// Restaurants
export const restaurantAPI = {
  getAll: (params) => API.get('/restaurants', { params }),
  getOne: (id) => API.get(`/restaurants/${id}`),
  create: (data) => API.post('/restaurants', data),
  update: (id, data) => API.put(`/restaurants/${id}`, data),
  delete: (id) => API.delete(`/restaurants/${id}`),
  toggle: (id) => API.put(`/restaurants/${id}/toggle`),
};

// Foods
export const foodAPI = {
  getAll: (params) => API.get('/foods', { params }),
  getOne: (id) => API.get(`/foods/${id}`),
  create: (data) => API.post('/foods', data),
  update: (id, data) => API.put(`/foods/${id}`, data),
  delete: (id) => API.delete(`/foods/${id}`),
};

// Orders
export const orderAPI = {
  create: (data) => API.post('/orders', data),
  getUserOrders: (params) => API.get('/orders/user', { params }),
  getAll: (params) => API.get('/orders/all', { params }),
  getOne: (id) => API.get(`/orders/${id}`),
  updateStatus: (id, data) => API.put(`/orders/${id}/status`, data),
  cancel: (id, data) => API.put(`/orders/${id}/cancel`, data),
};

// Payment
export const paymentAPI = {
  createOrder: (data) => API.post('/payment/create-order', data),
  verify: (data) => API.post('/payment/verify', data),
};

// Categories
export const categoryAPI = {
  getAll: () => API.get('/categories'),
};

// Reviews
export const reviewAPI = {
  create: (data) => API.post('/reviews', data),
  getByRestaurant: (restaurantId, params) => API.get(`/reviews/restaurant/${restaurantId}`, { params }),
};

// User
export const userAPI = {
  addAddress: (data) => API.post('/users/addresses', data),
  deleteAddress: (id) => API.delete(`/users/addresses/${id}`),
  toggleWishlist: (restaurantId) => API.post(`/users/wishlist/${restaurantId}`),
  getWishlist: () => API.get('/users/wishlist'),
};

// Admin
export const adminAPI = {
  getAnalytics: () => API.get('/admin/analytics'),
  getUsers: (params) => API.get('/admin/users', { params }),
  toggleUser: (id) => API.put(`/admin/users/${id}/toggle`),
};

export default API;
