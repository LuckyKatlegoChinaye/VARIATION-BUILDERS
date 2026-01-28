import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { formatBWP } from '../utils/currency.js'

export default function Cart(){
  const [cart, setCart] = useState([])
  const navigate = useNavigate()

  useEffect(()=>{
    try{
      const raw = localStorage.getItem('vb_cart')
      setCart(raw ? JSON.parse(raw) : [])
    }catch(_err){ setCart([]) }
  }, [])

  function persist(c){
    setCart(c)
    localStorage.setItem('vb_cart', JSON.stringify(c))
  }

  function updateQty(id, qty){
    if(qty <= 0) return remove(id)
    const updated = cart.map(it => it.id === id ? { ...it, qty } : it)
    persist(updated)
  }

  function remove(id){
    const updated = cart.filter(it => it.id !== id)
    persist(updated)
  }

  function clear(){ persist([]) }

  async function createQuote(){
    if(cart.length === 0){ alert('Cart is empty'); return }
    const token = localStorage.getItem('token')
    if(!token){ navigate('/login'); return }
    try{
      const decoded = JSON.parse(atob(token.split('.')[1]))
      const items = cart.map(c => ({ itemId: c.id || c.itemId, qty: c.qty }))
      await axios.post('/api/quotes', { userId: decoded.id, items }, { headers: { Authorization: `Bearer ${token}` } })
      alert('Quote created')
      clear()
      navigate('/quotes')
    }catch(err){ console.error(err); alert(err.response?.data?.error || 'Failed to create quote') }
  }

  const total = cart.reduce((s,c) => s + (c.price * c.qty), 0)

  return (
    <div className="container">
      <h2>Shopping Cart</h2>
      {cart.length === 0 ? (
        <p className="muted">Your cart is empty.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
          <div>
            {cart.map(item => (
              <div key={item.itemId || item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee' }}>
                <img src={item.image || '/images/placeholder.png'} alt={item.name} style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700' }}>{item.name}</div>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>{formatBWP(item.price)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <input type="number" value={item.qty} min="1" onChange={e => updateQty(item.itemId || item.id, parseInt(e.target.value||'1'))} style={{ width: '72px', padding: '6px', borderRadius: '6px', border: '1px solid #e6e6e6' }} />
                  <button type="button" onClick={() => remove(item.itemId || item.id)} className="btn" style={{ background: '#ff6b6b' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '18px', borderRadius: '8px', background: '#fff', border: '1px solid #eee' }}>
            <h3 style={{ marginTop: 0 }}>Order Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Subtotal</span>
              <strong>{formatBWP(total)}</strong>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button type="button" onClick={createQuote} className="btn" style={{ background: '#f59e0b' }}>Request Quotation</button>
              <button type="button" onClick={clear} className="btn">Clear Cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
