import { createSlice } from '@reduxjs/toolkit';

const loadCart = () => {
  try { return JSON.parse(localStorage.getItem('cart') || '{"items":[],"restaurantId":null,"restaurantName":""}'); }
  catch { return { items: [], restaurantId: null, restaurantName: '' }; }
};

const saveCart = (state) => {
  localStorage.setItem('cart', JSON.stringify({ items: state.items, restaurantId: state.restaurantId, restaurantName: state.restaurantName }));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: loadCart(),
  reducers: {
    addItem(state, { payload }) {
      const { item, restaurantId, restaurantName } = payload;
      // Clear cart if different restaurant
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        state.items = [];
      }
      state.restaurantId = restaurantId;
      state.restaurantName = restaurantName;

      const existing = state.items.find(i => i._id === item._id);
      if (existing) existing.quantity += 1;
      else state.items.push({ ...item, quantity: 1 });
      saveCart(state);
    },
    removeItem(state, { payload }) {
      state.items = state.items.filter(i => i._id !== payload);
      if (state.items.length === 0) { state.restaurantId = null; state.restaurantName = ''; }
      saveCart(state);
    },
    updateQuantity(state, { payload: { id, quantity } }) {
      const item = state.items.find(i => i._id === id);
      if (item) {
        if (quantity <= 0) state.items = state.items.filter(i => i._id !== id);
        else item.quantity = quantity;
      }
      if (state.items.length === 0) { state.restaurantId = null; state.restaurantName = ''; }
      saveCart(state);
    },
    clearCart(state) {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = '';
      localStorage.removeItem('cart');
    }
  }
});

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;

export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + (i.discountedPrice || i.price) * i.quantity, 0);
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);

export default cartSlice.reducer;
