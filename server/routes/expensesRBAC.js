const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, roleMiddleware, shopAccessMiddleware } = require('../middleware/rbacMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/expenses
 * Get expenses (ADMIN, CASHIER can see their shop's expenses)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { shopId, category, startDate, endDate, page = 1, limit = 20 } = req.query;

    let where = {};

    // Cashiers can only see expenses from their shop
    if (req.user.role === 'CASHIER' && req.user.shopId) {
      where.shopId = req.user.shopId;
    } else if (shopId) {
      where.shopId = shopId;
    }

    if (category) {
      where.category = category;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          shop: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.expense.count({ where })
    ]);

    res.json({
      data: expenses,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
});

/**
 * GET /api/expenses/:id
 * Get expense details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: {
        shop: true
      }
    });

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      message: 'Failed to fetch expense',
      error: error.message
    });
  }
});

/**
 * POST /api/expenses
 * Create new expense (ADMIN, CASHIER)
 */
router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'CASHIER']), async (req, res) => {
  try {
    const { shopId, category, description, amount, receipt } = req.body;

    if (!category || !description || !amount) {
      return res.status(400).json({
        message: 'Category, description, and amount are required'
      });
    }

    // Verify shop access
    if (req.user.role === 'CASHIER' && req.user.shopId !== shopId) {
      return res.status(403).json({
        message: 'You cannot add expenses for other shops'
      });
    }

    const expense = await prisma.expense.create({
      data: {
        shopId: shopId || req.user.shopId,
        category,
        description,
        amount: parseFloat(amount),
        receipt
      },
      include: {
        shop: {
          select: { name: true }
        }
      }
    });

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      message: 'Failed to create expense',
      error: error.message
    });
  }
});

/**
 * PUT /api/expenses/:id
 * Update expense (ADMIN only)
 */
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { category, description, amount, receipt } = req.body;

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...(category && { category }),
        ...(description && { description }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(receipt && { receipt })
      },
      include: {
        shop: {
          select: { name: true }
        }
      }
    });

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      message: 'Failed to update expense',
      error: error.message
    });
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete expense (ADMIN only)
 */
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    await prisma.expense.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      message: 'Failed to delete expense',
      error: error.message
    });
  }
});

/**
 * GET /api/expenses/reports/summary/:shopId
 * Get expense summary report
 */
router.get('/reports/summary/:shopId', authMiddleware, shopAccessMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const shopId = req.params.shopId;

    let where = { shopId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Get total expenses
    const totalExpenses = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true }
    });

    // Get expenses by category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: { id: true }
    });

    res.json({
      summary: {
        totalExpenses: totalExpenses._sum.amount || 0,
        totalCount: totalExpenses._count.id || 0
      },
      byCategory: expensesByCategory
    });
  } catch (error) {
    console.error('Get expense report error:', error);
    res.status(500).json({
      message: 'Failed to fetch expense report',
      error: error.message
    });
  }
});

module.exports = router;
