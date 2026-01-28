const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { readDB, writeDB } = require('../dataStore.js')
const authMiddleware = require('../middleware/authMiddleware.js')
const { roleMiddleware } = require('../middleware/rbacMiddleware.js')
const { getNextInvoiceNumber } = require('../utils/idGenerator.js')

const router = express.Router()

// Get all sales (cashier & admin only)
router.get('/sales', authMiddleware, roleMiddleware(['CASHIER', 'ADMIN']), (req, res) => {
  try {
    const db = readDB()
    const sales = db.sales || []
    
    // Filter by user if not admin
    const filtered = req.user.role === 'ADMIN' 
      ? sales 
      : sales.filter(s => s.cashierId === req.user.id)
    
    res.json(filtered)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Get sale by ID
router.get('/sales/:id', authMiddleware, (req, res) => {
  try {
    const db = readDB()
    const sale = db.sales?.find(s => s.id === req.params.id)
    
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' })
    }
    
    // Check permissions
    if (req.user.role !== 'ADMIN' && sale.cashierId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    res.json(sale)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Create new sale (POS transaction)
router.post('/sales', authMiddleware, roleMiddleware(['CASHIER', 'ADMIN']), (req, res) => {
  try {
    const { items, subtotal, tax, total, paymentMethod, amountPaid, change, customerId, notes, isCredit, approvalId, includeTax } = req.body

    console.log('Creating sale with data:', { items, total, paymentMethod, includeTax })

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Sale must have at least one item' })
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' })
    }

    if (isCredit && !approvalId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Credit sales require manager approval' })
    }

    const db = readDB()
    const invoiceNumber = getNextInvoiceNumber()

    const sale = {
      id: invoiceNumber, // Use invoice number as primary ID for human readability
      invoiceNumber,
      shopId: 'default-shop',
      cashierId: req.user.id,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        price: item.price,
        qty: item.qty,
        total: item.price * item.qty
      })),
      subtotal: subtotal || 0,
      tax: tax || 0,
      total: total || 0,
      includeTax: includeTax !== false, // Store tax preference (default: true)
      paymentMethod,
      amountPaid: amountPaid || total,
      change: change || 0,
      customerId: customerId || null,
      customerName: req.body.customerName || null,
      customerPhone: req.body.customerPhone || null,
      isCredit: isCredit || false,
      approvalId: approvalId || null,
      notes: notes || '',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log('Sale created:', sale.invoiceNumber)

    // Update inventory
    items.forEach(item => {
      const inventory = db.inventory?.find(inv => inv.id === item.id)
      if (inventory) {
        console.log(`Updating inventory for ${item.name}: ${inventory.qty} -> ${inventory.qty - item.qty}`)
        inventory.qty -= item.qty
        if (inventory.qty < 0) inventory.qty = 0
        inventory.available = inventory.qty > 0
      } else {
        console.warn(`Inventory not found for item ${item.id}`)
      }
    })

    // If credit sale, create credit transaction
    if (isCredit) {
      db.creditTransactions = db.creditTransactions || []
      const creditTx = {
        id: uuidv4(),
        saleId: sale.id,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        amount: total,
        status: 'PENDING_APPROVAL',
        approvalId,
        createdAt: new Date().toISOString()
      }
      db.creditTransactions.push(creditTx)
      console.log('Credit transaction created:', creditTx.id)
    }

    // Save sale
    db.sales = db.sales || []
    db.sales.push(sale)
    writeDB(db)

    console.log('Sale saved successfully')
    res.status(201).json(sale)
  } catch (err) {
    console.error('Failed to create sale:', err)
    res.status(500).json({ error: err.message })
  }
})

// Void a sale (admin only)
router.post('/sales/:id/void', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const { reason } = req.body
    const db = readDB()
    const sale = db.sales?.find(s => s.id === req.params.id)

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' })
    }

    if (sale.status === 'VOIDED') {
      return res.status(400).json({ error: 'Sale is already voided' })
    }

    // Reverse inventory
    sale.items?.forEach(item => {
      const inventory = db.inventory?.find(inv => inv.id === item.id)
      if (inventory) {
        inventory.qty += item.qty
        inventory.available = true
      }
    })

    // Create void record
    db.voidReturns = db.voidReturns || []
    const voidRecord = {
      id: uuidv4(),
      saleId: sale.id,
      type: 'VOID',
      amount: sale.total,
      reason: reason || '',
      approvedBy: req.user.id,
      createdAt: new Date().toISOString()
    }
    db.voidReturns.push(voidRecord)

    // Update sale status
    sale.status = 'VOIDED'
    sale.updatedAt = new Date().toISOString()

    writeDB(db)
    res.json({ message: 'Sale voided successfully', sale })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Return items from a sale (admin/manager approval)
router.post('/sales/:id/return', authMiddleware, roleMiddleware(['CASHIER', 'ADMIN']), (req, res) => {
  try {
    const { items, reason } = req.body
    const db = readDB()
    const sale = db.sales?.find(s => s.id === req.params.id)

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' })
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Must return at least one item' })
    }

    // Check if admin/manager approval is needed
    const returnAmount = items.reduce((sum, item) => sum + (item.qty * item.price), 0)
    const needsApproval = returnAmount > 500 // Amounts over 500 need approval

    if (needsApproval && req.user.role !== 'ADMIN') {
      // Create pending return request
      db.returnRequests = db.returnRequests || []
      const returnRequest = {
        id: uuidv4(),
        saleId: sale.id,
        requestedBy: req.user.id,
        items,
        amount: returnAmount,
        reason: reason || '',
        status: 'PENDING_APPROVAL',
        createdAt: new Date().toISOString()
      }
      db.returnRequests.push(returnRequest)
      writeDB(db)
      return res.status(202).json({ message: 'Return request submitted for approval', request: returnRequest })
    }

    // Process return
    let returnAmount2 = 0
    items.forEach(returnItem => {
      const saleItem = sale.items?.find(si => si.id === returnItem.id)
      if (saleItem) {
        const returnQty = Math.min(returnItem.qty, saleItem.qty)
        
        // Update inventory
        const inventory = db.inventory?.find(inv => inv.id === returnItem.id)
        if (inventory) {
          inventory.qty += returnQty
          inventory.available = true
        }

        // Update sale item quantity
        saleItem.qty -= returnQty
        returnAmount2 += returnItem.price * returnQty
      }
    })

    // Create return record
    db.voidReturns = db.voidReturns || []
    const returnRecord = {
      id: uuidv4(),
      saleId: sale.id,
      type: 'RETURN',
      items,
      amount: returnAmount2,
      reason: reason || '',
      approvedBy: req.user.id,
      createdAt: new Date().toISOString()
    }
    db.voidReturns.push(returnRecord)

    // Update sale total
    sale.total -= returnAmount2
    sale.subtotal -= returnAmount2
    sale.updatedAt = new Date().toISOString()

    writeDB(db)
    res.json({ message: 'Return processed successfully', sale })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Approve credit purchase
router.post('/sales/:id/approve-credit', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const db = readDB()
    const sale = db.sales?.find(s => s.id === req.params.id)

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' })
    }

    if (!sale.isCredit) {
      return res.status(400).json({ error: 'Sale is not a credit purchase' })
    }

    // Update credit transaction status
    const creditTx = db.creditTransactions?.find(ct => ct.saleId === sale.id)
    if (creditTx) {
      creditTx.status = 'APPROVED'
      creditTx.approvedAt = new Date().toISOString()
    }

    sale.approvalId = req.user.id
    sale.status = 'COMPLETED'
    writeDB(db)

    res.json({ message: 'Credit purchase approved', sale })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Reject credit purchase
router.post('/sales/:id/reject-credit', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const { reason } = req.body
    const db = readDB()
    const sale = db.sales?.find(s => s.id === req.params.id)

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' })
    }

    if (!sale.isCredit) {
      return res.status(400).json({ error: 'Sale is not a credit purchase' })
    }

    // Reverse inventory
    sale.items?.forEach(item => {
      const inventory = db.inventory?.find(inv => inv.id === item.id)
      if (inventory) {
        inventory.qty += item.qty
        inventory.available = true
      }
    })

    // Update credit transaction status
    const creditTx = db.creditTransactions?.find(ct => ct.saleId === sale.id)
    if (creditTx) {
      creditTx.status = 'REJECTED'
      creditTx.reason = reason || 'No reason provided'
      creditTx.rejectedAt = new Date().toISOString()
    }

    sale.status = 'CANCELLED'
    writeDB(db)

    res.json({ message: 'Credit purchase rejected', sale })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Get pending approvals (admin only)
router.get('/pending-approvals/credit', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const db = readDB()
    const pending = db.creditTransactions?.filter(ct => ct.status === 'PENDING_APPROVAL') || []
    
    // Enrich with sale details
    const enriched = pending.map(ct => {
      const sale = db.sales?.find(s => s.id === ct.saleId)
      return { ...ct, sale }
    })

    res.json(enriched)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Get pending return requests (admin only)
router.get('/pending-approvals/returns', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const db = readDB()
    const pending = db.returnRequests?.filter(rr => rr.status === 'PENDING_APPROVAL') || []
    
    // Enrich with sale details
    const enriched = pending.map(rr => {
      const sale = db.sales?.find(s => s.id === rr.saleId)
      return { ...rr, sale }
    })

    res.json(enriched)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Approve return request (admin only)
router.post('/return-requests/:id/approve', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const db = readDB()
    const returnRequest = db.returnRequests?.find(rr => rr.id === req.params.id)

    if (!returnRequest) {
      return res.status(404).json({ error: 'Return request not found' })
    }

    const sale = db.sales?.find(s => s.id === returnRequest.saleId)
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' })
    }

    // Process return
    let returnAmount = 0
    returnRequest.items?.forEach(returnItem => {
      const saleItem = sale.items?.find(si => si.id === returnItem.id)
      if (saleItem) {
        const returnQty = Math.min(returnItem.qty, saleItem.qty)
        
        // Update inventory
        const inventory = db.inventory?.find(inv => inv.id === returnItem.id)
        if (inventory) {
          inventory.qty += returnQty
          inventory.available = true
        }

        // Update sale item quantity
        saleItem.qty -= returnQty
        returnAmount += returnItem.price * returnQty
      }
    })

    // Update return request
    returnRequest.status = 'APPROVED'
    returnRequest.approvedAt = new Date().toISOString()

    // Create return record
    db.voidReturns = db.voidReturns || []
    const returnRecord = {
      id: uuidv4(),
      saleId: sale.id,
      type: 'RETURN',
      items: returnRequest.items,
      amount: returnAmount,
      reason: returnRequest.reason,
      approvedBy: req.user.id,
      createdAt: new Date().toISOString()
    }
    db.voidReturns.push(returnRecord)

    // Update sale total
    sale.total -= returnAmount
    sale.subtotal -= returnAmount
    sale.updatedAt = new Date().toISOString()

    writeDB(db)
    res.json({ message: 'Return approved', sale })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Reject return request (admin only)
router.post('/return-requests/:id/reject', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const { reason } = req.body
    const db = readDB()
    const returnRequest = db.returnRequests?.find(rr => rr.id === req.params.id)

    if (!returnRequest) {
      return res.status(404).json({ error: 'Return request not found' })
    }

    returnRequest.status = 'REJECTED'
    returnRequest.rejectedAt = new Date().toISOString()
    returnRequest.rejectionReason = reason || 'No reason provided'

    writeDB(db)
    res.json({ message: 'Return request rejected', request: returnRequest })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
