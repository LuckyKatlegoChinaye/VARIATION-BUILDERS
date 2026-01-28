const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, roleMiddleware, shopAccessMiddleware } = require('../middleware/rbacMiddleware');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/sales
 * Get sales with optional filters
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { shopId, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    let where = {};

    // Cashiers can only see sales from their shop
    if (req.user.role === 'CASHIER') {
      where.shopId = req.user.shopId;
    } else if (shopId) {
      where.shopId = shopId;
    }

    if (status) {
      where.status = status;
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

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          items: {
            include: {
              product: {
                select: { name: true, sku: true }
              }
            }
          },
          cashier: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sale.count({ where })
    ]);

    res.json({
      data: sales,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      message: 'Failed to fetch sales',
      error: error.message
    });
  }
});

/**
 * GET /api/sales/:id
 * Get sale details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        cashier: {
          select: { name: true, email: true }
        },
        shop: {
          select: { name: true, location: true, phone: true, email: true }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found'
      });
    }

    res.json(sale);
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      message: 'Failed to fetch sale',
      error: error.message
    });
  }
});

/**
 * POST /api/sales
 * Create new sale (CASHIER only)
 */
router.post('/', authMiddleware, roleMiddleware(['CASHIER']), async (req, res) => {
  try {
    const { shopId, items, paymentMethod = 'CASH', amountPaid = 0, tax = 0, discount = 0 } = req.body;

    if (!shopId || !items || items.length === 0) {
      return res.status(400).json({
        message: 'Shop ID and items are required'
      });
    }

    // Verify cashier has access to this shop
    if (req.user.shopId !== shopId) {
      return res.status(403).json({
        message: 'You do not have access to this shop'
      });
    }

    // Calculate totals and verify stock
    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { inventory: true }
      });

      if (!product) {
        return res.status(404).json({
          message: `Product ${item.productId} not found`
        });
      }

      const inventory = product.inventory.find(inv => inv.shopId === shopId);
      if (!inventory || inventory.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product: ${product.name}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      saleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        total: itemTotal
      });
    }

    const discountAmount = (subtotal * (discount / 100)) || 0;
    const taxAmount = ((subtotal - discountAmount) * (tax / 100)) || 0;
    const total = subtotal - discountAmount + taxAmount;
    const change = Math.max(0, amountPaid - total);

    // Create sale with invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const sale = await prisma.sale.create({
      data: {
        invoiceNumber,
        shopId,
        cashierId: req.user.userId,
        paymentMethod,
        amountPaid: parseFloat(amountPaid),
        change,
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total,
        status: 'COMPLETED',
        items: {
          create: saleItems
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, sku: true }
            }
          }
        }
      }
    });

    // Update inventory - reduce quantities
    for (const item of saleItems) {
      await prisma.inventory.updateMany({
        where: {
          productId: item.productId,
          shopId
        },
        data: {
          quantity: {
            decrement: item.quantity
          }
        }
      });
    }

    res.status(201).json({
      message: 'Sale created successfully',
      sale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({
      message: 'Failed to create sale',
      error: error.message
    });
  }
});

/**
 * PUT /api/sales/:id/cancel
 * Cancel a sale (ADMIN only)
 */
router.put('/:id/cancel', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found'
      });
    }

    // Restore inventory
    for (const item of sale.items) {
      await prisma.inventory.updateMany({
        where: {
          productId: item.productId,
          shopId: sale.shopId
        },
        data: {
          quantity: {
            increment: item.quantity
          }
        }
      });
    }

    // Update sale status
    const updatedSale = await prisma.sale.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

    res.json({
      message: 'Sale cancelled successfully',
      sale: updatedSale
    });
  } catch (error) {
    console.error('Cancel sale error:', error);
    res.status(500).json({
      message: 'Failed to cancel sale',
      error: error.message
    });
  }
});

/**
 * GET /api/sales/reports/daily/:shopId
 * Get daily sales report
 */
router.get('/reports/daily/:shopId', authMiddleware, shopAccessMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const shopId = req.params.shopId;

    let where = { shopId, status: 'COMPLETED' };

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

    const sales = await prisma.sale.aggregate({
      where,
      _count: { id: true },
      _sum: { total: true, tax: true, discount: true },
      _avg: { total: true }
    });

    // Get top products
    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: { shopId, status: 'COMPLETED' }
      },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10
    });

    res.json({
      summary: {
        totalSales: sales._count.id || 0,
        totalRevenue: sales._sum.total || 0,
        totalTax: sales._sum.tax || 0,
        totalDiscount: sales._sum.discount || 0,
        averageTransaction: sales._avg.total || 0
      },
      topProducts
    });
  } catch (error) {
    console.error('Get daily report error:', error);
    res.status(500).json({
      message: 'Failed to fetch daily report',
      error: error.message
    });
  }
});

module.exports = router;
