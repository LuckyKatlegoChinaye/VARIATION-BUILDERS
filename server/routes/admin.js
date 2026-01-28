const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../dataStore.js');
const authMiddleware = require('../middleware/authMiddleware.js');

// Middleware to check admin access
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Clear database - remove selected data types but keep inventory
router.post('/clear-database', authMiddleware, adminOnly, (req, res) => {
  try {
    const { confirmation, dataTypes } = req.body;
    
    // Verify confirmation to prevent accidental deletion
    if (confirmation !== 'CLEAR_ALL_DATA') {
      return res.status(400).json({ error: 'Invalid confirmation code' });
    }

    if (!dataTypes || !Array.isArray(dataTypes) || dataTypes.length === 0) {
      return res.status(400).json({ error: 'Please select at least one data type to clear' });
    }

    const db = readDB();
    
    // Store current data to calculate what was deleted
    const deletedCounts = {};

    // Clear selected data types
    if (dataTypes.includes('sales')) {
      deletedCounts.sales = (db.sales || []).length;
      db.sales = [];
    }
    
    if (dataTypes.includes('quotations')) {
      deletedCounts.quotations = (db.quotations || []).length;
      db.quotations = [];
    }
    
    if (dataTypes.includes('expenses')) {
      deletedCounts.expenses = (db.expenses || []).length;
      db.expenses = [];
    }
    
    if (dataTypes.includes('reports')) {
      deletedCounts.reports = (db.reports || []).length;
      db.reports = [];
    }
    
    if (dataTypes.includes('creditTransactions')) {
      deletedCounts.creditTransactions = (db.creditTransactions || []).length;
      db.creditTransactions = [];
    }
    
    if (dataTypes.includes('voidReturns')) {
      deletedCounts.voidReturns = (db.voidReturns || []).length;
      db.voidReturns = [];
    }

    writeDB(db);
    
    res.json({
      success: true,
      message: 'Selected data cleared successfully.',
      deleted: deletedCounts,
      preserved: {
        inventory: 'All inventory data',
        products: 'All product data',
        shops: 'All shop data',
        users: 'All user data'
      }
    });
  } catch (error) {
    console.error('Clear database error:', error);
    res.status(500).json({ error: 'Failed to clear database', details: error.message });
  }
});

// Get database statistics before clear
router.get('/database-stats', authMiddleware, adminOnly, (req, res) => {
  try {
    console.log('Fetching database stats for user:', req.user?.role);
    const db = readDB();
    console.log('Database read successfully');
    
    const stats = {
      sales: (db.sales || []).length,
      saleItems: (db.sales || []).reduce((sum, s) => sum + (s.items || []).length, 0),
      quotations: (db.quotations || []).length,
      quotationItems: (db.quotations || []).reduce((sum, q) => sum + (q.items || []).length, 0),
      expenses: (db.expenses || []).length,
      inventory: (db.inventory || []).length,
      products: (db.products || []).length,
      shops: (db.shops || []).length,
      users: (db.users || []).length
    };
    
    console.log('Stats calculated:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch database stats', details: error.message });
  }
});

module.exports = router;
