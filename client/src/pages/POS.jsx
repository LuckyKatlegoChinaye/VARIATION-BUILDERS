import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { formatBWP } from '../utils/currency.js'
import PaymentModal from '../components/PaymentModal.jsx'
import Receipt from '../components/Receipt.jsx'

export default function POS() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [categories, setCategories] = useState([])
  const [processing, setProcessing] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      setLoading(true)
      const res = await axios.get('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(res.data || [])
      
      // Extract unique categories
      const cats = ['all', ...new Set(res.data?.map(p => p.category).filter(Boolean))]
      setCategories(cats)
    } catch (err) {
      console.error('Failed to fetch products:', err)
      alert('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  // Filter products based on search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  function addToCart(product) {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id)
      if (existing) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      }
      return [...prevCart, { ...product, qty: 1 }]
    })
  }

  function updateQty(productId, qty) {
    if (qty <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, qty } : item
      )
    )
  }

  function removeFromCart(productId) {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  function clearCart() {
    if (window.confirm('Clear all items from cart?')) {
      setCart([])
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const tax = subtotal * 0.12 // 12% VAT
  const total = subtotal + tax

  async function completeSale(paymentData) {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }

    setProcessing(true)
    try {
      const saleData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: item.price,
          qty: item.qty
        })),
        subtotal,
        tax,
        total,
        paymentMethod: paymentData.method,
        amountPaid: paymentData.amountPaid || total,
        change: paymentData.change || 0,
        customerId: paymentData.customerId || null,
        customerName: paymentData.customerName || '',
        customerPhone: paymentData.customerPhone || '',
        notes: paymentData.notes || '',
        isCredit: paymentData.isCredit || false,
        approvalId: paymentData.approvalId || null
      }

      const res = await axios.post('/api/sales', saleData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setLastSale(res.data)
      setShowPaymentModal(false)
      setCart([])
      setShowReceipt(true)
      alert('Sale completed successfully!')
    } catch (err) {
      console.error('Failed to complete sale:', err)
      alert(err.response?.data?.error || 'Failed to complete sale')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h2>Loading POS...</h2>
        <p>Fetching products...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Products Section */}
      <div>
        <div style={{ marginBottom: '20px' }}>
          <h2>Point of Sale</h2>
          
          {/* Search & Filter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e6e6e6',
                fontSize: '14px'
              }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e6e6e6',
                fontSize: '14px'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Products Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {filteredProducts.length === 0 ? (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#999', padding: '40px 20px' }}>
                No products found
              </p>
            ) : (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  style={{
                    padding: '12px',
                    border: '1px solid #e6e6e6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: '#fff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ height: '120px', background: '#f5f5f5', borderRadius: '6px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={product.image || '/images/placeholder.png'}
                      alt={product.name}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px', minHeight: '32px' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                    SKU: {product.sku}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>
                    {formatBWP(product.price)}
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '12px',
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fas fa-plus-circle"></i> Add to Cart
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div style={{
        background: '#fff',
        border: '1px solid #e6e6e6',
        borderRadius: '8px',
        padding: '16px',
        height: 'fit-content',
        position: 'sticky',
        top: '20px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Cart</h3>
        
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          marginBottom: '16px',
          borderBottom: '1px solid #e6e6e6',
          paddingBottom: '16px'
        }}>
          {cart.length === 0 ? (
            <p style={{ color: '#999', fontSize: '13px', textAlign: 'center' }}>
              No items in cart
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px',
                    background: '#f9f9f9',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {item.name}
                  </div>
                  <div style={{ color: '#666', marginBottom: '6px', fontSize: '12px' }}>
                    {formatBWP(item.price)} × {item.qty} = {formatBWP(item.price * item.qty)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1)}
                      style={{
                        padding: '4px 6px',
                        borderRadius: '4px',
                        border: '1px solid #e6e6e6',
                        fontSize: '12px'
                      }}
                    />
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        padding: '4px 6px',
                        background: '#ff6b6b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span>Subtotal:</span>
            <strong>{formatBWP(subtotal)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span>Tax (12%):</span>
            <strong>{formatBWP(tax)}</strong>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px',
            background: '#10b981',
            color: '#fff',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}>
            <span>TOTAL:</span>
            <span>{formatBWP(total)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0 || processing}
            className="btn"
            style={{
              background: '#10b981',
              width: '100%',
              padding: '12px',
              fontWeight: 'bold',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="fas fa-credit-card"></i> {processing ? 'Processing...' : 'Checkout'}
          </button>
          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="btn"
            style={{
              background: '#ef4444',
              width: '100%',
              padding: '10px',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="fas fa-trash"></i> Clear Cart
          </button>
          <button
            onClick={() => {
              clearCart()
              window.location.href = '/void-return'
            }}
            className="btn"
            style={{
              background: '#f59e0b',
              width: '100%',
              padding: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: '600'
            }}
          >
            <i className="fas fa-undo-alt"></i> Void/Return
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          total={total}
          onClose={() => setShowPaymentModal(false)}
          onComplete={completeSale}
          isProcessing={processing}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <Receipt
          sale={lastSale}
          onClose={() => {
            setShowReceipt(false)
            setLastSale(null)
          }}
        />
      )}
    </div>
  )
}
