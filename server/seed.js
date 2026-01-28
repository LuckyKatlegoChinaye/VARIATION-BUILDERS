const { readDB, writeDB } = require('./dataStore.js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  const db = readDB();
  
  // Clear and reset
  db.users = [];
  db.inventory = [];
  db.quotes = [];
  db.invoices = [];

  // Add test users (regular user and admin)
  const userHash = await bcrypt.hash('password123', 8);
  db.users.push({
    id: uuidv4(),
    name: 'Lucky Chinaye',
    email: 'lchnaye@vb.co.bw',
    passwordHash: userHash,
    role: 'user'
  });

  const adminHash = await bcrypt.hash('4040@M', 8);
  db.users.push({
    id: uuidv4(),
    name: 'Admin',
    email: 'admin@vb.co.bw',
    passwordHash: adminHash,
    role: 'admin'
  });

  // Add sample inventory (Variation Builders products)
  const inventory = [
    { name: 'HP LaserJet Toner - Black', sku: 'LP-TONER-HP', price: 89.99, qty: 50, description: 'Original HP toner cartridge', image: '/images/hp-05a-black-original-laserjet-toner-cartridge-500x500.jpeg' },
    { name: 'Laser Toner - Generic', sku: 'LP-TONER-GEN', price: 45.99, qty: 75, description: 'Compatible toner cartridge', image: '/images/test-toner7.jpg' },
    { name: 'Premium Toner Set', sku: 'TONER-SET-1', price: 159.99, qty: 35, description: 'Multi-pack toner cartridges', image: '/images/toner4.png' },
    { name: 'Color Toner Cartridge', sku: 'LP-TONER-COL', price: 72.50, qty: 45, description: 'Color laser toner for printers', image: '/images/toner3.webp' },
    { name: 'Office Table - Cherry Wood', sku: 'FURN-TABLE-1', price: 299.99, qty: 30, description: 'Premium office table', image: '/images/table1.png' },
    { name: 'Office Table - Modern Design', sku: 'FURN-TABLE-2', price: 349.99, qty: 25, description: 'Contemporary office table', image: '/images/table2.png' },
    { name: 'Office Chair - Ergonomic', sku: 'FURN-CHAIR-1', price: 189.99, qty: 40, description: 'Ergonomic office chair', image: '/images/pos.jpg' },
    { name: 'Stationery Bundle - Mixed', sku: 'STAT-BUNDLE-1', price: 29.99, qty: 200, description: 'Complete stationery set', image: '/images/stationary.png' },
    { name: 'Wireless Keyboard & Mouse Combo', sku: 'COMP-KM-WL', price: 49.99, qty: 85, description: 'Professional wireless input devices', image: '/images/toner2.jpg' },
    { name: 'USB-C Hub - 7 Port', sku: 'COMP-HUB-7', price: 64.99, qty: 60, description: 'Multi-port USB-C hub for laptops', image: '/images/toner1.png' },
  ];

  db.inventory = inventory.map(i => ({ ...i, id: uuidv4() }));
  writeDB(db);
  console.log('Database seeded successfully');
}

seed().catch(console.error);
