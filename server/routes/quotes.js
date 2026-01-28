const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const { getNextQuotationNumber } = require('../utils/idGenerator.js');

const router = express.Router();

router.get('/', (_req, res) => {
  const db = readDB();
  res.json(db.quotes);
});

router.post('/', authMiddleware, (req, res) => {
  const { userId, items, notes, includeTax } = req.body;
  if (!userId || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Missing userId or items' });
  const db = readDB();
  
  // calculate totals
  let subtotal = 0;
  const enriched = items.map(it => {
    const inv = db.inventory.find(i => i.id === it.itemId);
    const price = inv ? inv.price : (it.price || 0);
    const qty = typeof it.qty === 'number' ? it.qty : 1;
    subtotal += price * qty;
    return { ...it, name: inv ? inv.name : it.name || '', price, qty };
  });
  
  // Calculate tax if included
  const taxAmount = (includeTax !== false) ? (subtotal * 0.12) : 0;
  const total = subtotal + taxAmount;
  
  const quotationNumber = getNextQuotationNumber();
  const quote = { 
    id: quotationNumber,
    quotationNumber,
    userId, 
    items: enriched,
    subtotal,
    tax: taxAmount,
    includeTax: includeTax !== false, // Store tax preference (default: true)
    notes: notes || '', 
    total, 
    status: 'draft', 
    createdAt: new Date().toISOString() 
  };
  
  db.quotes.push(quote);
  writeDB(db);
  res.status(201).json(quote);
});

router.post('/:id/convert', authMiddleware, (req, res) => {
  const db = readDB();
  const quote = db.quotes.find(q => q.id === req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  // simple invoice creation
  const invoice = { id: uuidv4(), quoteId: quote.id, userId: quote.userId, items: quote.items, total: quote.total, createdAt: new Date().toISOString(), status: 'unpaid' };
  db.invoices.push(invoice);
  quote.status = 'converted';
  writeDB(db);
  res.json(invoice);
});

// GET single quote
router.get('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const quote = db.quotes.find(q => q.id === req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  res.json(quote);
});

// UPDATE quote
router.put('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const quoteIndex = db.quotes.findIndex(q => q.id === req.params.id);
  if (quoteIndex === -1) return res.status(404).json({ error: 'Quote not found' });
  
  const { items, notes, includeTax } = req.body;
  const quote = db.quotes[quoteIndex];
  
  // Only allow editing if not converted
  if (quote.status === 'converted') {
    return res.status(400).json({ error: 'Cannot edit converted quotations' });
  }
  
  // Recalculate totals
  let subtotal = 0;
  const enriched = items.map(it => {
    const inv = db.inventory.find(i => i.id === it.itemId);
    const price = inv ? inv.price : (it.price || 0);
    const qty = typeof it.qty === 'number' ? it.qty : 1;
    subtotal += price * qty;
    return { ...it, name: inv ? inv.name : it.name || '', price, qty };
  });
  
  const taxAmount = (includeTax !== false) ? (subtotal * 0.12) : 0;
  const total = subtotal + taxAmount;
  
  // Update quote
  db.quotes[quoteIndex] = {
    ...quote,
    items: enriched,
    subtotal,
    tax: taxAmount,
    includeTax: includeTax !== false,
    notes: notes || '',
    total,
    updatedAt: new Date().toISOString()
  };
  
  writeDB(db);
  res.json(db.quotes[quoteIndex]);
});

// DELETE quote
router.delete('/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const quoteIndex = db.quotes.findIndex(q => q.id === req.params.id);
  if (quoteIndex === -1) return res.status(404).json({ error: 'Quote not found' });
  
  const quote = db.quotes[quoteIndex];
  
  // Only allow deleting if not converted
  if (quote.status === 'converted') {
    return res.status(400).json({ error: 'Cannot delete converted quotations' });
  }
  
  db.quotes.splice(quoteIndex, 1);
  writeDB(db);
  res.status(204).send();
});

module.exports = router;
