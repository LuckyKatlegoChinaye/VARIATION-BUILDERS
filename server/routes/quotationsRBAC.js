const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, roleMiddleware } = require('../middleware/rbacMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/quotations
 * Get quotations (with role-based filtering)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let where = {};

    // Customers see only their quotations
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.userId;
    }

    if (status) {
      where.status = status;
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
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
          customer: {
            select: { name: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.quotation.count({ where })
    ]);

    res.json({
      data: quotations,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({
      message: 'Failed to fetch quotations',
      error: error.message
    });
  }
});

/**
 * GET /api/quotations/:id
 * Get quotation details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true
      }
    });

    if (!quotation) {
      return res.status(404).json({
        message: 'Quotation not found'
      });
    }

    // Check permission
    if (req.user.role === 'CUSTOMER' && quotation.customerId !== req.user.userId) {
      return res.status(403).json({
        message: 'You do not have access to this quotation'
      });
    }

    res.json(quotation);
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({
      message: 'Failed to fetch quotation',
      error: error.message
    });
  }
});

/**
 * POST /api/quotations
 * Create new quotation
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, validUntil, notes } = req.body;
    const customerId = req.user.role === 'CUSTOMER' ? req.user.userId : req.body.customerId;

    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({
        message: 'Customer and items are required'
      });
    }

    // Calculate totals
    let subtotal = 0;
    const quotationItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json({
          message: `Product ${item.productId} not found`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      quotationItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        total: itemTotal
      });
    }

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    const quotationNumber = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId,
        subtotal,
        tax,
        total,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        notes,
        items: {
          create: quotationItems
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

    res.status(201).json({
      message: 'Quotation created successfully',
      quotation
    });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({
      message: 'Failed to create quotation',
      error: error.message
    });
  }
});

/**
 * PUT /api/quotations/:id
 * Update quotation (before acceptance)
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id }
    });

    if (!quotation) {
      return res.status(404).json({
        message: 'Quotation not found'
      });
    }

    // Check permission
    if (req.user.role === 'CUSTOMER' && quotation.customerId !== req.user.userId) {
      return res.status(403).json({
        message: 'You cannot edit this quotation'
      });
    }

    // Can only update if status is PENDING
    if (quotation.status !== 'PENDING') {
      return res.status(400).json({
        message: 'Can only update quotations with PENDING status'
      });
    }

    const { items, validUntil, notes } = req.body;

    // If items provided, recalculate totals
    let updateData = {
      ...(notes && { notes }),
      ...(validUntil && { validUntil: new Date(validUntil) })
    };

    if (items && items.length > 0) {
      let subtotal = 0;
      const quotationItems = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          return res.status(404).json({
            message: `Product ${item.productId} not found`
          });
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        quotationItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
          total: itemTotal
        });
      }

      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      // Delete old items
      await prisma.quotationItem.deleteMany({
        where: { quotationId: req.params.id }
      });

      // Create new items
      await prisma.quotationItem.createMany({
        data: quotationItems.map(item => ({
          ...item,
          quotationId: req.params.id
        }))
      });

      updateData = {
        ...updateData,
        subtotal,
        tax,
        total
      };
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: updateData,
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

    res.json({
      message: 'Quotation updated successfully',
      quotation: updatedQuotation
    });
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({
      message: 'Failed to update quotation',
      error: error.message
    });
  }
});

/**
 * PUT /api/quotations/:id/accept
 * Accept quotation (CUSTOMER)
 */
router.put('/:id/accept', authMiddleware, roleMiddleware(['CUSTOMER']), async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id }
    });

    if (!quotation) {
      return res.status(404).json({
        message: 'Quotation not found'
      });
    }

    if (quotation.customerId !== req.user.userId) {
      return res.status(403).json({
        message: 'You cannot accept this quotation'
      });
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: 'ACCEPTED' }
    });

    res.json({
      message: 'Quotation accepted successfully',
      quotation: updatedQuotation
    });
  } catch (error) {
    console.error('Accept quotation error:', error);
    res.status(500).json({
      message: 'Failed to accept quotation',
      error: error.message
    });
  }
});

/**
 * PUT /api/quotations/:id/reject
 * Reject quotation (CUSTOMER)
 */
router.put('/:id/reject', authMiddleware, roleMiddleware(['CUSTOMER']), async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id }
    });

    if (!quotation) {
      return res.status(404).json({
        message: 'Quotation not found'
      });
    }

    if (quotation.customerId !== req.user.userId) {
      return res.status(403).json({
        message: 'You cannot reject this quotation'
      });
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' }
    });

    res.json({
      message: 'Quotation rejected successfully',
      quotation: updatedQuotation
    });
  } catch (error) {
    console.error('Reject quotation error:', error);
    res.status(500).json({
      message: 'Failed to reject quotation',
      error: error.message
    });
  }
});

module.exports = router;
