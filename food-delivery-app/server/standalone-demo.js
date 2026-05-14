/**
 * standalone-demo.js
 * Self-contained Food Delivery API server using NeDB (embedded NoSQL).
 * NO MongoDB installation required. Run: node standalone-demo.js
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const Datastore = require('@seald-io/nedb');

const app = express();
const server = http.createServer(app);
const PORT = 5000;
const JWT_SECRET = 'foodflash_dev_secret_2024';

// ─── In-memory databases ─────────────────────────────────────────────────────
const db = {
  users:       new Datastore({ inMemoryOnly: true }),
  restaurants: new Datastore({ inMemoryOnly: true }),
  foods:       new Datastore({ inMemoryOnly: true }),
  categories:  new Datastore({ inMemoryOnly: true }),
  orders:      new Datastore({ inMemoryOnly: true }),
  payments:    new Datastore({ inMemoryOnly: true }),
  reviews:     new Datastore({ inMemoryOnly: true }),
};
Object.values(db).forEach(d => d.ensureIndex && null);

// ─── Promisify NeDB ───────────────────────────────────────────────────────────
const asyncDB = (store) => ({
  find:    (q, proj)    => new Promise((r, j) => proj ? store.find(q, proj, (e, d) => e ? j(e) : r(d)) : store.find(q, (e, d) => e ? j(e) : r(d))),
  findOne: (q, proj)    => new Promise((r, j) => proj ? store.findOne(q, proj, (e, d) => e ? j(e) : r(d)) : store.findOne(q, (e, d) => e ? j(e) : r(d))),
  insert:  (doc)        => new Promise((r, j) => store.insert(doc, (e, d) => e ? j(e) : r(d))),
  update:  (q, u, opts) => new Promise((r, j) => store.update(q, u, opts || {}, (e, n, d) => e ? j(e) : r(d))),
  remove:  (q, opts)    => new Promise((r, j) => store.remove(q, opts || {}, (e, n) => e ? j(e) : r(n))),
  count:   (q)          => new Promise((r, j) => store.count(q, (e, n) => e ? j(e) : r(n))),
});
const D = {
  users:       asyncDB(db.users),
  restaurants: asyncDB(db.restaurants),
  foods:       asyncDB(db.foods),
  categories:  asyncDB(db.categories),
  orders:      asyncDB(db.orders),
  payments:    asyncDB(db.payments),
  reviews:     asyncDB(db.reviews),
};

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true }
});
io.on('connection', socket => {
  socket.on('join_order',      orderId      => socket.join(`order_${orderId}`));
  socket.on('join_restaurant', restaurantId => socket.join(`restaurant_${restaurantId}`));
  socket.on('join_delivery',   partnerId    => socket.join(`delivery_${partnerId}`));
  socket.on('update_location', ({ orderId, lat, lng }) => {
    io.to(`order_${orderId}`).emit('delivery_location', { lat, lng, updatedAt: new Date() });
  });
  socket.on('order_status_change', ({ orderId, status, note }) => {
    io.to(`order_${orderId}`).emit('order_status_update', { orderId, status, note, timestamp: new Date() });
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await D.users.findOne({ _id: decoded.id });
    if (!req.user) throw new Error('User not found');
    next();
  } catch { res.status(401).json({ success: false, message: 'Invalid token' }); }
};

const adminOnly = [auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  next();
}];

// ─── Helpers ─────────────────────────────────────────────────────────────────
let orderCounter = 1000;
const genOrderNum = () => `FD${Date.now()}${orderCounter++}`.slice(0, 15);

const safeUser = (u) => { const { password, ...rest } = u; return rest; };

// ─── SEED DATA ────────────────────────────────────────────────────────────────
async function seed() {
  const salt = await bcrypt.genSalt(12);
  const pw = await bcrypt.hash('password123', salt);

  const cats = await D.categories.insert([
    { name: 'Pizza', icon: '🍕', order: 1 },
    { name: 'Burgers', icon: '🍔', order: 2 },
    { name: 'Biryani', icon: '🍚', order: 3 },
    { name: 'Chinese', icon: '🍜', order: 4 },
    { name: 'South Indian', icon: '🥞', order: 5 },
    { name: 'Desserts', icon: '🍰', order: 6 },
    { name: 'Drinks', icon: '🥤', order: 7 },
  ]);

  const users = await D.users.insert([
    { name: 'Admin User',      email: 'admin@foodapp.com',    password: pw, role: 'admin',            phone: '9999999999', isActive: true, addresses: [], wishlist: [] },
    { name: 'Rahul Kumar',     email: 'customer@foodapp.com', password: pw, role: 'customer',         phone: '8888888888', isActive: true, addresses: [], wishlist: [] },
    { name: 'Delivery Guy',    email: 'delivery@foodapp.com', password: pw, role: 'delivery',         phone: '7777777777', isActive: true, addresses: [], wishlist: [] },
    { name: 'Rest. Owner',     email: 'owner@foodapp.com',    password: pw, role: 'restaurant_owner', phone: '6666666666', isActive: true, addresses: [], wishlist: [] },
  ]);

  const rests = await D.restaurants.insert([
    { name: 'Spice Garden',  description: 'Authentic Indian flavors',  cuisine: ['Indian','Biryani'],   categories: [cats[2]._id], image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', address: { street:'12 MG Road', city:'Bhubaneswar', state:'Odisha', coordinates:{lat:20.2961,lng:85.8245} }, phone:'0674-1234567', deliveryTime:'30-45 min', deliveryFee:25, avgRating:4.5, totalReviews:128, totalOrders:0, isOpen:true, isFeatured:true, isActive:true, offers:[{title:'20% OFF',code:'SPICE20',discount:20,minOrder:299}] },
    { name: 'Burger Barn',   description: 'Gourmet burgers daily',     cuisine: ['American','Burgers'], categories: [cats[1]._id], image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', address: { street:'45 Janpath',  city:'Bhubaneswar', state:'Odisha', coordinates:{lat:20.3009,lng:85.8193} }, phone:'0674-2345678', deliveryTime:'20-30 min', deliveryFee:20, avgRating:4.2, totalReviews:89,  totalOrders:0, isOpen:true, isFeatured:true, isActive:true, offers:[] },
    { name: 'Pizza Paradise', description: 'Wood-fired premium pizzas', cuisine: ['Italian','Pizza'],   categories: [cats[0]._id], image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', address: { street:'78 Bapuji Nagar', city:'Bhubaneswar', state:'Odisha', coordinates:{lat:20.2874,lng:85.8152} }, phone:'0674-3456789', deliveryTime:'25-40 min', deliveryFee:30, avgRating:4.7, totalReviews:210, totalOrders:0, isOpen:true, isFeatured:true, isActive:true, offers:[{title:'BOGO',code:'BOGO',discount:50,minOrder:499}] },
    { name: 'Dragon Wok',    description: 'Authentic Chinese & Asian', cuisine: ['Chinese','Thai'],    categories: [cats[3]._id], image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', address: { street:'23 Saheed Nagar',city:'Bhubaneswar', state:'Odisha', coordinates:{lat:20.3030,lng:85.8277} }, phone:'0674-4567890', deliveryTime:'35-50 min', deliveryFee:35, avgRating:4.0, totalReviews:67,  totalOrders:0, isOpen:true, isFeatured:false,isActive:true, offers:[] },
  ]);

  // ── 100 food items across 4 restaurants & 7 categories ──────────────────────
  const F = (name, desc, price, dp, rest, cat, veg, best, img, spice, prep, avg, cnt) => ({
    name, description: desc, price, discountedPrice: dp, restaurant: rest, category: cat,
    isVeg: veg, isBestseller: best, isAvailable: true, image: img,
    spiceLevel: spice, prepTime: prep, ratings: { avg, count: cnt }, createdAt: new Date()
  });

  // ── SPICE GARDEN (Indian / Biryani) — 25 items ───────────────────────────────
  const sg = rests[0]._id, bi = cats[2]._id;
  await D.foods.insert([
    F('Chicken Biryani',          'Aromatic basmati rice with tender spiced chicken',     299, null, sg, bi, false, true,  'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300', 'medium', 25, 4.6, 189),
    F('Mutton Biryani',           'Slow-cooked mutton on fragrant basmati',               349, null, sg, bi, false, true,  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300', 'medium', 35, 4.7, 145),
    F('Veg Biryani',              'Garden vegetables cooked with saffron rice',           229, null, sg, bi, true,  false, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=300', 'mild',   20, 4.2,  78),
    F('Egg Biryani',              'Boiled eggs layered in spiced biryani',                249, null, sg, bi, false, false, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300', 'medium', 22, 4.3,  60),
    F('Paneer Butter Masala',     'Soft cottage cheese in velvety tomato-cream gravy',    249, null, sg, bi, true,  true,  'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300', 'mild',   20, 4.5, 156),
    F('Butter Chicken',           'Tender chicken in rich buttery tomato gravy',          279, null, sg, bi, false, true,  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300', 'mild',   22, 4.6, 210),
    F('Dal Makhani',              'Creamy slow-cooked black lentils overnight',           199, null, sg, bi, true,  false, 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=300', 'mild',   20, 4.3,  94),
    F('Palak Paneer',             'Fresh spinach puree with golden paneer cubes',         229, null, sg, bi, true,  false, 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300', 'mild',   18, 4.2,  72),
    F('Chicken Tikka Masala',     'Char-grilled chicken in smoky masala sauce',           289, null, sg, bi, false, true,  'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300', 'medium', 25, 4.5, 134),
    F('Kadai Paneer',             'Paneer tossed with bell peppers in kadai masala',      239, null, sg, bi, true,  false, 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=300', 'hot',    20, 4.1,  58),
    F('Chole Bhature',            'Spicy chickpeas with fluffy deep-fried bread',         179, null, sg, bi, true,  true,  'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300', 'medium', 15, 4.4, 112),
    F('Lamb Rogan Josh',          'Kashmiri slow-braised lamb in aromatic spices',        329, null, sg, bi, false, false, 'https://images.unsplash.com/photo-1545247181-516773cae754?w=300', 'hot',    35, 4.4,  48),
    F('Prawn Masala',             'Juicy prawns in tangy coastal masala',                 349, null, sg, bi, false, true,  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300', 'hot',    20, 4.5,  67),
    F('Butter Naan',              'Freshly tandoor-baked buttered leavened bread',         49, null, sg, bi, true,  false, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300', 'mild',   10, 4.2,  88),
    F('Garlic Naan',              'Naan topped with minced garlic and herbs',              59, null, sg, bi, true,  false, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300', 'mild',   10, 4.3,  76),
    F('Tandoori Roti',            'Whole wheat bread baked in clay tandoor',               39, null, sg, bi, true,  false, 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=300', 'mild',    8, 4.1,  45),
    F('Chicken Seekh Kebab',      'Minced chicken with spices on skewers',                249, null, sg, bi, false, false, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300', 'medium', 20, 4.3,  55),
    F('Paneer Tikka',             'Marinated paneer cubes grilled in tandoor',            229, null, sg, bi, true,  true,  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=300', 'medium', 18, 4.5,  98),
    F('Mango Lassi',              'Chilled blended yogurt with fresh Alphonso mango',      89, null, sg, cats[6]._id, true, false, 'https://images.unsplash.com/photo-1571006682126-8a5e1dd2bf11?w=300', 'mild', 5, 4.6, 120),
    F('Masala Chai',              'Spiced Indian tea with ginger and cardamom',             49, null, sg, cats[6]._id, true, false, 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=300', 'mild',  5, 4.4,  88),
    F('Gulab Jamun',              'Soft milk dumplings soaked in rose-sugar syrup',        99, null, sg, cats[5]._id, true, true,  'https://images.unsplash.com/photo-1601303516534-bf4f8a2d7892?w=300', 'mild', 10, 4.7, 143),
    F('Kheer',                    'Creamy slow-cooked rice pudding with cardamom',         99, null, sg, cats[5]._id, true, false, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300', 'mild', 10, 4.3,  62),
    F('Raita',                    'Cool whipped yogurt with cucumber and spices',          59, null, sg, bi, true,  false, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300', 'mild',  5, 4.0,  38),
    F('Aloo Paratha',             'Whole wheat flatbread stuffed with spiced potato',      89, null, sg, cats[4]._id, true, true, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300', 'medium', 15, 4.4, 102),
    F('Fish Curry',               'Coastal style fish in tangy mustard-coconut gravy',    319, null, sg, bi, false, false, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300', 'hot', 25, 4.3, 54),
  ]);

  // ── BURGER BARN (Burgers / Fast Food) — 25 items ────────────────────────────
  const bb = rests[1]._id, bui = cats[1]._id;
  await D.foods.insert([
    F('Classic Smash Burger',     'Double smash patty, American cheese, special sauce',   249, null, bb, bui, false, true,  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300', 'mild',   15, 4.5, 172),
    F('Crispy Chicken Burger',    'Fried chicken fillet, coleslaw, sriracha mayo',        229, null, bb, bui, false, true,  'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=300', 'medium', 15, 4.3, 145),
    F('Mushroom Swiss Burger',    'Sautéed mushrooms, Swiss cheese, garlic aioli',        259, null, bb, bui, true,  false, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300', 'mild',   15, 4.2,  88),
    F('Spicy Jalapeño Burger',    'Beef patty, jalapeños, pepper jack cheese',            269, null, bb, bui, false, false, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300', 'hot',    15, 4.4,  76),
    F('Veggie Burger',            'Black bean patty, avocado, fresh veggies',             179, null, bb, bui, true,  false, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300', 'mild',   12, 4.1,  58),
    F('BBQ Bacon Burger',         'Beef patty, crispy bacon, BBQ sauce, onion rings',     299, null, bb, bui, false, true,  'https://images.unsplash.com/photo-1550317138-10000687a72b?w=300', 'mild',   18, 4.6, 134),
    F('Paneer Tikka Burger',      'Tandoori paneer, mint chutney, pickled onions',        199, null, bb, bui, true,  true,  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300', 'medium', 15, 4.4, 110),
    F('Loaded Cheese Fries',      'Crispy fries, cheddar sauce, jalapeños, chives',       149, null, bb, bui, true,  true,  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300', 'mild',   10, 4.5, 160),
    F('Sweet Potato Fries',       'Golden sweet potato fries with chipotle dip',          129, null, bb, bui, true,  false, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300', 'mild',   12, 4.2,  72),
    F('Onion Rings',              'Beer-battered crispy onion rings with ranch',          119, null, bb, bui, true,  false, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=300', 'mild',   10, 4.0,  55),
    F('Chicken Tenders',          'Juicy chicken strips with honey mustard sauce',        199, null, bb, bui, false, false, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=300', 'mild',   12, 4.3,  89),
    F('Coleslaw',                 'Creamy cabbage slaw with apple cider dressing',         59, null, bb, bui, true,  false, 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=300', 'mild',    5, 4.0,  38),
    F('Double Smash Deluxe',      'Triple patty tower with all the fixings',              349, null, bb, bui, false, true,  'https://images.unsplash.com/photo-1602030638412-bb8dcc0bc8b0?w=300', 'mild',   20, 4.7,  98),
    F('Fish Fillet Burger',       'Crispy fish fillet, tartar sauce, lettuce',            219, null, bb, bui, false, false, 'https://images.unsplash.com/photo-1593560704563-f176a2eb61db?w=300', 'mild',   15, 4.1,  47),
    F('Mac Daddy Burger',         'Two patties, mac sauce, shredded lettuce',             279, null, bb, bui, false, false, 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=300', 'mild',   18, 4.3,  66),
    F('Chicken Wrap',             'Grilled chicken, lettuce, tomato in a flour wrap',     179, null, bb, bui, false, false, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300', 'mild',   12, 4.2,  54),
    F('Corn Dog',                 'Classic hot dog coated in golden cornbread batter',    129, null, bb, bui, false, false, 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=300', 'mild',   10, 4.0,  33),
    F('Milkshake - Chocolate',    'Thick hand-spun chocolate milkshake',                  149, null, bb, cats[6]._id, true, true, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300', 'mild', 5, 4.6, 132),
    F('Milkshake - Strawberry',   'Thick hand-spun fresh strawberry milkshake',           149, null, bb, cats[6]._id, true, false,'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=300', 'mild',  5, 4.5,  98),
    F('Milkshake - Vanilla',      'Classic creamy vanilla bean milkshake',                139, null, bb, cats[6]._id, true, false,'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=300', 'mild',  5, 4.3,  76),
    F('Brownie Sundae',           'Warm fudge brownie with vanilla ice cream',            169, null, bb, cats[5]._id, true, true, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=300', 'mild', 10, 4.7, 118),
    F('Nachos',                   'Tortilla chips, salsa, sour cream, guacamole',         169, null, bb, bui, true,  false, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=300', 'medium', 10, 4.2,  65),
    F('Hot Dog',                  'All-beef frankfurter in toasted bun with mustard',     129, null, bb, bui, false, false, 'https://images.unsplash.com/photo-1612392166886-ee8475b03af2?w=300', 'mild',  8, 4.0,  40),
    F('Lemonade',                 'Fresh-squeezed lemonade with mint',                     79, null, bb, cats[6]._id, true, false,'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300', 'mild',  3, 4.3,  88),
    F('Iced Tea',                 'Chilled brewed tea with lemon and sweetener',            69, null, bb, cats[6]._id, true, false,'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300', 'mild',  3, 4.1,  55),
  ]);

  // ── PIZZA PARADISE (Pizza / Italian) — 25 items ─────────────────────────────
  const pp = rests[2]._id, pi = cats[0]._id;
  await D.foods.insert([
    F('Margherita',               'San Marzano tomato, fresh mozzarella, basil',          299, null, pp, pi, true,  false, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300', 'mild',   20, 4.6, 210),
    F('BBQ Chicken Pizza',        'Smoky BBQ sauce, grilled chicken, red onions',         399, null, pp, pi, false, true,  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300', 'mild',   22, 4.7, 194),
    F('Paneer Tikka Pizza',       'Spicy tikka paneer, capsicum, onion, chutney base',    349, null, pp, pi, true,  true,  'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=300', 'medium', 20, 4.5, 175),
    F('Pepperoni Pizza',          'Classic loaded pepperoni with mozzarella',             379, null, pp, pi, false, true,  'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300', 'mild',   22, 4.6, 188),
    F('Veggie Supreme',           'Bell peppers, olives, mushrooms, sweetcorn, onions',   329, null, pp, pi, true,  false, 'https://images.unsplash.com/photo-1551183053-bf91798d047a?w=300', 'mild',   20, 4.2,  98),
    F('Four Cheese Pizza',        'Mozzarella, cheddar, parmesan, gorgonzola',            419, null, pp, pi, true,  true,  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300', 'mild',   22, 4.8, 156),
    F('Chicken Tandoori Pizza',   'Tandoori chicken, onion, capsicum, mint chutney',      389, null, pp, pi, false, false, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=300', 'medium', 22, 4.4, 120),
    F('Peri Peri Chicken Pizza',  'Fiery peri peri chicken with jalapeños',               399, null, pp, pi, false, false, 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=300', 'hot',    22, 4.5, 110),
    F('Hawaiian Pizza',           'Ham, pineapple, mozzarella on tomato base',            369, null, pp, pi, false, false, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300', 'mild',   20, 4.1,  89),
    F('Mushroom & Truffle Pizza', 'Wild mushrooms with truffle oil and parmesan',         449, null, pp, pi, true,  true,  'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=300', 'mild',   22, 4.7, 134),
    F('Calzone',                  'Folded pizza stuffed with ricotta and salami',          349, null, pp, pi, false, false, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300', 'mild',   25, 4.3,  72),
    F('Garlic Bread',             'Toasted baguette with garlic butter and herbs',         99, null, pp, pi, true,  true,  'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300', 'mild',    8, 4.5, 210),
    F('Cheesy Garlic Bread',      'Garlic bread loaded with melted mozzarella',           129, null, pp, pi, true,  true,  'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=300', 'mild',   10, 4.6, 188),
    F('Pasta Arrabiata',          'Penne in fiery tomato and garlic sauce',               229, null, pp, pi, true,  false, 'https://images.unsplash.com/photo-1627286394700-e6c7febb1c88?w=300', 'hot',    18, 4.2,  78),
    F('Pasta Alfredo',            'Creamy white sauce fettuccine with mushrooms',         249, null, pp, pi, true,  false, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=300', 'mild',   18, 4.3,  88),
    F('Chicken Pasta Bake',       'Oven-baked penne with chicken in tomato-cream',        279, null, pp, pi, false, false, 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=300', 'mild',   25, 4.2,  65),
    F('Bruschetta',               'Toasted ciabatta with tomato, basil, olive oil',        99, null, pp, pi, true,  false, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=300', 'mild',    8, 4.1,  54),
    F('Caesar Salad',             'Romaine, croutons, parmesan, Caesar dressing',         179, null, pp, pi, true,  false, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=300', 'mild',   10, 4.2,  66),
    F('Tiramisu',                 'Classic Italian espresso-soaked layered dessert',       179, null, pp, cats[5]._id, true, true, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300', 'mild', 0, 4.8, 167),
    F('Chocolate Lava Cake',      'Warm chocolate cake with molten fudge center',         169, null, pp, cats[5]._id, true, true, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=300', 'mild', 15, 4.7, 145),
    F('Panna Cotta',              'Italian vanilla cream dessert with berry coulis',       149, null, pp, cats[5]._id, true, false,'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300', 'mild',  0, 4.4,  72),
    F('Cold Coffee',              'Chilled blend of espresso, milk, and ice cream',        119, null, pp, cats[6]._id, true, true, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300', 'mild',  5, 4.5, 134),
    F('Fresh Lime Soda',          'Chilled lime soda with mint and black salt',             69, null, pp, cats[6]._id, true, false,'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300', 'mild',  3, 4.2,  88),
    F('Wood-Fire Special',        "Chef's special seasonal pizza, changes weekly",        499, null, pp, pi, false, true,  'https://images.unsplash.com/photo-1548369937-47519962c11a?w=300', 'medium', 25, 4.9, 78),
    F('Mini Pizza Platter',       '4 mini pizzas: margherita, BBQ, paneer, pepperoni',    549, null, pp, pi, false, true,  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300', 'mild',  30, 4.6, 112),
  ]);

  // ── DRAGON WOK (Chinese / Asian) — 25 items ─────────────────────────────────
  const dw = rests[3]._id, chi = cats[3]._id;
  await D.foods.insert([
    F('Chicken Fried Rice',       'Wok-tossed basmati rice with egg and vegetables',      199, null, dw, chi, false, true,  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300', 'mild',   18, 4.1, 138),
    F('Veg Fried Rice',           'Wok-fried rice with seasonal Asian vegetables',        169, null, dw, chi, true,  false, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300', 'mild',   15, 4.0,  88),
    F('Prawn Fried Rice',         'Juicy prawns with egg, spring onion fried rice',       249, null, dw, chi, false, true,  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300', 'mild',   18, 4.4,  95),
    F('Hakka Noodles',            'Stir-fried noodles with mixed vegetables',             179, null, dw, chi, true,  false, 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300', 'mild',   15, 4.0,  78),
    F('Chicken Hakka Noodles',    'Wok-tossed noodles with shredded chicken',             199, null, dw, chi, false, true,  'https://images.unsplash.com/photo-1555126634-323283e090fa?w=300', 'mild',   15, 4.3, 110),
    F('Chilli Chicken (Dry)',     'Crispy chicken tossed in spicy chilli garlic sauce',   249, null, dw, chi, false, true,  'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300', 'hot',    20, 4.5, 152),
    F('Chilli Paneer',            'Crispy paneer in sweet-spicy Indo-Chinese sauce',      229, null, dw, chi, true,  true,  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=300', 'hot',    18, 4.4, 134),
    F('Honey Chilli Potato',      'Crispy potato strips in honey chilli glaze',           179, null, dw, chi, true,  true,  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300', 'medium', 15, 4.5, 145),
    F('Spring Rolls (Veg)',       'Crispy rolls filled with cabbage and noodles',         149, null, dw, chi, true,  false, 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=300', 'mild',   12, 4.1,  78),
    F('Chicken Manchurian',       'Chicken balls in tangy Manchurian brown sauce',        249, null, dw, chi, false, false, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300', 'medium', 20, 4.2,  88),
    F('Veg Manchurian',           'Veggie balls in sweet-tangy Manchurian gravy',         199, null, dw, chi, true,  false, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300', 'medium', 18, 4.0,  65),
    F('Kung Pao Chicken',         'Szechuan-style chicken with peanuts and chilies',      259, null, dw, chi, false, true,  'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300', 'hot',    20, 4.4, 112),
    F('Dim Sum Basket',           'Steamed dumplings – chicken, prawn, and veg (8 pcs)', 249, null, dw, chi, false, true,  'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300', 'mild',   20, 4.6, 123),
    F('Veg Dim Sum',              'Steamed vegetable dumplings with dipping sauce',       199, null, dw, chi, true,  false, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300', 'mild',   18, 4.2,  72),
    F('Tom Yum Soup',             'Thai lemongrass and mushroom hot-sour soup',           179, null, dw, chi, false, false, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300', 'hot',    15, 4.3,  88),
    F('Hot & Sour Soup',          'Classic Chinese corn and vegetable hot-sour soup',     149, null, dw, chi, true,  false, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300', 'hot',    12, 4.1,  66),
    F('Sweet & Sour Chicken',     'Battered chicken in glossy sweet-sour pineapple',      249, null, dw, chi, false, false, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300', 'mild',   18, 4.1,  54),
    F('Garlic Butter Prawns',     'Sautéed tiger prawns in garlic butter and herbs',      299, null, dw, chi, false, true,  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300', 'medium', 18, 4.5,  78),
    F('Basil Chicken Stir Fry',   'Thai basil chicken with bell peppers',                 229, null, dw, chi, false, false, 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300', 'hot',    18, 4.2,  58),
    F('Paneer Schezwan',          'Paneer cubes in fiery Szechuan sauce',                 229, null, dw, chi, true,  false, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=300', 'hot',    18, 4.3,  68),
    F('Fried Wontons',            'Crispy fried wontons with cream cheese filling',       159, null, dw, chi, true,  false, 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=300', 'mild',   12, 4.0,  45),
    F('Mango Pudding',            'Chilled Hong Kong-style mango coconut pudding',        129, null, dw, cats[5]._id, true, true, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300', 'mild', 0, 4.5, 98),
    F('Taro Ice Cream',           'Creamy purple taro ice cream with mochi bites',        149, null, dw, cats[5]._id, true, false,'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300', 'mild',  0, 4.3,  62),
    F('Bubble Tea - Taro',        'Taro milk tea with chewy tapioca pearls',              149, null, dw, cats[6]._id, true, true, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300', 'mild',  5, 4.7, 178),
    F('Bubble Tea - Matcha',      'Matcha green tea latte with tapioca pearls',           149, null, dw, cats[6]._id, true, true, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300', 'mild',  5, 4.6, 156),
  ]);

  console.log('\n✅ Demo data seeded!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Demo Login Credentials:');
  console.log('   Customer:  customer@foodapp.com  / password123');
  console.log('   Admin:     admin@foodapp.com     / password123');
  console.log('   Delivery:  delivery@foodapp.com  / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (await D.users.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 12);
    const allowedRoles = ['customer', 'delivery'];
    const user = await D.users.insert({ name, email, password: hashed, phone, role: allowedRoles.includes(role) ? role : 'customer', isActive: true, addresses: [], wishlist: [], createdAt: new Date() });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, refreshToken: token, user: safeUser(user) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await D.users.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' });
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, refreshToken: token, user: safeUser(user) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/auth/profile', auth, async (req, res) => {
  res.json({ success: true, user: safeUser(req.user) });
});

app.put('/api/auth/profile', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    await D.users.update({ _id: req.user._id }, { $set: { name, phone } });
    const user = await D.users.findOne({ _id: req.user._id });
    res.json({ success: true, user: safeUser(user) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/auth/logout', auth, (req, res) => res.json({ success: true, message: 'Logged out' }));
app.post('/api/auth/refresh-token', (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const token = jwt.sign({ id: decoded.id, role: decoded.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, refreshToken: token });
  } catch { res.status(401).json({ success: false, message: 'Invalid refresh token' }); }
});
app.put('/api/auth/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await D.users.findOne({ _id: req.user._id });
    if (!await bcrypt.compare(currentPassword, user.password)) return res.status(400).json({ success: false, message: 'Current password wrong' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await D.users.update({ _id: req.user._id }, { $set: { password: hashed } });
    res.json({ success: true, message: 'Password changed' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await D.categories.find({});
    cats.sort((a, b) => a.order - b.order);
    res.json({ success: true, data: cats });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── RESTAURANTS ──────────────────────────────────────────────────────────────
app.get('/api/restaurants', async (req, res) => {
  try {
    const { search, featured, limit = 12, page = 1 } = req.query;
    let rests = await D.restaurants.find({ isActive: true });
    if (search) rests = rests.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.cuisine.some(c => c.toLowerCase().includes(search.toLowerCase())));
    if (featured === 'true') rests = rests.filter(r => r.isFeatured);
    rests.sort((a, b) => b.avgRating - a.avgRating);
    const total = rests.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const data = rests.slice(start, start + parseInt(limit));
    res.json({ success: true, data, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await D.restaurants.findOne({ _id: req.params.id });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Not found' });
    const menu = await D.foods.find({ restaurant: req.params.id, isAvailable: true });
    res.json({ success: true, data: { restaurant, menu } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/restaurants/:id', auth, async (req, res) => {
  try {
    await D.restaurants.update({ _id: req.params.id }, { $set: req.body });
    const r = await D.restaurants.findOne({ _id: req.params.id });
    res.json({ success: true, data: r });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/restaurants/:id/toggle', auth, async (req, res) => {
  try {
    const r = await D.restaurants.findOne({ _id: req.params.id });
    await D.restaurants.update({ _id: req.params.id }, { $set: { isOpen: !r.isOpen } });
    const updated = await D.restaurants.findOne({ _id: req.params.id });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/restaurants/:id', ...adminOnly, async (req, res) => {
  try {
    await D.restaurants.remove({ _id: req.params.id });
    await D.foods.remove({ restaurant: req.params.id }, { multi: true });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── FOODS ────────────────────────────────────────────────────────────────────
app.get('/api/foods', async (req, res) => {
  try {
    const { restaurant, category, isVeg, search, page = 1, limit = 20 } = req.query;
    let foods = await D.foods.find({ isAvailable: true });
    if (restaurant) foods = foods.filter(f => f.restaurant === restaurant);
    if (category) foods = foods.filter(f => f.category === category);
    if (isVeg === 'true') foods = foods.filter(f => f.isVeg);
    if (search) foods = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    const total = foods.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    res.json({ success: true, data: foods.slice(start, start + parseInt(limit)), pagination: { total } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/foods/:id', async (req, res) => {
  try {
    const food = await D.foods.findOne({ _id: req.params.id });
    if (!food) return res.status(404).json({ success: false, message: 'Not found' });
    const restaurant = await D.restaurants.findOne({ _id: food.restaurant });
    res.json({ success: true, data: { ...food, restaurant } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/foods', auth, async (req, res) => {
  try {
    const food = await D.foods.insert({ ...req.body, isAvailable: true, ratings: { avg: 0, count: 0 }, createdAt: new Date() });
    res.status(201).json({ success: true, data: food });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/foods/:id', auth, async (req, res) => {
  try {
    await D.foods.update({ _id: req.params.id }, { $set: req.body });
    const food = await D.foods.findOne({ _id: req.params.id });
    res.json({ success: true, data: food });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/foods/:id', auth, async (req, res) => {
  try {
    await D.foods.remove({ _id: req.params.id });
    res.json({ success: true, message: 'Food item deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────
app.post('/api/orders', auth, async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod, specialInstructions } = req.body;
    const restaurant = await D.restaurants.findOne({ _id: restaurantId });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const food = await D.foods.findOne({ _id: item.foodItemId });
      if (!food) return res.status(404).json({ success: false, message: `Food not found: ${item.foodItemId}` });
      const price = food.discountedPrice || food.price;
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({ foodItem: food._id, name: food.name, image: food.image, price, quantity: item.quantity, subtotal: itemSubtotal });
    }

    const deliveryFee = restaurant.deliveryFee || 30;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + tax;
    const orderNumber = genOrderNum();

    const order = await D.orders.insert({
      orderNumber, customer: req.user._id, restaurant: restaurantId,
      items: orderItems, deliveryAddress, paymentMethod: paymentMethod || 'cod',
      specialInstructions, pricing: { subtotal, deliveryFee, tax, discount: 0, total },
      orderStatus: 'pending', statusHistory: [{ status: 'pending', timestamp: new Date() }],
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
      createdAt: new Date()
    });

    await D.restaurants.update({ _id: restaurantId }, { $set: { totalOrders: (restaurant.totalOrders || 0) + 1 } });

    io.to(`restaurant_${restaurantId}`).emit('new_order', { orderId: order._id, orderNumber, total });

    res.status(201).json({ success: true, message: 'Order placed!', data: { ...order, restaurant: { name: restaurant.name, image: restaurant.image } } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/orders/user', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { customer: req.user._id };
    if (status) query.orderStatus = status;
    let orders = await D.orders.find(query);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // Enrich with restaurant info
    for (const o of orders) {
      const r = await D.restaurants.findOne({ _id: o.restaurant });
      o.restaurant = r ? { _id: r._id, name: r.name, image: r.image } : { name: 'Unknown' };
    }
    res.json({ success: true, data: orders, pagination: { total: orders.length } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/orders/all', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.orderStatus = status;
    let orders = await D.orders.find(query);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    for (const o of orders) {
      const r = await D.restaurants.findOne({ _id: o.restaurant });
      const c = await D.users.findOne({ _id: o.customer });
      o.restaurant = r ? { name: r.name } : { name: 'Unknown' };
      o.customer = c ? { name: c.name, email: c.email, phone: c.phone } : { name: 'Unknown' };
    }
    res.json({ success: true, data: orders, pagination: { total: orders.length } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/orders/:id', auth, async (req, res) => {
  try {
    const order = await D.orders.findOne({ _id: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const r = await D.restaurants.findOne({ _id: order.restaurant });
    const c = await D.users.findOne({ _id: order.customer });
    order.restaurant = r || {};
    order.customer = c ? safeUser(c) : {};
    res.json({ success: true, data: order });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/orders/:id/status', auth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await D.orders.findOne({ _id: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const statusHistory = [...(order.statusHistory || []), { status, timestamp: new Date(), note }];
    await D.orders.update({ _id: req.params.id }, { $set: { orderStatus: status, statusHistory } });
    io.to(`order_${req.params.id}`).emit('order_status_update', { orderId: req.params.id, status, timestamp: new Date() });
    const updated = await D.orders.findOne({ _id: req.params.id });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/orders/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await D.orders.findOne({ _id: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    if (!['pending', 'confirmed'].includes(order.orderStatus)) return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' });
    await D.orders.update({ _id: req.params.id }, { $set: { orderStatus: 'cancelled', cancelReason: reason } });
    res.json({ success: true, message: 'Order cancelled' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── PAYMENT ──────────────────────────────────────────────────────────────────
app.post('/api/payment/create-order', auth, async (req, res) => {
  // Demo: return mock Razorpay order
  res.json({ success: true, data: { orderId: `rzp_demo_${Date.now()}`, amount: req.body.amount * 100, currency: 'INR', key: 'rzp_test_demo' } });
});
app.post('/api/payment/verify', auth, async (req, res) => {
  res.json({ success: true, message: 'Payment verified (demo mode)' });
});

// ─── USERS ────────────────────────────────────────────────────────────────────
app.post('/api/users/addresses', auth, async (req, res) => {
  try {
    const user = await D.users.findOne({ _id: req.user._id });
    const addresses = [...(user.addresses || []), { ...req.body, _id: `addr_${Date.now()}` }];
    await D.users.update({ _id: req.user._id }, { $set: { addresses } });
    res.json({ success: true, data: addresses });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
app.delete('/api/users/addresses/:addressId', auth, async (req, res) => {
  try {
    const user = await D.users.findOne({ _id: req.user._id });
    const addresses = (user.addresses || []).filter(a => a._id !== req.params.addressId);
    await D.users.update({ _id: req.user._id }, { $set: { addresses } });
    res.json({ success: true, data: addresses });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
app.post('/api/users/wishlist/:restaurantId', auth, async (req, res) => {
  try {
    const user = await D.users.findOne({ _id: req.user._id });
    let wishlist = user.wishlist || [];
    const idx = wishlist.indexOf(req.params.restaurantId);
    if (idx > -1) wishlist.splice(idx, 1);
    else wishlist.push(req.params.restaurantId);
    await D.users.update({ _id: req.user._id }, { $set: { wishlist } });
    res.json({ success: true, data: wishlist });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
app.get('/api/users/wishlist', auth, async (req, res) => {
  try {
    const user = await D.users.findOne({ _id: req.user._id });
    const rests = [];
    for (const id of (user.wishlist || [])) { const r = await D.restaurants.findOne({ _id: id }); if (r) rests.push(r); }
    res.json({ success: true, data: rests });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
app.post('/api/reviews', auth, async (req, res) => {
  try {
    const review = await D.reviews.insert({ ...req.body, user: req.user._id, createdAt: new Date() });
    res.status(201).json({ success: true, data: review });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
app.get('/api/reviews/restaurant/:restaurantId', async (req, res) => {
  try {
    const reviews = await D.reviews.find({ restaurant: req.params.restaurantId });
    res.json({ success: true, data: reviews });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────
app.get('/api/admin/analytics', ...adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalRestaurants, totalOrders] = await Promise.all([
      D.users.count({ role: 'customer' }),
      D.restaurants.count({ isActive: true }),
      D.orders.count({}),
    ]);
    const orders = await D.orders.find({});
    const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.pricing?.total || 0), 0);
    const statusMap = {};
    orders.forEach(o => { statusMap[o.orderStatus] = (statusMap[o.orderStatus] || 0) + 1; });
    const ordersByStatus = Object.entries(statusMap).map(([_id, count]) => ({ _id, count }));
    const recentOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    for (const o of recentOrders) {
      const r = await D.restaurants.findOne({ _id: o.restaurant });
      const c = await D.users.findOne({ _id: o.customer });
      o.restaurant = { name: r?.name };
      o.customer = { name: c?.name };
    }
    res.json({ success: true, data: { stats: { totalUsers, totalRestaurants, totalOrders, totalRevenue }, ordersByStatus, recentOrders } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
app.get('/api/admin/users', ...adminOnly, async (req, res) => {
  try {
    const { search } = req.query;
    let users = await D.users.find({});
    if (search) users = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json({ success: true, data: users.map(safeUser) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
app.put('/api/admin/users/:id/toggle', ...adminOnly, async (req, res) => {
  try {
    const user = await D.users.findOne({ _id: req.params.id });
    await D.users.update({ _id: req.params.id }, { $set: { isActive: !user.isActive } });
    res.json({ success: true, message: 'User status updated' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── DELIVERY ─────────────────────────────────────────────────────────────────
app.get('/api/delivery/available-orders', auth, async (req, res) => {
  try {
    const orders = await D.orders.find({ orderStatus: 'ready' });
    res.json({ success: true, data: orders });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ success: true, message: 'FoodFlash API running! (NeDB mode)', timestamp: new Date() }));

// Root redirect info
app.get('/', (req, res) => res.json({
  success: true,
  message: '🍔 FoodFlash API Server',
  frontend: 'http://localhost:3000',
  docs: 'Available endpoints: /api/health, /api/auth/login, /api/restaurants, /api/foods, /api/orders, /api/categories'
}));

// 404 - show helpful message with all available routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    hint: 'Make sure you are calling the correct API endpoint. The React app should be running at http://localhost:3000',
    availableRoutes: [
      'POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/profile',
      'GET /api/restaurants', 'GET /api/restaurants/:id',
      'GET /api/foods', 'GET /api/foods/:id',
      'GET /api/categories',
      'POST /api/orders', 'GET /api/orders/user', 'GET /api/orders/:id',
      'PUT /api/orders/:id/status', 'PUT /api/orders/:id/cancel',
      'POST /api/payment/create-order', 'POST /api/payment/verify',
      'GET /api/admin/analytics', 'GET /api/admin/users',
    ]
  });
});

// ─── START ────────────────────────────────────────────────────────────────────
seed().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 FoodFlash API running at http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO enabled`);
    console.log(`💾 Database: NeDB (in-memory, no MongoDB needed)`);
  });
}).catch(e => { console.error('Seed failed:', e); process.exit(1); });
