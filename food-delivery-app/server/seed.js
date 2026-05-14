const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const FoodItem = require('./models/FoodItem');
const Category = require('./models/Category');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/food_delivery');
  console.log('Connected to DB');

  // Clear existing
  await Promise.all([User.deleteMany(), Restaurant.deleteMany(), FoodItem.deleteMany(), Category.deleteMany()]);
  console.log('Cleared existing data');

  // Categories
  const categories = await Category.insertMany([
    { name: 'Pizza', icon: '🍕', order: 1 },
    { name: 'Burgers', icon: '🍔', order: 2 },
    { name: 'Biryani', icon: '🍚', order: 3 },
    { name: 'Chinese', icon: '🍜', order: 4 },
    { name: 'South Indian', icon: '🥞', order: 5 },
    { name: 'Desserts', icon: '🍰', order: 6 },
    { name: 'Drinks', icon: '🥤', order: 7 },
    { name: 'Rolls', icon: '🌯', order: 8 },
  ]);
  console.log('Categories seeded');

  // Users
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const users = await User.insertMany([
    { name: 'Admin User', email: 'admin@foodapp.com', password: hashedPassword, role: 'admin', phone: '9999999999', isEmailVerified: true },
    { name: 'Rahul Kumar', email: 'customer@foodapp.com', password: hashedPassword, role: 'customer', phone: '8888888888', isEmailVerified: true },
    { name: 'Delivery Guy', email: 'delivery@foodapp.com', password: hashedPassword, role: 'delivery', phone: '7777777777', isEmailVerified: true },
    { name: 'Restaurant Owner', email: 'owner@foodapp.com', password: hashedPassword, role: 'restaurant_owner', phone: '6666666666', isEmailVerified: true },
  ]);
  console.log('Users seeded');

  // Restaurants
  const restaurants = await Restaurant.insertMany([
    {
      name: "Spice Garden", description: "Authentic Indian flavors with a modern twist",
      owner: users[3]._id, cuisine: ['Indian', 'Biryani', 'Curry'],
      categories: [categories[2]._id],
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
      address: { street: '12 MG Road', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751001', coordinates: { lat: 20.2961, lng: 85.8245 } },
      phone: '0674-1234567', deliveryTime: '30-45 min', deliveryFee: 25, avgRating: 4.5, totalReviews: 128, isOpen: true, isFeatured: true,
      offers: [{ title: '20% OFF', description: 'Get 20% off on orders above ₹299', discount: 20, minOrder: 299, code: 'SPICE20' }]
    },
    {
      name: "Burger Barn", description: "Juicy gourmet burgers made fresh daily",
      owner: users[3]._id, cuisine: ['American', 'Fast Food', 'Burgers'],
      categories: [categories[1]._id],
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      address: { street: '45 Janpath', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751001', coordinates: { lat: 20.3009, lng: 85.8193 } },
      phone: '0674-2345678', deliveryTime: '20-30 min', deliveryFee: 20, avgRating: 4.2, totalReviews: 89, isOpen: true, isFeatured: true,
    },
    {
      name: "Pizza Paradise", description: "Wood-fired pizzas with premium toppings",
      owner: users[3]._id, cuisine: ['Italian', 'Pizza', 'Pasta'],
      categories: [categories[0]._id],
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
      address: { street: '78 Bapuji Nagar', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751009', coordinates: { lat: 20.2874, lng: 85.8152 } },
      phone: '0674-3456789', deliveryTime: '25-40 min', deliveryFee: 30, avgRating: 4.7, totalReviews: 210, isOpen: true, isFeatured: false,
      offers: [{ title: 'Buy 1 Get 1', description: 'Buy any large pizza, get a medium free', discount: 50, minOrder: 499, code: 'BOGO' }]
    },
    {
      name: "Dragon Wok", description: "Authentic Chinese & Pan-Asian cuisine",
      owner: users[3]._id, cuisine: ['Chinese', 'Thai', 'Asian'],
      categories: [categories[3]._id],
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400',
      address: { street: '23 Saheed Nagar', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751007', coordinates: { lat: 20.3030, lng: 85.8277 } },
      phone: '0674-4567890', deliveryTime: '35-50 min', deliveryFee: 35, avgRating: 4.0, totalReviews: 67, isOpen: true,
    },
  ]);
  console.log('Restaurants seeded');

  // Food Items
  await FoodItem.insertMany([
    // Spice Garden
    { name: 'Chicken Biryani', description: 'Aromatic basmati rice with tender chicken', price: 299, restaurant: restaurants[0]._id, category: categories[2]._id, isVeg: false, isBestseller: true, image: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300', spiceLevel: 'medium', prepTime: 25, ratings: { avg: 4.6, count: 89 } },
    { name: 'Paneer Butter Masala', description: 'Soft paneer in rich tomato-based gravy', price: 249, restaurant: restaurants[0]._id, category: categories[2]._id, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300', spiceLevel: 'mild', prepTime: 20, ratings: { avg: 4.4, count: 56 } },
    { name: 'Dal Makhani', description: 'Slow-cooked black lentils in buttery gravy', price: 199, restaurant: restaurants[0]._id, category: categories[2]._id, isVeg: true, image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=300', spiceLevel: 'mild', prepTime: 20, ratings: { avg: 4.3, count: 34 } },
    { name: 'Naan', description: 'Freshly baked leavened bread', price: 49, restaurant: restaurants[0]._id, category: categories[2]._id, isVeg: true, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300', prepTime: 10 },
    // Burger Barn
    { name: 'Classic Smash Burger', description: 'Double patty with special sauce and crispy lettuce', price: 249, restaurant: restaurants[1]._id, category: categories[1]._id, isVeg: false, isBestseller: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300', prepTime: 15, ratings: { avg: 4.5, count: 72 } },
    { name: 'Crispy Chicken Burger', description: 'Fried chicken fillet with coleslaw', price: 229, restaurant: restaurants[1]._id, category: categories[1]._id, isVeg: false, image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=300', prepTime: 15, ratings: { avg: 4.3, count: 45 } },
    { name: 'Veggie Burger', description: 'Crispy veggie patty with fresh veggies', price: 179, restaurant: restaurants[1]._id, category: categories[1]._id, isVeg: true, image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300', prepTime: 12, ratings: { avg: 4.1, count: 28 } },
    { name: 'Loaded Fries', description: 'Crispy fries with cheese sauce and jalapeños', price: 149, restaurant: restaurants[1]._id, category: categories[1]._id, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300', prepTime: 10 },
    // Pizza Paradise
    { name: 'Margherita', description: 'Classic tomato sauce, mozzarella, fresh basil', price: 299, restaurant: restaurants[2]._id, category: categories[0]._id, isVeg: true, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300', prepTime: 20, ratings: { avg: 4.6, count: 110 } },
    { name: 'BBQ Chicken Pizza', description: 'BBQ sauce, grilled chicken, red onions', price: 399, restaurant: restaurants[2]._id, category: categories[0]._id, isVeg: false, isBestseller: true, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300', prepTime: 22, ratings: { avg: 4.7, count: 94 } },
    { name: 'Paneer Tikka Pizza', description: 'Spicy marinated paneer with capsicum', price: 349, restaurant: restaurants[2]._id, category: categories[0]._id, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=300', prepTime: 20 },
    // Dragon Wok
    { name: 'Chicken Fried Rice', description: 'Wok-tossed rice with egg and vegetables', price: 199, restaurant: restaurants[3]._id, category: categories[3]._id, isVeg: false, isBestseller: true, image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300', prepTime: 18, ratings: { avg: 4.1, count: 38 } },
    { name: 'Hakka Noodles', description: 'Stir-fried noodles with veggies and soy', price: 179, restaurant: restaurants[3]._id, category: categories[3]._id, isVeg: true, image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300', prepTime: 15 },
    { name: 'Chilli Chicken', description: 'Crispy chicken tossed in chilli garlic sauce', price: 249, restaurant: restaurants[3]._id, category: categories[3]._id, isVeg: false, isBestseller: true, image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300', spiceLevel: 'hot', prepTime: 20, ratings: { avg: 4.3, count: 52 } },
  ]);
  console.log('Food items seeded');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin:    admin@foodapp.com / password123');
  console.log('  Customer: customer@foodapp.com / password123');
  console.log('  Delivery: delivery@foodapp.com / password123');
  console.log('  Owner:    owner@foodapp.com / password123');

  mongoose.disconnect();
};

seed().catch(err => { console.error(err); mongoose.disconnect(); });
