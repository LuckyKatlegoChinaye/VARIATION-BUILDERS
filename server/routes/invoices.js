const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all invoices (admin only)
router.get('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const db = readDB();
  const invoices = db.invoices || [];
  // Include customer information
  const invoicesWithCustomers = invoices.map(invoice => {
    const customer = db.customers?.find(c => c.id === invoice.customerId);
    return { ...invoice, customer };
  });
  res.json(invoicesWithCustomers);
});

// Get invoice by ID
router.get('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const invoice = db.invoices?.find(inv => inv.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  // Check if user owns this invoice or is admin
  if (req.user.role !== 'admin' && invoice.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const customer = db.customers?.find(c => c.id === invoice.customerId);
  res.json({ ...invoice, customer });
});

// Protected: get invoices for current user
router.get('/my/list', authMiddleware, (req, res) => {
  const db = readDB();
  const userInvoices = db.invoices?.filter(inv => inv.userId === req.user.id) || [];
  // Include customer information
  const invoicesWithCustomers = userInvoices.map(invoice => {
    const customer = db.customers?.find(c => c.id === invoice.customerId);
    return { ...invoice, customer };
  });
  res.json(invoicesWithCustomers);
});

// Create new invoice
router.post('/', authMiddleware, (req, res) => {
  const { customerId, items, notes, dueDate, paymentTerms } = req.body;

  if (!customerId || !items || items.length === 0) {
    return res.status(400).json({ error: 'Customer and items are required' });
  }

  const db = readDB();

  // Verify customer exists
  const customer = db.customers?.find(c => c.id === customerId);
  if (!customer) {
    return res.status(400).json({ error: 'Customer not found' });
  }

  // Calculate total
  const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const invoice = {
    id: uuidv4(),
    customerId,
    userId: req.user.id,
    items,
    total,
    notes: notes || '',
    dueDate: dueDate || null,
    paymentTerms: paymentTerms || customer.paymentTerms || 'Net 30',
    status: 'unpaid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!db.invoices) db.invoices = [];
  db.invoices.push(invoice);
  writeDB(db);
  res.status(201).json({ ...invoice, customer });
});

// Update invoice
router.put('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const invoiceIndex = db.invoices?.findIndex(inv => inv.id === req.params.id);

  if (invoiceIndex === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const invoice = db.invoices[invoiceIndex];

  // Check if user owns this invoice or is admin
  if (req.user.role !== 'admin' && invoice.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { customerId, items, notes, dueDate, paymentTerms, status } = req.body;

  if (customerId) {
    const customer = db.customers?.find(c => c.id === customerId);
    if (!customer) {
      return res.status(400).json({ error: 'Customer not found' });
    }
  }

  // Recalculate total if items changed
  let total = invoice.total;
  if (items && items.length > 0) {
    total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }

  db.invoices[invoiceIndex] = {
    ...invoice,
    customerId: customerId || invoice.customerId,
    items: items || invoice.items,
    total,
    notes: notes !== undefined ? notes : invoice.notes,
    dueDate: dueDate !== undefined ? dueDate : invoice.dueDate,
    paymentTerms: paymentTerms !== undefined ? paymentTerms : invoice.paymentTerms,
    status: status !== undefined ? status : invoice.status,
    updatedAt: new Date().toISOString()
  };

  writeDB(db);
  const customer = db.customers?.find(c => c.id === db.invoices[invoiceIndex].customerId);
  res.json({ ...db.invoices[invoiceIndex], customer });
});

// Delete invoice
router.delete('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const invoiceIndex = db.invoices?.findIndex(inv => inv.id === req.params.id);

  if (invoiceIndex === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const invoice = db.invoices[invoiceIndex];

  // Check if user owns this invoice or is admin
  if (req.user.role !== 'admin' && invoice.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.invoices.splice(invoiceIndex, 1);
  writeDB(db);
  res.json({ message: 'Invoice deleted successfully' });
});

module.exports = router;
