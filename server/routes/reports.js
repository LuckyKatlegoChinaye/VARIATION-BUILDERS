const express = require('express');
const { readDB } = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Helper function to get date range
function getDateRange(period) {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (period) {
    case 'this-month':
      start.setDate(1);
      break;
    case 'last-month':
      start.setMonth(now.getMonth() - 1, 1);
      end.setMonth(now.getMonth(), 0);
      break;
    case 'this-quarter':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(quarterStart, 1);
      break;
    case 'last-quarter':
      const lastQuarterStart = Math.floor((now.getMonth() - 3) / 3) * 3;
      start.setMonth(lastQuarterStart, 1);
      end.setMonth(lastQuarterStart + 3, 0);
      break;
    case 'this-year':
      start.setMonth(0, 1);
      break;
    case 'last-year':
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      end.setFullYear(now.getFullYear() - 1, 11, 31);
      break;
    default:
      // Custom date range
      return null;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

// Profit & Loss Statement
router.get('/profit-loss', authMiddleware, (req, res) => {
  const { period, startDate, endDate } = req.query;
  const db = readDB();

  let dateRange;
  if (startDate && endDate) {
    dateRange = { start: startDate, end: endDate };
  } else {
    dateRange = getDateRange(period || 'this-month');
  }

  // Get all income accounts
  const incomeAccounts = db.chartOfAccounts?.filter(acc => acc.type === 'Income') || [];

  // Get all expense accounts
  const expenseAccounts = db.chartOfAccounts?.filter(acc => acc.type === 'Expense') || [];

  // Calculate income
  let totalIncome = 0;
  const incomeBreakdown = incomeAccounts.map(account => {
    // For now, we'll use account balances. In a full system, we'd calculate based on transactions
    totalIncome += account.balance;
    return {
      account: account.name,
      amount: account.balance
    };
  });

  // Calculate expenses
  let totalExpenses = 0;
  const expenseBreakdown = expenseAccounts.map(account => {
    totalExpenses += account.balance;
    return {
      account: account.name,
      amount: account.balance
    };
  });

  const netIncome = totalIncome - totalExpenses;

  res.json({
    period: dateRange,
    income: {
      breakdown: incomeBreakdown,
      total: totalIncome
    },
    expenses: {
      breakdown: expenseBreakdown,
      total: totalExpenses
    },
    netIncome,
    generatedAt: new Date().toISOString()
  });
});

// Balance Sheet
router.get('/balance-sheet', authMiddleware, (req, res) => {
  const { period } = req.query;
  const db = readDB();

  const dateRange = getDateRange(period || 'this-month');

  // Assets
  const assetAccounts = db.chartOfAccounts?.filter(acc => acc.type === 'Asset') || [];
  let totalAssets = 0;
  const assets = assetAccounts.map(account => {
    totalAssets += account.balance;
    return {
      account: account.name,
      category: account.category,
      amount: account.balance
    };
  });

  // Liabilities
  const liabilityAccounts = db.chartOfAccounts?.filter(acc => acc.type === 'Liability') || [];
  let totalLiabilities = 0;
  const liabilities = liabilityAccounts.map(account => {
    totalLiabilities += account.balance;
    return {
      account: account.name,
      category: account.category,
      amount: account.balance
    };
  });

  // Equity
  const equityAccounts = db.chartOfAccounts?.filter(acc => acc.type === 'Equity') || [];
  let totalEquity = 0;
  const equity = equityAccounts.map(account => {
    totalEquity += account.balance;
    return {
      account: account.name,
      category: account.category,
      amount: account.balance
    };
  });

  // Calculate retained earnings (Net Income - Dividends)
  // For simplicity, we'll assume retained earnings = net income
  const netIncome = totalAssets - totalLiabilities - totalEquity;
  totalEquity += netIncome;

  res.json({
    period: dateRange,
    assets: {
      breakdown: assets,
      total: totalAssets
    },
    liabilities: {
      breakdown: liabilities,
      total: totalLiabilities
    },
    equity: {
      breakdown: equity,
      total: totalEquity,
      retainedEarnings: netIncome
    },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    generatedAt: new Date().toISOString()
  });
});

// Cash Flow Statement
router.get('/cash-flow', authMiddleware, (req, res) => {
  const { period, startDate, endDate } = req.query;
  const db = readDB();

  let dateRange;
  if (startDate && endDate) {
    dateRange = { start: startDate, end: endDate };
  } else {
    dateRange = getDateRange(period || 'this-month');
  }

  // Operating Activities
  const operatingIncome = 0; // Would calculate from income statements
  const depreciation = db.chartOfAccounts?.find(acc => acc.id === 'depreciation')?.balance || 0;
  const accountsReceivableChange = 0; // Would calculate change in AR
  const accountsPayableChange = 0; // Would calculate change in AP
  const cashFromOperations = operatingIncome + depreciation - accountsReceivableChange + accountsPayableChange;

  // Investing Activities
  const cashFromInvesting = 0; // Would include asset purchases/sales

  // Financing Activities
  const cashFromFinancing = 0; // Would include loans, equity changes

  const netCashFlow = cashFromOperations + cashFromInvesting + cashFromFinancing;

  res.json({
    period: dateRange,
    operatingActivities: {
      netIncome: operatingIncome,
      depreciation: depreciation,
      accountsReceivableChange: accountsReceivableChange,
      accountsPayableChange: accountsPayableChange,
      cashFromOperations: cashFromOperations
    },
    investingActivities: {
      cashFromInvesting: cashFromInvesting
    },
    financingActivities: {
      cashFromFinancing: cashFromFinancing
    },
    netCashFlow,
    generatedAt: new Date().toISOString()
  });
});

// Expense Summary Report
router.get('/expenses-summary', authMiddleware, (req, res) => {
  const { period, startDate, endDate, category } = req.query;
  const db = readDB();

  let dateRange;
  if (startDate && endDate) {
    dateRange = { start: startDate, end: endDate };
  } else {
    dateRange = getDateRange(period || 'this-month');
  }

  let expenses = db.expenses || [];

  // Filter by date range if specified
  if (dateRange) {
    expenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      return expDate >= start && expDate <= end;
    });
  }

  // Filter by category if specified
  if (category) {
    expenses = expenses.filter(exp => exp.category.toLowerCase() === category.toLowerCase());
  }

  // Group by category
  const categorySummary = {};
  let totalExpenses = 0;

  expenses.forEach(expense => {
    const cat = expense.category || 'Uncategorized';
    if (!categorySummary[cat]) {
      categorySummary[cat] = {
        count: 0,
        total: 0,
        expenses: []
      };
    }
    categorySummary[cat].count++;
    categorySummary[cat].total += expense.amount;
    categorySummary[cat].expenses.push({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      vendor: expense.vendor
    });
    totalExpenses += expense.amount;
  });

  res.json({
    period: dateRange,
    category: category || 'All',
    summary: categorySummary,
    totalExpenses,
    expenseCount: expenses.length,
    generatedAt: new Date().toISOString()
  });
});

// Income Summary Report
router.get('/income-summary', authMiddleware, (req, res) => {
  const { period, startDate, endDate } = req.query;
  const db = readDB();

  let dateRange;
  if (startDate && endDate) {
    dateRange = { start: startDate, end: endDate };
  } else {
    dateRange = getDateRange(period || 'this-month');
  }

  // Get income accounts
  const incomeAccounts = db.chartOfAccounts?.filter(acc => acc.type === 'Income') || [];

  let totalIncome = 0;
  const incomeBreakdown = incomeAccounts.map(account => {
    totalIncome += account.balance;
    return {
      account: account.name,
      category: account.category,
      amount: account.balance
    };
  });

  res.json({
    period: dateRange,
    breakdown: incomeBreakdown,
    totalIncome,
    generatedAt: new Date().toISOString()
  });
});

// Customer Balance Summary
router.get('/customer-balances', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const db = readDB();
  const customers = db.customers || [];
  const invoices = db.invoices || [];

  const customerBalances = customers.map(customer => {
    const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
    const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = customerInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    const balance = totalInvoiced - totalPaid;

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      },
      totalInvoiced,
      totalPaid,
      balance,
      invoiceCount: customerInvoices.length,
      paidInvoices: customerInvoices.filter(inv => inv.status === 'paid').length
    };
  });

  const totalReceivables = customerBalances.reduce((sum, cb) => sum + cb.balance, 0);

  res.json({
    customerBalances,
    totalReceivables,
    generatedAt: new Date().toISOString()
  });
});

module.exports = router;