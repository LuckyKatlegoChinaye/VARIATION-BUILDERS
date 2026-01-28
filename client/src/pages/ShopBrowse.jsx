import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { formatBWP } from '../utils/currency.js'

export default function ShopBrowse() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('vb_cart')
      return raw ? JSON.parse(raw) : []
    } catch (_err) {
      return []
    }
  })
  const [addedProduct, setAddedProduct] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [searchTerm, selectedCategory, products])

  async function fetchProducts() {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.get('/api/inventory', { headers })
      setProducts(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  function filterProducts() {
    let filtered = products
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredProducts(filtered)
  }

  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      const updated = cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      setCart(updated)
      localStorage.setItem('vb_cart', JSON.stringify(updated))
    } else {
      const updated = [...cart, { ...product, qty: 1 }]
      setCart(updated)
      localStorage.setItem('vb_cart', JSON.stringify(updated))
    }
    setAddedProduct(product.id)
    setTimeout(() => setAddedProduct(null), 2000)
  }

  const categories = ['All', ...new Set(products.map(p => p.category))]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: '#1a1a1a', color: '#ffc107', border: '2px solid #ffc107', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', marginBottom: '15px' }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 10px 0' }}>Shop All Products</h1>
        <p style={{ color: '#666', margin: '0 0 20px 0' }}>Browse our complete product catalog</p>

        {/* Search Box */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by product name, SKU, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 15px',
              border: '2px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {categories.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              style={{
                backgroundColor: selectedCategory === category ? '#ffc107' : '#f0f0f0',
                color: selectedCategory === category ? '#1a1a1a' : '#666',
                border: selectedCategory === category ? 'none' : '1px solid #ddd',
                padding: '10px 18px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s'
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
        Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
      </div>

      {/* Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {filteredProducts.map(product => (
          <div key={product.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', background: '#fff', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '6px', marginBottom: '10px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {product.image ? (
                <img src={`/uploads/${product.image}`} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '48px' }}>📦</div>
              )}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '10px 0 5px 0', color: '#1a1a1a' }}>{product.name}</h3>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 5px 0' }}>SKU: {product.sku}</p>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px', minHeight: '40px' }}>{product.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffc107', margin: 0 }}>{formatBWP(product.price)}</p>
              <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Stock: {product.qty}</p>
            </div>
            <button
              type="button"
              onClick={() => addToCart(product)}
              disabled={product.qty <= 0}
              style={{
                width: '100%',
                padding: '10px',
                background: addedProduct === product.id ? '#28a745' : (product.qty <= 0 ? '#ccc' : '#ffc107'),
                color: product.qty <= 0 ? '#999' : '#1a1a1a',
                border: 'none',
                borderRadius: '4px',
                cursor: product.qty <= 0 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
            >
              {addedProduct === product.id ? '✓ Added to Cart' : (product.qty <= 0 ? 'Out of Stock' : 'Add to Cart')}
            </button>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>No products found</p>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
