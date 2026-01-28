const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all customers (admin only)
router.get('/', authMiddleware, (req, res) => {
  const db = readDB();
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  res.json(db.customers || []);
});

// Get customer by ID
router.get('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const customer = db.customers?.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// Create new customer
router.post('/', authMiddleware, (req, res) => {
  const { name, email, phone, company, address, billingAddress, shippingAddress, taxId, paymentTerms, notes } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const db = readDB();
  if (!db.customers) db.customers = [];

  // Check if customer with this email already exists
  const existing = db.customers.find(c => c.email === email);
  if (existing) {
    return res.status(400).json({ error: 'Customer with this email already exists' });
  }

  const customer = {
    id: uuidv4(),
    name,
    email,
    phone: phone || '',
    company: company || '',
    address: address || '',
    billingAddress: billingAddress || address || '',
    shippingAddress: shippingAddress || address || '',
    taxId: taxId || '',
    paymentTerms: paymentTerms || 'Net 30',
    notes: notes || '',
    balance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.customers.push(customer);
  writeDB(db);
  res.status(201).json(customer);
});

// Update customer
router.put('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const customerIndex = db.customers?.findIndex(c => c.id === req.params.id);

  if (customerIndex === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const { name, email, phone, company, address, billingAddress, shippingAddress, taxId, paymentTerms, notes } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Check if email is taken by another customer
  const existing = db.customers.find(c => c.email === email && c.id !== req.params.id);
  if (existing) {
    return res.status(400).json({ error: 'Email already in use by another customer' });
  }

  db.customers[customerIndex] = {
    ...db.customers[customerIndex],
    name,
    email,
    phone: phone || '',
    company: company || '',
    address: address || '',
    billingAddress: billingAddress || address || '',
    shippingAddress: shippingAddress || address || '',
    taxId: taxId || '',
    paymentTerms: paymentTerms || 'Net 30',
    notes: notes || '',
    updatedAt: new Date().toISOString()
  };

  writeDB(db);
  res.json(db.customers[customerIndex]);
});

// Delete customer
router.delete('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const customerIndex = db.customers?.findIndex(c => c.id === req.params.id);

  if (customerIndex === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  // Check if customer has outstanding invoices
  const hasInvoices = db.invoices?.some(inv => inv.customerId === req.params.id && inv.status !== 'paid');
  if (hasInvoices) {
    return res.status(400).json({ error: 'Cannot delete customer with outstanding invoices' });
  }

  db.customers.splice(customerIndex, 1);
  writeDB(db);
  res.json({ message: 'Customer deleted successfully' });
});

module.exports = router;