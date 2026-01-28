const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore.js');
const authMiddleware = require('../middleware/authMiddleware.js');

const router = express.Router();

// GET all categories
router.get('/', (_req, res) => {
  try {
    const db = readDB();
    res.json(db.categories || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST create category
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name required' });

    const db = readDB();
    const categoryExists = (db.categories || []).find(c => c.name.toLowerCase() === name.toLowerCase());
    if (categoryExists) return res.status(400).json({ error: 'Category already exists' });

    const category = { id: uuidv4(), name };
    db.categories = (db.categories || []);
    db.categories.push(category);
    writeDB(db);
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// DELETE category
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    db.categories = (db.categories || []).filter(c => c.id !== id);
    writeDB(db);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
