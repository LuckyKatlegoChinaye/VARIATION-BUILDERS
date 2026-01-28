const express = require('express')
const { readDB } = require('../dataStore')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

// Get all products with inventory info
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = readDB()
    const inventory = db.inventory || []
    
    // Map inventory to products format
    const products = inventory.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      price: item.price,
      cost: item.cost || 0,
      description: item.description,
      image: item.image,
      category: item.category,
      quantity: item.qty || 0,
      available: (item.qty || 0) > 0
    }))

    res.json(products)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Get single product
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = readDB()
    const item = db.inventory?.find(i => i.id === req.params.id)
    
    if (!item) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const product = {
      id: item.id,
      name: item.name,
      sku: item.sku,
      price: item.price,
      cost: item.cost || 0,
      description: item.description,
      image: item.image,
      category: item.category,
      quantity: item.qty || 0,
      available: (item.qty || 0) > 0
    }

    res.json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
