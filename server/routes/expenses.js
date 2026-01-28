const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all expenses
router.get('/', authMiddleware, (req, res) => {
  const db = readDB();
  const expenses = db.expenses || [];
  // Include account information
  const expensesWithAccounts = expenses.map(expense => {
    const account = db.chartOfAccounts?.find(acc => acc.id === expense.accountId);
    return { ...expense, account };
  });
  res.json(expensesWithAccounts);
});

// Get expense by ID
router.get('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const expense = db.expenses?.find(exp => exp.id === req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  // Check if user owns this expense or is admin
  if (req.user.role !== 'admin' && expense.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const account = db.chartOfAccounts?.find(acc => acc.id === expense.accountId);
  res.json({ ...expense, account });
});

// Create new expense
router.post('/', authMiddleware, (req, res) => {
  const { accountId, amount, description, category, vendor, date, receipt, taxAmount, isReimbursable } = req.body;

  if (!accountId || !amount || !description) {
    return res.status(400).json({ error: 'Account, amount, and description are required' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  const db = readDB();

  // Verify account exists and is an expense account
  const account = db.chartOfAccounts?.find(acc => acc.id === accountId);
  if (!account) {
    return res.status(400).json({ error: 'Account not found' });
  }
  if (account.type !== 'Expense') {
    return res.status(400).json({ error: 'Selected account must be an expense account' });
  }

  const expense = {
    id: uuidv4(),
    userId: req.user.id,
    accountId,
    amount: parseFloat(amount),
    description,
    category: category || '',
    vendor: vendor || '',
    date: date || new Date().toISOString().split('T')[0],
    receipt: receipt || '',
    taxAmount: taxAmount ? parseFloat(taxAmount) : 0,
    isReimbursable: isReimbursable || false,
    status: 'recorded',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!db.expenses) db.expenses = [];
  db.expenses.push(expense);

  // Update account balance
  account.balance += expense.amount;
  account.updatedAt = new Date().toISOString();

  writeDB(db);
  res.status(201).json({ ...expense, account });
});

// Update expense
router.put('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const expenseIndex = db.expenses?.findIndex(exp => exp.id === req.params.id);

  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const expense = db.expenses[expenseIndex];

  // Check if user owns this expense or is admin
  if (req.user.role !== 'admin' && expense.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { accountId, amount, description, category, vendor, date, receipt, taxAmount, isReimbursable, status } = req.body;

  // If changing account, verify new account
  let account = db.chartOfAccounts?.find(acc => acc.id === expense.accountId);
  if (accountId && accountId !== expense.accountId) {
    const newAccount = db.chartOfAccounts?.find(acc => acc.id === accountId);
    if (!newAccount) {
      return res.status(400).json({ error: 'Account not found' });
    }
    if (newAccount.type !== 'Expense') {
      return res.status(400).json({ error: 'Selected account must be an expense account' });
    }

    // Adjust balances
    account.balance -= expense.amount;
    newAccount.balance += (amount !== undefined ? parseFloat(amount) : expense.amount);
    account = newAccount;
  } else if (amount !== undefined && parseFloat(amount) !== expense.amount) {
    // Adjust balance for amount change
    account.balance -= expense.amount;
    account.balance += parseFloat(amount);
  }

  db.expenses[expenseIndex] = {
    ...expense,
    accountId: accountId || expense.accountId,
    amount: amount !== undefined ? parseFloat(amount) : expense.amount,
    description: description || expense.description,
    category: category !== undefined ? category : expense.category,
    vendor: vendor !== undefined ? vendor : expense.vendor,
    date: date || expense.date,
    receipt: receipt !== undefined ? receipt : expense.receipt,
    taxAmount: taxAmount !== undefined ? parseFloat(taxAmount) : expense.taxAmount,
    isReimbursable: isReimbursable !== undefined ? isReimbursable : expense.isReimbursable,
    status: status || expense.status,
    updatedAt: new Date().toISOString()
  };

  if (account) account.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json({ ...db.expenses[expenseIndex], account });
});

// Delete expense
router.delete('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const expenseIndex = db.expenses?.findIndex(exp => exp.id === req.params.id);

  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const expense = db.expenses[expenseIndex];

  // Check if user owns this expense or is admin
  if (req.user.role !== 'admin' && expense.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Adjust account balance
  const account = db.chartOfAccounts?.find(acc => acc.id === expense.accountId);
  if (account) {
    account.balance -= expense.amount;
    account.updatedAt = new Date().toISOString();
  }

  db.expenses.splice(expenseIndex, 1);
  writeDB(db);
  res.json({ message: 'Expense deleted successfully' });
});

// Get expenses by date range
router.get('/date/:start/:end', authMiddleware, (req, res) => {
  const { start, end } = req.params;
  const db = readDB();
  const expenses = db.expenses?.filter(exp => {
    const expenseDate = new Date(exp.date);
    const startDate = new Date(start);
    const endDate = new Date(end);
    return expenseDate >= startDate && expenseDate <= endDate;
  }) || [];

  const expensesWithAccounts = expenses.map(expense => {
    const account = db.chartOfAccounts?.find(acc => acc.id === expense.accountId);
    return { ...expense, account };
  });

  res.json(expensesWithAccounts);
});

// Get expenses by category
router.get('/category/:category', authMiddleware, (req, res) => {
  const db = readDB();
  const expenses = db.expenses?.filter(exp =>
    exp.category.toLowerCase() === req.params.category.toLowerCase()
  ) || [];

  const expensesWithAccounts = expenses.map(expense => {
    const account = db.chartOfAccounts?.find(acc => acc.id === expense.accountId);
    return { ...expense, account };
  });

  res.json(expensesWithAccounts);
});

module.exports = router;