const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, roleMiddleware, shopAccessMiddleware, permissionMiddleware } = require('../middleware/rbacMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/products
 * Get products (optionally filtered by shop)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { shopId, category, search, page = 1, limit = 20 } = req.query;

    let where = {};

    // Cashiers can only see products from their shop
    if (req.user.role === 'CASHIER') {
      where.shopId = req.user.shopId;
    } else if (shopId) {
      where.shopId = shopId;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          inventory: {
            select: { quantity: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

/**
 * GET /api/products/:id
 * Get product details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        inventory: true,
        shop: {
          select: { name: true, location: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

/**
 * POST /api/products
 * Create product (ADMIN only)
 */
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { name, description, sku, price, cost, category, image, shopId, quantity } = req.body;

    // Validation
    if (!name || !sku || !price || !shopId) {
      return res.status(400).json({
        message: 'Name, SKU, price, and shop are required'
      });
    }

    // Check if SKU already exists in this shop
    const existingProduct = await prisma.product.findFirst({
      where: {
        shopId,
        sku
      }
    });

    if (existingProduct) {
      return res.status(409).json({
        message: 'Product with this SKU already exists in this shop'
      });
    }

    // Create product with inventory
    const product = await prisma.product.create({
      data: {
        name,
        description,
        sku,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : null,
        category,
        image,
        shopId,
        inventory: {
          create: {
            quantity: parseInt(quantity) || 0,
            shopId
          }
        }
      },
      include: {
        inventory: true
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      message: 'Failed to create product',
      error: error.message
    });
  }
});

/**
 * PUT /api/products/:id
 * Update product (ADMIN only)
 */
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { name, description, price, cost, category, image } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(cost && { cost: parseFloat(cost) }),
        ...(category && { category }),
        ...(image && { image })
      },
      include: {
        inventory: true
      }
    });

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      message: 'Failed to update product',
      error: error.message
    });
  }
});

/**
 * DELETE /api/products/:id
 * Delete product (ADMIN only)
 */
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

/**
 * PUT /api/products/:id/inventory
 * Update product inventory (ADMIN only)
 */
router.put('/:id/inventory', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { quantity, reorderLevel } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { inventory: true }
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const inventory = await prisma.inventory.update({
      where: { id: product.inventory[0].id },
      data: {
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(reorderLevel !== undefined && { reorderLevel: parseInt(reorderLevel) }),
        lastRestocked: new Date()
      }
    });

    res.json({
      message: 'Inventory updated successfully',
      inventory
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      message: 'Failed to update inventory',
      error: error.message
    });
  }
});

/**
 * GET /api/products/inventory/low-stock/:shopId
 * Get low stock products (ADMIN, CASHIER)
 */
router.get('/inventory/low-stock/:shopId', authMiddleware, shopAccessMiddleware, async (req, res) => {
  try {
    const lowStockProducts = await prisma.inventory.findMany({
      where: {
        shopId: req.params.shopId,
        quantity: {
          lte: prisma.inventory.fields.reorderLevel
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            category: true
          }
        }
      },
      orderBy: { quantity: 'asc' }
    });

    res.json(lowStockProducts);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      message: 'Failed to fetch low stock products',
      error: error.message
    });
  }
});

module.exports = router;
