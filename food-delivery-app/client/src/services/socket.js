import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket'],
    });
    socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const joinOrderRoom = (orderId) => socket?.emit('join_order', orderId);
export const joinRestaurantRoom = (restaurantId) => socket?.emit('join_restaurant', restaurantId);
export const sendLocation = (data) => socket?.emit('update_location', data);

export default { connectSocket, getSocket, disconnectSocket, joinOrderRoom, joinRestaurantRoom, sendLocation };
