import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { formatBWP } from '../utils/currency.js'

export default function Furniture() {
  const [products, setProducts] = useState([])
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

  async function fetchProducts() {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.get('/api/inventory', { headers })
      const filtered = res.data.filter(p => p.category === 'Office Furniture')
      setProducts(filtered || [])
    } catch (err) {
      console.error(err)
    }
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

  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: '#1a1a1a', color: '#ffc107', border: '2px solid #ffc107', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>Office Furniture</h1>
      </div>
      <p style={{ marginBottom: '30px', color: '#666' }}>Ergonomic chairs, desks, and storage solutions for your workspace.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {products.map(product => (
          <div key={product.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', background: '#fff' }}>
            <img src={`/uploads/${product.image}`} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '10px 0' }}>{product.name}</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>{product.description}</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a' }}>{formatBWP(product.price)}</p>
            <button
              type="button"
              onClick={() => addToCart(product)}
              style={{ width: '100%', padding: '10px', background: addedProduct === product.id ? '#28a745' : '#ffc107', color: '#1a1a1a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.3s' }}
            >
              {addedProduct === product.id ? '✓ Added to Cart' : 'Add to Cart'}
            </button>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>No products available in this category.</p>
      )}
    </div>
  )
}