const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore.js');

const authMiddleware = require('../middleware/authMiddleware.js');
const adminMiddleware = require('../middleware/adminMiddleware.js');
const router = express.Router();

// Get all shops
router.get('/', authMiddleware, (req, res) => {
  const db = readDB();
  res.json(db.shops);
});

// Create a new shop
router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { name, location, parentShopId, sharedInventory } = req.body;
  if (!name || !location) return res.status(400).json({ error: 'Name and location required' });
  const db = readDB();
  const shop = {
    id: uuidv4(),
    name,
    location,
    parentShopId: parentShopId || null,
    sharedInventory: sharedInventory || false
  };
  db.shops.push(shop);
  writeDB(db);
  res.status(201).json(shop);
});

// Get shop by ID
router.get('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const shop = db.shops.find(s => s.id === req.params.id);
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  res.json(shop);
});

// Update shop
router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { name, location, parentShopId, sharedInventory } = req.body;
  const db = readDB();
  const shop = db.shops.find(s => s.id === req.params.id);
  if (!shop) return res.status(404).json({ error: 'Shop not found' });

  if (name) shop.name = name;
  if (location) shop.location = location;
  if (parentShopId !== undefined) shop.parentShopId = parentShopId;
  if (sharedInventory !== undefined) shop.sharedInventory = sharedInventory;

  writeDB(db);
  res.json(shop);
});

// Delete shop
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const db = readDB();
  const index = db.shops.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Shop not found' });

  db.shops.splice(index, 1);
  // Also remove userShops for this shop
  db.userShops = db.userShops.filter(us => us.shopId !== req.params.id);
  writeDB(db);
  res.json({ message: 'Shop deleted' });
});

// Get users for a shop
router.get('/:id/users', authMiddleware, adminMiddleware, (req, res) => {
  const db = readDB();
  const userShops = db.userShops.filter(us => us.shopId === req.params.id);
  const users = userShops.map(us => {
    const user = db.users.find(u => u.id === us.userId);
    return { ...user, role: us.role };
  });
  res.json(users);
});

// Assign user to shop
router.post('/:id/users', authMiddleware, adminMiddleware, (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role) return res.status(400).json({ error: 'User ID and role required' });
  const db = readDB();
  const existing = db.userShops.find(us => us.userId === userId && us.shopId === req.params.id);
  if (existing) return res.status(400).json({ error: 'User already assigned to this shop' });

  db.userShops.push({ userId, shopId: req.params.id, role });
  writeDB(db);
  res.status(201).json({ message: 'User assigned to shop' });
});

// Remove user from shop
router.delete('/:id/users/:userId', authMiddleware, adminMiddleware, (req, res) => {
  const db = readDB();
  const index = db.userShops.findIndex(us => us.userId === req.params.userId && us.shopId === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Assignment not found' });

  db.userShops.splice(index, 1);
  writeDB(db);
  res.json({ message: 'User removed from shop' });
});

module.exports = router;