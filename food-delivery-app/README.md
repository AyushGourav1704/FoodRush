# 🍔 FoodFlash — Full Stack Food Delivery App

A complete, production-ready Food Delivery Web Application built with **React.js**, **Node.js**, **Express.js**, and **Socket.IO**.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, Redux Toolkit, React Router v6 |
| Styling | Custom CSS Variables (dark theme), Lucide Icons |
| Animations | Framer Motion |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO |
| Database (demo) | NeDB (in-memory, zero setup) |
| Database (prod) | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Payments | Razorpay / Stripe ready |
| File Upload | Multer + Cloudinary ready |

---

## ✅ Features

### Customer Side
- 🏠 Landing Page with hero search
- 🍽️ Restaurant Listing with filters & sorting
- 📖 Restaurant Detail Page with full menu
- 🛒 Cart System (Redux, persisted)
- 💳 Checkout with address & payment selection
- 📍 Live Order Tracking with Socket.IO
- 📦 Order History with status filters
- 👤 Profile & Password Management
- ❤️ Wishlist / Favourites

### Admin Panel
- 📊 Analytics Dashboard (revenue, orders, users)
- 🍽️ Manage Restaurants (toggle open/close, delete)
- 📦 Manage Orders (update status live)
- 👥 User Management (ban/activate)

### Delivery Partner Panel
- 📋 View Available Orders
- ✅ Accept Orders
- 📍 Send Live GPS Location via Socket.IO
- 🔄 Update Delivery Status

---

## 🏃 HOW TO RUN (3 steps)

### Prerequisites
- Node.js v16+ installed → https://nodejs.org

### Step 1 — Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2 — Start the Backend

```bash
cd server
node standalone-demo.js
```

You will see:
```
✅ Demo data seeded!
🔑 Demo Login Credentials:
   Customer:  customer@foodapp.com  / password123
   Admin:     admin@foodapp.com     / password123
   Delivery:  delivery@foodapp.com  / password123
🚀 FoodFlash API running at http://localhost:5000
```

> **No MongoDB needed!** The demo server uses NeDB (embedded in-memory database).

### Step 3 — Start the Frontend

Open a **new terminal**:

```bash
cd client
npm start
```

Opens automatically at **http://localhost:3000** 🎉

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@foodapp.com | password123 |
| Admin | admin@foodapp.com | password123 |
| Delivery Partner | delivery@foodapp.com | password123 |

---

## 📁 Project Structure

```
food-delivery-app/
│
├── server/                        # Node.js Backend
│   ├── standalone-demo.js         # ⭐ Run this (no MongoDB needed)
│   ├── index.js                   # Production server (needs MongoDB)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── restaurantController.js
│   │   ├── foodController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── adminController.js
│   │   ├── deliveryController.js
│   │   ├── reviewController.js
│   │   ├── userController.js
│   │   └── categoryController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── FoodItem.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   ├── Review.js
│   │   └── Category.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── restaurantRoutes.js
│   │   ├── foodRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── deliveryRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── userRoutes.js
│   │   └── categoryRoutes.js
│   ├── middleware/
│   │   ├── auth.js               # JWT protect + authorize
│   │   └── error.js              # Global error handler
│   ├── sockets/
│   │   └── socket.js             # Socket.IO real-time events
│   └── utils/
│       ├── db.js                 # MongoDB connection
│       ├── jwt.js                # Token helpers
│       └── cloudinary.js         # Image upload
│
├── client/                        # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.js
│   │   │   │   └── SignupPage.js
│   │   │   ├── customer/
│   │   │   │   ├── LandingPage.js
│   │   │   │   ├── RestaurantsPage.js
│   │   │   │   ├── RestaurantDetailPage.js
│   │   │   │   ├── CartPage.js
│   │   │   │   ├── CheckoutPage.js
│   │   │   │   ├── OrderTrackingPage.js
│   │   │   │   ├── OrderHistoryPage.js
│   │   │   │   ├── ProfilePage.js
│   │   │   │   └── WishlistPage.js
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── AdminRestaurants.js
│   │   │   │   ├── AdminOrders.js
│   │   │   │   └── AdminUsers.js
│   │   │   └── delivery/
│   │   │       └── DeliveryDashboard.js
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.js
│   │   │   │   └── LoadingSpinner.js
│   │   │   └── customer/
│   │   │       └── RestaurantCard.js
│   │   ├── redux/
│   │   │   ├── store.js
│   │   │   └── slices/
│   │   │       ├── authSlice.js
│   │   │       └── cartSlice.js
│   │   ├── services/
│   │   │   ├── api.js            # Axios API client
│   │   │   └── socket.js         # Socket.IO client
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css             # Global dark theme styles
│   └── public/
│       └── index.html
│
└── README.md
```

---

## 🔧 Backend APIs

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/profile
POST   /api/auth/logout
PUT    /api/auth/change-password
POST   /api/auth/refresh-token
```

### Restaurants
```
GET    /api/restaurants            (search, filter, paginate)
GET    /api/restaurants/:id        (with menu)
POST   /api/restaurants            (admin)
PUT    /api/restaurants/:id        (admin)
DELETE /api/restaurants/:id        (admin)
PUT    /api/restaurants/:id/toggle (open/close)
```

### Foods
```
GET    /api/foods                  (filter by restaurant, category, veg)
GET    /api/foods/:id
POST   /api/foods                  (admin)
PUT    /api/foods/:id              (admin)
DELETE /api/foods/:id              (admin)
```

### Orders
```
POST   /api/orders                 (place order)
GET    /api/orders/user            (my orders)
GET    /api/orders/all             (admin)
GET    /api/orders/:id
PUT    /api/orders/:id/status      (admin/delivery)
PUT    /api/orders/:id/cancel
```

### Payment
```
POST   /api/payment/create-order
POST   /api/payment/verify
```

### Admin
```
GET    /api/admin/analytics
GET    /api/admin/users
PUT    /api/admin/users/:id/toggle
```

---

## 🔌 Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_order` | Client → Server | Track a specific order |
| `join_restaurant` | Client → Server | Restaurant listens for orders |
| `order_status_update` | Server → Client | Real-time status push |
| `new_order` | Server → Restaurant | New order notification |
| `update_location` | Delivery → Server | GPS coordinates |
| `delivery_location` | Server → Customer | Live delivery location |

---

## 🌐 Deployment (Production)

### Frontend → Vercel
```bash
cd client
npm run build
# Deploy /build folder to Vercel
```

### Backend → Render
- Set env var: `MONGO_URI=mongodb+srv://...`
- Set env var: `JWT_SECRET=your_secret`
- Entry point: `node index.js`

### Database → MongoDB Atlas
- Free cluster at https://cloud.mongodb.com
- Whitelist 0.0.0.0/0 for Render

---

## 🔥 For Production (with real MongoDB)

1. Copy `.env.example` to `.env`
2. Fill in your `MONGO_URI`, `JWT_SECRET`, Razorpay/Cloudinary keys
3. Run: `node index.js` instead of `standalone-demo.js`
4. Run: `node seed.js` to seed initial data

---

## 📝 Resume Description

> Developed a scalable full-stack Food Delivery Web Application using **React.js**, **Node.js**, **Express.js** with JWT authentication, **Redux Toolkit** state management, **Socket.IO** real-time order tracking, Razorpay payment integration, and an Admin Dashboard with analytics. Features include live GPS delivery tracking, cart management, order history, and role-based access (Customer, Admin, Delivery Partner).

---

Built with ❤️ | Good luck with your submission! 🚀
