const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore.js');

const authMiddleware = require('../middleware/authMiddleware.js');
const adminMiddleware = require('../middleware/adminMiddleware.js');
const router = express.Router();

// Public endpoint for browsing products (no auth required)
router.get('/', (req, res) => {
  const db = readDB();
  const shopId = req.query.shopId;
  let inventory = db.inventory;
  if (shopId) {
    // If shop has sharedInventory, get from parent
    const shop = db.shops.find(s => s.id === shopId);
    if (shop && shop.sharedInventory && shop.parentShopId) {
      inventory = inventory.filter(item => item.shopId === shop.parentShopId);
    } else {
      inventory = inventory.filter(item => item.shopId === shopId);
    }
  }
  res.json(inventory);
});

router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { name, category, sku, price, qty, description, image, available, shopId } = req.body;
  if (!name || typeof price !== 'number') return res.status(400).json({ error: 'Missing name or price' });
  const db = readDB();
  const item = {
    id: uuidv4(),
    name,
    category: category || 'Uncategorized',
    sku: sku || '',
    price,
    qty: typeof qty === 'number' ? qty : 0,
    description: description || '',
    image: image || '',
    available: available !== false && qty > 0,
    shopId: shopId || 'default-shop'
  };
  db.inventory.push(item);
  writeDB(db);
  res.status(201).json(item);
});

router.get('/:id', (req, res) => {
  const db = readDB();
  const item = db.inventory.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { name, category, sku, price, qty, description, image, available } = req.body;
  const db = readDB();
  const item = db.inventory.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  if (name) item.name = name;
  if (category) item.category = category;
  if (sku) item.sku = sku;
  if (typeof price === 'number') item.price = price;
  if (typeof qty === 'number') {
    item.qty = qty;
    item.available = qty > 0;
  }
  if (description !== undefined) item.description = description;
  if (image) item.image = image;
  if (available !== undefined) item.available = available;

  writeDB(db);
  res.json(item);
});

router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const db = readDB();
  const index = db.inventory.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  const deleted = db.inventory.splice(index, 1)[0];
  writeDB(db);
  res.json({ message: 'Product deleted', product: deleted });
});

module.exports = router;
