/**
 * dev-server.js — starts the server with an in-memory MongoDB instance
 * so you can run without installing MongoDB locally.
 * Run: node dev-server.js
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function startDevServer() {
  console.log('🔧 Starting in-memory MongoDB...');
  const mongod = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  process.env.PORT = process.env.PORT || '5000';
  process.env.JWT_SECRET = 'dev_secret_key_foodflash_2024';
  process.env.JWT_REFRESH_SECRET = 'dev_refresh_secret_key_2024';
  process.env.CLIENT_URL = 'http://localhost:3000';

  console.log(`✅ MongoDB started: ${uri}`);

  await mongoose.connect(uri);

  // Seed demo data
  const User = require('./models/User');
  const Restaurant = require('./models/Restaurant');
  const FoodItem = require('./models/FoodItem');
  const Category = require('./models/Category');

  console.log('🌱 Seeding demo data...');

  const categories = await Category.insertMany([
    { name: 'Pizza', icon: '🍕', order: 1 },
    { name: 'Burgers', icon: '🍔', order: 2 },
    { name: 'Biryani', icon: '🍚', order: 3 },
    { name: 'Chinese', icon: '🍜', order: 4 },
    { name: 'South Indian', icon: '🥞', order: 5 },
    { name: 'Desserts', icon: '🍰', order: 6 },
    { name: 'Drinks', icon: '🥤', order: 7 },
  ]);

  const salt = await bcrypt.genSalt(12);
  const pw = await bcrypt.hash('password123', salt);

  const users = await User.insertMany([
    { name: 'Admin User', email: 'admin@foodapp.com', password: pw, role: 'admin', phone: '9999999999', isEmailVerified: true },
    { name: 'Rahul Kumar', email: 'customer@foodapp.com', password: pw, role: 'customer', phone: '8888888888', isEmailVerified: true },
    { name: 'Delivery Guy', email: 'delivery@foodapp.com', password: pw, role: 'delivery', phone: '7777777777', isEmailVerified: true },
    { name: 'Restaurant Owner', email: 'owner@foodapp.com', password: pw, role: 'restaurant_owner', phone: '6666666666', isEmailVerified: true },
  ]);

  const restaurants = await Restaurant.insertMany([
    {
      name: 'Spice Garden', description: 'Authentic Indian flavors with a modern twist',
      owner: users[3]._id, cuisine: ['Indian', 'Biryani', 'Curry'], categories: [categories[2]._id],
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
      address: { street: '12 MG Road', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751001', coordinates: { lat: 20.2961, lng: 85.8245 } },
      phone: '0674-1234567', deliveryTime: '30-45 min', deliveryFee: 25, avgRating: 4.5, totalReviews: 128, isOpen: true, isFeatured: true,
      offers: [{ title: '20% OFF', description: 'Get 20% off on orders above ₹299', discount: 20, minOrder: 299, code: 'SPICE20' }]
    },
    {
      name: 'Burger Barn', description: 'Juicy gourmet burgers made fresh daily',
      owner: users[3]._id, cuisine: ['American', 'Fast Food', 'Burgers'], categories: [categories[1]._id],
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      address: { street: '45 Janpath', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751001', coordinates: { lat: 20.3009, lng: 85.8193 } },
      phone: '0674-2345678', deliveryTime: '20-30 min', deliveryFee: 20, avgRating: 4.2, totalReviews: 89, isOpen: true, isFeatured: true,
    },
    {
      name: 'Pizza Paradise', description: 'Wood-fired pizzas with premium toppings',
      owner: users[3]._id, cuisine: ['Italian', 'Pizza', 'Pasta'], categories: [categories[0]._id],
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
      address: { street: '78 Bapuji Nagar', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751009', coordinates: { lat: 20.2874, lng: 85.8152 } },
      phone: '0674-3456789', deliveryTime: '25-40 min', deliveryFee: 30, avgRating: 4.7, totalReviews: 210, isOpen: true, isFeatured: true,
      offers: [{ title: 'Buy 1 Get 1', description: 'Buy any large pizza, get a medium free', discount: 50, minOrder: 499, code: 'BOGO' }]
    },
    {
      name: 'Dragon Wok', description: 'Authentic Chinese & Pan-Asian cuisine',
      owner: users[3]._id, cuisine: ['Chinese', 'Thai', 'Asian'], categories: [categories[3]._id],
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400',
      address: { street: '23 Saheed Nagar', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751007', coordinates: { lat: 20.3030, lng: 85.8277 } },
      phone: '0674-4567890', deliveryTime: '35-50 min', deliveryFee: 35, avgRating: 4.0, totalReviews: 67, isOpen: true,
    },
  ]);

  await FoodItem.insertMany([
    { name: 'Chicken Biryani', description: 'Aromatic basmati rice with tender chicken', price: 299, restaurant: restaurants[0]._id, category: categories[2]._id, isVeg: false, isBestseller: true, image: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300', spiceLevel: 'medium', prepTime: 25, ratings: { avg: 4.6, count: 89 } },
    { name: 'Paneer Butter Masala', description: 'Soft paneer in rich tomato-based gravy', price: 249, restaurant: restaurants[0]._id, category: categories[2]._id, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300', spiceLevel: 'mild', prepTime: 20, ratings: { avg: 4.4, count: 56 } },
    { name: 'Dal Makhani', description: 'Slow-cooked black lentils in buttery gravy', price: 199, restaurant: restaurants[0]._id, category: categories[2]._id, isVeg: true, image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=300', spiceLevel: 'mild', prepTime: 20 },
    { name: 'Butter Naan', description: 'Freshly baked, buttered leavened bread', price: 49, restaurant: restaurants[0]._id, category: categories[2]._id, isVeg: true, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300', prepTime: 10 },
    { name: 'Classic Smash Burger', description: 'Double patty with special sauce', price: 249, restaurant: restaurants[1]._id, category: categories[1]._id, isVeg: false, isBestseller: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300', prepTime: 15, ratings: { avg: 4.5, count: 72 } },
    { name: 'Crispy Chicken Burger', description: 'Fried chicken fillet with coleslaw', price: 229, restaurant: restaurants[1]._id, category: categories[1]._id, isVeg: false, image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=300', prepTime: 15 },
    { name: 'Veggie Burger', description: 'Crispy veggie patty with fresh veggies', price: 179, restaurant: restaurants[1]._id, category: categories[1]._id, isVeg: true, image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300', prepTime: 12 },
    { name: 'Loaded Fries', description: 'Crispy fries with cheese sauce', price: 149, restaurant: restaurants[1]._id, category: categories[1]._id, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300', prepTime: 10 },
    { name: 'Margherita', description: 'Classic tomato, mozzarella, basil', price: 299, restaurant: restaurants[2]._id, category: categories[0]._id, isVeg: true, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300', prepTime: 20, ratings: { avg: 4.6, count: 110 } },
    { name: 'BBQ Chicken Pizza', description: 'BBQ sauce, grilled chicken, red onions', price: 399, restaurant: restaurants[2]._id, category: categories[0]._id, isVeg: false, isBestseller: true, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300', prepTime: 22, ratings: { avg: 4.7, count: 94 } },
    { name: 'Paneer Tikka Pizza', description: 'Spicy marinated paneer with capsicum', price: 349, restaurant: restaurants[2]._id, category: categories[0]._id, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=300', prepTime: 20 },
    { name: 'Chicken Fried Rice', description: 'Wok-tossed rice with egg and vegetables', price: 199, restaurant: restaurants[3]._id, category: categories[3]._id, isVeg: false, isBestseller: true, image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300', prepTime: 18 },
    { name: 'Hakka Noodles', description: 'Stir-fried noodles with veggies', price: 179, restaurant: restaurants[3]._id, category: categories[3]._id, isVeg: true, image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300', prepTime: 15 },
    { name: 'Chilli Chicken', description: 'Crispy chicken in chilli garlic sauce', price: 249, restaurant: restaurants[3]._id, category: categories[3]._id, isVeg: false, isBestseller: true, image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300', spiceLevel: 'hot', prepTime: 20, ratings: { avg: 4.3, count: 52 } },
  ]);

  // Disconnect the seeding connection — server/index.js will reconnect via env
  await mongoose.disconnect();

  console.log('\n✅ Demo data seeded!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Demo Login Credentials:');
  console.log('   Customer:  customer@foodapp.com / password123');
  console.log('   Admin:     admin@foodapp.com / password123');
  console.log('   Delivery:  delivery@foodapp.com / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Now start the actual Express server
  require('./index.js');
}

startDevServer().catch(err => {
  console.error('❌ Failed to start dev server:', err);
  process.exit(1);
});
