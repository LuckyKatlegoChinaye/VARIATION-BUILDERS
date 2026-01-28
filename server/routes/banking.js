const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all bank accounts (admin only)
router.get('/accounts', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const db = readDB();
  const accounts = db.bankAccounts || [];
  res.json(accounts);
});

// Create bank account
router.post('/accounts', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { name, accountNumber, bankName, accountType, balance } = req.body;

  if (!name || !accountNumber || !bankName) {
    return res.status(400).json({ error: 'Name, account number, and bank name are required' });
  }

  const db = readDB();
  if (!db.bankAccounts) db.bankAccounts = [];

  const account = {
    id: uuidv4(),
    name,
    accountNumber,
    bankName,
    accountType: accountType || 'Checking',
    balance: balance || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.bankAccounts.push(account);
  writeDB(db);
  res.status(201).json(account);
});

// Get bank transactions
router.get('/transactions', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const db = readDB();
  const transactions = db.bankTransactions || [];
  res.json(transactions);
});

// Import bank transactions (simulated bank feed)
router.post('/transactions/import', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { accountId, transactions } = req.body;

  if (!accountId || !transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Account ID and transactions array are required' });
  }

  const db = readDB();

  // Verify account exists
  const account = db.bankAccounts?.find(acc => acc.id === accountId);
  if (!account) {
    return res.status(400).json({ error: 'Bank account not found' });
  }

  if (!db.bankTransactions) db.bankTransactions = [];

  // Process transactions
  const processedTransactions = transactions.map(transaction => ({
    id: uuidv4(),
    accountId,
    date: transaction.date,
    description: transaction.description,
    amount: parseFloat(transaction.amount),
    type: transaction.amount >= 0 ? 'credit' : 'debit',
    category: categorizeTransaction(transaction.description),
    reconciled: false,
    createdAt: new Date().toISOString()
  }));

  db.bankTransactions.push(...processedTransactions);
  writeDB(db);

  res.json({
    message: `Imported ${processedTransactions.length} transactions`,
    transactions: processedTransactions
  });
});

// Reconcile transactions
router.post('/transactions/:id/reconcile', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { reconciled } = req.body;

  const db = readDB();
  const transactionIndex = db.bankTransactions?.findIndex(t => t.id === req.params.id);

  if (transactionIndex === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  db.bankTransactions[transactionIndex].reconciled = reconciled || true;
  db.bankTransactions[transactionIndex].reconciledAt = new Date().toISOString();

  writeDB(db);
  res.json(db.bankTransactions[transactionIndex]);
});

// Get account balance
router.get('/accounts/:id/balance', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const db = readDB();
  const account = db.bankAccounts?.find(acc => acc.id === req.params.id);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  // Calculate current balance from transactions
  const transactions = db.bankTransactions?.filter(t => t.accountId === req.params.id) || [];
  const transactionBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = account.balance + transactionBalance;

  res.json({
    account,
    openingBalance: account.balance,
    transactionBalance,
    currentBalance
  });
});

// Categorize transaction based on description (simplified AI-like categorization)
function categorizeTransaction(description) {
  const desc = description.toLowerCase();

  if (desc.includes('salary') || desc.includes('payroll') || desc.includes('wage')) {
    return 'Income - Salary';
  }
  if (desc.includes('invoice') || desc.includes('payment received')) {
    return 'Income - Sales';
  }
  if (desc.includes('rent') || desc.includes('lease')) {
    return 'Expenses - Rent';
  }
  if (desc.includes('utility') || desc.includes('electric') || desc.includes('water') || desc.includes('gas')) {
    return 'Expenses - Utilities';
  }
  if (desc.includes('office') || desc.includes('supplies')) {
    return 'Expenses - Office Supplies';
  }
  if (desc.includes('insurance')) {
    return 'Expenses - Insurance';
  }
  if (desc.includes('tax')) {
    return 'Expenses - Taxes';
  }
  if (desc.includes('transfer') || desc.includes('withdrawal')) {
    return 'Transfer';
  }

  return 'Uncategorized';
}

module.exports = router;