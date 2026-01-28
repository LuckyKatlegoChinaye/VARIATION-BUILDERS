const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const adminMiddleware = require('../middleware/adminMiddleware.js');

const router = express.Router();

// GET all users (admin only)
router.get('/', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const db = readDB();
    const users = db.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      createdAt: u.createdAt || new Date().toISOString()
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// CREATE new user (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing name, email, or password' });
    }

    const db = readDB();
    
    // Check if user exists
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 8);
    const user = {
      id: uuidv4(),
      name,
      email,
      passwordHash,
      role: role === 'admin' ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    writeDB(db);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// UPDATE user (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const db = readDB();
    const user = db.users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email && db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.passwordHash = await bcrypt.hash(password, 8);
    if (role) user.role = role === 'admin' ? 'admin' : 'user';

    writeDB(db);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();

    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deleted = db.users.splice(index, 1)[0];
    writeDB(db);

    res.json({
      message: 'User deleted successfully',
      user: {
        id: deleted.id,
        email: deleted.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET current user's assigned shops
router.get('/me/shops', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const userId = req.user.id;
    const userShops = db.userShops.filter(us => us.userId === userId);
    const shops = userShops.map(us => {
      const shop = db.shops.find(s => s.id === us.shopId);
      return { ...shop, role: us.role };
    });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user shops' });
  }
});

module.exports = router;
