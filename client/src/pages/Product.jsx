import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { formatBWP } from '../utils/currency.js'

export default function Product(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)

  useEffect(() => { fetchProduct() }, [id])

  async function fetchProduct(){
    try{
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.get(`/api/inventory/${id}`, { headers })
      setProduct(res.data)
    }catch(err){
      console.error(err)
    }
  }

  function addToCart(){
    try{
      const raw = localStorage.getItem('vb_cart')
      const cart = raw ? JSON.parse(raw) : []
      const existing = cart.find(c => c.itemId === product.id)
      if(existing){ existing.qty = (existing.qty || 1) + qty }
      else cart.push({ itemId: product.id, name: product.name, price: product.price, qty })
      localStorage.setItem('vb_cart', JSON.stringify(cart))
      navigate('/shop')
    }catch(err){ console.error(err) }
  }

  if(!product) return (
    <div className="container">Loading...</div>
  )

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingTop: '20px' }}>
      <div className="container">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '30px', alignItems: 'start' }}>
            <div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <img src={product.image || '/images/placeholder.png'} alt={product.name} style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain' }} />
              </div>
              <div style={{ marginTop: '20px' }}>
                <h2 style={{ margin: 0 }}>{product.name}</h2>
                <p style={{ color: '#6b7280' }}>{product.sku}</p>
              </div>
            </div>

            <div>
              <div className="card">
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#f59e0b' }}>{formatBWP(product.price)}</div>
                <p style={{ color: '#6b7280' }}>{product.description}</p>

                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="number" min="1" value={qty} onChange={e => setQty(parseInt(e.target.value || '1'))} style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #e6e6e6' }} />
                  <button type="button" onClick={addToCart} style={{ padding: '10px 14px', background: '#f59e0b', color: '#111827', border: 'none', borderRadius: '6px', fontWeight: '700' }}>Add to Cart</button>
                </div>

                <div style={{ marginTop: '18px', color: '#6b7280' }}>Stock: {product.qty}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px' }}>
            <h3>More from this category</h3>
            {/* Placeholder for related products */}
            <p style={{ color: '#6b7280' }}>Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
