const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Customer joins order room for live tracking
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Customer joined order room: order_${orderId}`);
    });

    // Restaurant joins its own room to receive new orders
    socket.on('join_restaurant', (restaurantId) => {
      socket.join(`restaurant_${restaurantId}`);
      console.log(`Restaurant joined room: restaurant_${restaurantId}`);
    });

    // Delivery partner joins their room
    socket.on('join_delivery', (partnerId) => {
      socket.join(`delivery_${partnerId}`);
    });

    // Delivery partner sends live location update
    socket.on('update_location', ({ orderId, lat, lng }) => {
      // Broadcast location to customer watching this order
      io.to(`order_${orderId}`).emit('delivery_location', { lat, lng, updatedAt: new Date() });
    });

    // Order status updated (by restaurant/admin)
    socket.on('order_status_change', ({ orderId, status, note }) => {
      io.to(`order_${orderId}`).emit('order_status_update', { orderId, status, note, timestamp: new Date() });
    });

    // Notification broadcast
    socket.on('send_notification', ({ userId, message, type }) => {
      io.to(`user_${userId}`).emit('notification', { message, type, timestamp: new Date() });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };
