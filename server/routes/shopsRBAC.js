const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, roleMiddleware, shopAccessMiddleware } = require('../middleware/rbacMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/shops
 * Get all shops (ADMIN) or user's shop (CASHIER)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    let shops;

    if (req.user.role === 'ADMIN') {
      // Admin sees all shops
      shops = await prisma.shop.findMany({
        include: {
          _count: {
            select: {
              cashiers: true,
              products: true,
              sales: true
            }
          }
        }
      });
    } else if (req.user.role === 'CASHIER') {
      // Cashier sees only their shop
      shops = await prisma.shop.findMany({
        where: {
          cashiers: {
            some: {
              id: req.user.userId
            }
          }
        },
        include: {
          _count: {
            select: {
              cashiers: true,
              products: true,
              sales: true
            }
          }
        }
      });
    } else {
      return res.status(403).json({
        message: 'Customers do not have access to shops'
      });
    }

    res.json(shops);
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({
      message: 'Failed to fetch shops',
      error: error.message
    });
  }
});

/**
 * GET /api/shops/:id
 * Get shop details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: req.params.id },
      include: {
        cashiers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        _count: {
          select: {
            products: true,
            sales: true
          }
        }
      }
    });

    if (!shop) {
      return res.status(404).json({
        message: 'Shop not found'
      });
    }

    res.json(shop);
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({
      message: 'Failed to fetch shop',
      error: error.message
    });
  }
});

/**
 * POST /api/shops
 * Create new shop (ADMIN only)
 */
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { name, location, phone, email } = req.body;

    if (!name || !location) {
      return res.status(400).json({
        message: 'Shop name and location are required'
      });
    }

    const shop = await prisma.shop.create({
      data: {
        name,
        location,
        phone,
        email
      }
    });

    res.status(201).json({
      message: 'Shop created successfully',
      shop
    });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({
      message: 'Failed to create shop',
      error: error.message
    });
  }
});

/**
 * PUT /api/shops/:id
 * Update shop (ADMIN only)
 */
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { name, location, phone, email } = req.body;

    const shop = await prisma.shop.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(phone && { phone }),
        ...(email && { email })
      }
    });

    res.json({
      message: 'Shop updated successfully',
      shop
    });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({
      message: 'Failed to update shop',
      error: error.message
    });
  }
});

/**
 * DELETE /api/shops/:id
 * Delete shop (ADMIN only)
 */
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    await prisma.shop.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Shop deleted successfully'
    });
  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({
      message: 'Failed to delete shop',
      error: error.message
    });
  }
});

/**
 * POST /api/shops/:id/assign-cashier
 * Assign cashier to shop (ADMIN only)
 */
router.post('/:id/assign-cashier', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { cashierId } = req.body;

    if (!cashierId) {
      return res.status(400).json({
        message: 'Cashier ID is required'
      });
    }

    // Update user's shop assignment
    const user = await prisma.user.update({
      where: { id: cashierId },
      data: { shopId: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        shopId: true
      }
    });

    res.json({
      message: 'Cashier assigned to shop successfully',
      user
    });
  } catch (error) {
    console.error('Assign cashier error:', error);
    res.status(500).json({
      message: 'Failed to assign cashier',
      error: error.message
    });
  }
});

/**
 * GET /api/shops/:id/dashboard
 * Get shop dashboard statistics
 */
router.get('/:id/dashboard', authMiddleware, shopAccessMiddleware, async (req, res) => {
  try {
    const shopId = req.params.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's sales
    const todaySales = await prisma.sale.aggregate({
      where: {
        shopId,
        createdAt: { gte: today }
      },
      _count: { id: true },
      _sum: { total: true }
    });

    // This month sales
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = await prisma.sale.aggregate({
      where: {
        shopId,
        createdAt: { gte: monthStart }
      },
      _count: { id: true },
      _sum: { total: true }
    });

    // Total products
    const productCount = await prisma.product.count({
      where: { shopId }
    });

    // Low stock products
    const lowStockProducts = await prisma.inventory.findMany({
      where: {
        shopId,
        quantity: {
          lte: prisma.inventory.fields.reorderLevel
        }
      },
      include: {
        product: {
          select: { name: true, sku: true }
        }
      }
    });

    // Recent sales
    const recentSales = await prisma.sale.findMany({
      where: { shopId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      }
    });

    res.json({
      today: {
        sales: todaySales._count.id || 0,
        revenue: todaySales._sum.total || 0
      },
      month: {
        sales: monthSales._count.id || 0,
        revenue: monthSales._sum.total || 0
      },
      productCount,
      lowStockProducts,
      recentSales
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

module.exports = router;
