const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Default chart of accounts
const defaultAccounts = [
  // Assets
  { id: 'cash', name: 'Cash', type: 'Asset', category: 'Current Assets', balance: 0 },
  { id: 'bank', name: 'Bank Account', type: 'Asset', category: 'Current Assets', balance: 0 },
  { id: 'accounts-receivable', name: 'Accounts Receivable', type: 'Asset', category: 'Current Assets', balance: 0 },
  { id: 'inventory', name: 'Inventory', type: 'Asset', category: 'Current Assets', balance: 0 },

  // Liabilities
  { id: 'accounts-payable', name: 'Accounts Payable', type: 'Liability', category: 'Current Liabilities', balance: 0 },
  { id: 'loans', name: 'Loans Payable', type: 'Liability', category: 'Current Liabilities', balance: 0 },

  // Equity
  { id: 'owner-equity', name: 'Owner\'s Equity', type: 'Equity', category: 'Equity', balance: 0 },
  { id: 'retained-earnings', name: 'Retained Earnings', type: 'Equity', category: 'Equity', balance: 0 },

  // Income
  { id: 'sales-revenue', name: 'Sales Revenue', type: 'Income', category: 'Revenue', balance: 0 },
  { id: 'service-revenue', name: 'Service Revenue', type: 'Income', category: 'Revenue', balance: 0 },
  { id: 'interest-income', name: 'Interest Income', type: 'Income', category: 'Other Income', balance: 0 },

  // Expenses
  { id: 'cost-of-goods-sold', name: 'Cost of Goods Sold', type: 'Expense', category: 'Cost of Sales', balance: 0 },
  { id: 'rent-expense', name: 'Rent Expense', type: 'Expense', category: 'Operating Expenses', balance: 0 },
  { id: 'utilities', name: 'Utilities', type: 'Expense', category: 'Operating Expenses', balance: 0 },
  { id: 'office-supplies', name: 'Office Supplies', type: 'Expense', category: 'Operating Expenses', balance: 0 },
  { id: 'marketing', name: 'Marketing & Advertising', type: 'Expense', category: 'Operating Expenses', balance: 0 },
  { id: 'insurance', name: 'Insurance', type: 'Expense', category: 'Operating Expenses', balance: 0 },
  { id: 'professional-services', name: 'Professional Services', type: 'Expense', category: 'Operating Expenses', balance: 0 },
  { id: 'depreciation', name: 'Depreciation', type: 'Expense', category: 'Operating Expenses', balance: 0 }
];

// Initialize chart of accounts if not exists
function initializeChartOfAccounts(db) {
  if (!db.chartOfAccounts) {
    db.chartOfAccounts = defaultAccounts.map(account => ({
      ...account,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }
}

// Get all accounts
router.get('/', authMiddleware, (req, res) => {
  const db = readDB();
  initializeChartOfAccounts(db);
  res.json(db.chartOfAccounts);
});

// Get account by ID
router.get('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const account = db.chartOfAccounts?.find(acc => acc.id === req.params.id);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  res.json(account);
});

// Create new account
router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { name, type, category, description } = req.body;

  if (!name || !type || !category) {
    return res.status(400).json({ error: 'Name, type, and category are required' });
  }

  const validTypes = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid account type' });
  }

  const db = readDB();
  initializeChartOfAccounts(db);

  // Check if account name already exists
  const existing = db.chartOfAccounts.find(acc => acc.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Account with this name already exists' });
  }

  const account = {
    id: uuidv4(),
    name,
    type,
    category,
    description: description || '',
    balance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.chartOfAccounts.push(account);
  writeDB(db);
  res.status(201).json(account);
});

// Update account
router.put('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const db = readDB();
  const accountIndex = db.chartOfAccounts?.findIndex(acc => acc.id === req.params.id);

  if (accountIndex === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const { name, type, category, description } = req.body;

  if (name) {
    const existing = db.chartOfAccounts.find(acc =>
      acc.name.toLowerCase() === name.toLowerCase() && acc.id !== req.params.id
    );
    if (existing) {
      return res.status(400).json({ error: 'Account with this name already exists' });
    }
  }

  const account = db.chartOfAccounts[accountIndex];
  db.chartOfAccounts[accountIndex] = {
    ...account,
    name: name || account.name,
    type: type || account.type,
    category: category || account.category,
    description: description !== undefined ? description : account.description,
    updatedAt: new Date().toISOString()
  };

  writeDB(db);
  res.json(db.chartOfAccounts[accountIndex]);
});

// Delete account
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const db = readDB();
  const accountIndex = db.chartOfAccounts?.findIndex(acc => acc.id === req.params.id);

  if (accountIndex === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const account = db.chartOfAccounts[accountIndex];

  // Check if account has transactions
  const hasTransactions = db.transactions?.some(t =>
    t.debitAccount === account.id || t.creditAccount === account.id
  );
  if (hasTransactions) {
    return res.status(400).json({ error: 'Cannot delete account with existing transactions' });
  }

  db.chartOfAccounts.splice(accountIndex, 1);
  writeDB(db);
  res.json({ message: 'Account deleted successfully' });
});

// Get accounts by type
router.get('/type/:type', authMiddleware, (req, res) => {
  const db = readDB();
  const accounts = db.chartOfAccounts?.filter(acc =>
    acc.type.toLowerCase() === req.params.type.toLowerCase()
  ) || [];
  res.json(accounts);
});

module.exports = router;