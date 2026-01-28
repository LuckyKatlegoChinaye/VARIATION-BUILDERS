import React, { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import axios from 'axios'
import { formatBWP } from '../utils/currency.js'

export default function Shop() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  // Decode token to get user role
  let userRole = null
  if (token) {
    try {
      // JWT format: header.payload.signature - decode the payload (middle part)
      const decoded = JSON.parse(atob(token.split('.')[1]))
      userRole = decoded.role || 'user'
    } catch (_err) {
      // ignore
    }
  }

  // Only cashiers and admins can access this POS page
  if (!token || (userRole !== 'cashier' && userRole !== 'admin')) {
    return <Navigate to="/" />
  }

  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('vb_cart')
      return raw ? JSON.parse(raw) : []
    } catch (_err) {
      return []
    }
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [selectedCategory, setSelectedCategory] = useState('All Products')
  const [loading, setLoading] = useState(true)
  const [discount, setDiscount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProducts()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All Products' || product.category === selectedCategory
    return matchesSearch && matchesCategory && product.qty > 0
  })

  const categories = ['All Products', ...new Set(products.map(p => p.category).filter(Boolean))]

  async function fetchProducts() {
    try {
      setError(null)
      const currentShop = localStorage.getItem('currentShop') || 'default-shop'
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.get(`/api/inventory?shopId=${currentShop}`, { headers })
      setProducts(res.data || [])
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function addToCart(product) {
    if (product.qty <= 0) {
      setError('Product is out of stock')
      setTimeout(() => setError(null), 3000)
      return
    }

    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      if (existing.qty >= product.qty) {
        setError('Cannot add more than available stock')
        setTimeout(() => setError(null), 3000)
        return
      }
      const updated = cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      setCart(updated)
      localStorage.setItem('vb_cart', JSON.stringify(updated))
    } else {
      const updated = [...cart, { ...product, qty: 1 }]
      setCart(updated)
      localStorage.setItem('vb_cart', JSON.stringify(updated))
    }
  }

  function removeFromCart(productId) {
    const updated = cart.filter(item => item.id !== productId)
    setCart(updated)
    localStorage.setItem('vb_cart', JSON.stringify(updated))
  }

  function updateQty(productId, qty) {
    const product = products.find(p => p.id === productId)
    if (qty > product?.qty) {
      setError(`Cannot exceed available stock (${product?.qty})`)
      setTimeout(() => setError(null), 3000)
      return
    }
    if (qty <= 0) {
      removeFromCart(productId)
    } else {
      const updated = cart.map(item => item.id === productId ? { ...item, qty } : item)
      setCart(updated)
      localStorage.setItem('vb_cart', JSON.stringify(updated))
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const discountAmount = (cartTotal * discount) / 100
  const subtotalAfterDiscount = cartTotal - discountAmount
  const taxAmount = subtotalAfterDiscount * 0.12 // 12% VAT
  const grandTotal = subtotalAfterDiscount + taxAmount

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: '#ffc107', marginBottom: '20px' }}></i>
          <p style={{ color: '#666', fontSize: '18px' }}>Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Error Alert */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#dc3545',
          color: '#fff',
          padding: '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* POS Header */}
      <div style={{
        backgroundColor: '#1a1a1a',
        color: '#ffc107',
        padding: '15px 20px',
        borderBottom: '3px solid #ffc107',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0,
            display: 'flex',
            alignItems: 'center'
          }}>
            <i className="fas fa-cash-register" style={{ marginRight: '10px' }}></i>
            Point of Sale - Variation Builders
          </h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
            {currentTime.toLocaleDateString()} | {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setCart([])
              localStorage.removeItem('vb_cart')
              setDiscount(0)
            }}
            style={{
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            <i className="fas fa-plus" style={{ marginRight: '5px' }}></i>
            New Sale
          </button>
          {userRole === 'admin' && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                backgroundColor: '#ffc107',
                color: '#1a1a1a',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: '5px' }}></i>
              Back to Admin
            </button>
          )}
          <div style={{
            backgroundColor: '#333',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <i className="fas fa-shopping-cart" style={{ marginRight: '5px' }}></i>
            {cart.length} items
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        {/* Products Panel */}
        <div style={{
          flex: '1',
          padding: '20px',
          backgroundColor: '#fff',
          borderRight: '1px solid #e0e0e0'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              color: '#1a1a1a',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-boxes" style={{ marginRight: '10px', color: '#ffc107' }}></i>
              Products ({filteredProducts.length})
            </h2>

            {/* Search Bar */}
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {categories.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    backgroundColor: selectedCategory === category ? '#ffc107' : '#f0f0f0',
                    color: selectedCategory === category ? '#1a1a1a' : '#666',
                    border: selectedCategory === category ? 'none' : '1px solid #ddd',
                    padding: '8px 15px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
            maxHeight: 'calc(100vh - 250px)',
            overflowY: 'auto'
          }}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: product.qty > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                  opacity: product.qty > 0 ? 1 : 0.6,
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  if (product.qty > 0) {
                    e.currentTarget.style.borderColor = '#ffc107'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {product.qty <= 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    OUT OF STOCK
                  </div>
                )}
                <div style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }} />
                  ) : (
                    '📦'
                  )}
                </div>
                <h3 style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  marginBottom: '5px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minHeight: '20px'
                }}>
                  {product.name}
                </h3>
                <p style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#ffc107',
                  margin: '5px 0'
                }}>
                  {formatBWP(product.price)}
                </p>
                <p style={{
                  fontSize: '11px',
                  color: product.qty > 5 ? '#28a745' : product.qty > 0 ? '#ff9800' : '#dc3545',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  Stock: {product.qty}
                </p>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              fontSize: '16px'
            }}>
              <i className="fas fa-box-open" style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}></i>
              <p>{searchTerm ? 'No products found matching your search' : 'No products available'}</p>
            </div>
          )}
        </div>

        {/* Cart/Checkout Panel */}
        <div style={{
          width: '400px',
          backgroundColor: '#fafafa',
          borderLeft: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Cart Items */}
          <div style={{ flex: '1', padding: '20px', overflowY: 'auto' }}>
            <h3 style={{
              color: '#1a1a1a',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-shopping-cart" style={{ marginRight: '10px', color: '#ffc107' }}></i>
              Current Sale
            </h3>

            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
              }}>
                <i className="fas fa-cart-plus" style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}></i>
                <p>Cart is empty</p>
                <p style={{ fontSize: '14px' }}>Click on products to add them</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }} />
                      ) : (
                        '📦'
                      )}
                    </div>
                    <div style={{ flex: '1' }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        margin: '0 0 5px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.name}
                      </h4>
                      <p style={{
                        fontSize: '12px',
                        color: '#666',
                        margin: 0
                      }}>
                        {formatBWP(item.price)} each
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        style={{
                          backgroundColor: '#f0f0f0',
                          color: '#666',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '5px 10px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      >
                        -
                      </button>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        minWidth: '30px',
                        textAlign: 'center'
                      }}>
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        style={{
                          backgroundColor: '#f0f0f0',
                          color: '#666',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '5px 10px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          backgroundColor: '#ff6b6b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '5px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Summary */}
          {cart.length > 0 && (
            <div style={{
              backgroundColor: '#fff',
              borderTop: '1px solid #e0e0e0',
              padding: '20px'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  <span>Subtotal:</span>
                  <span>{formatBWP(cartTotal)}</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#666',
                  alignItems: 'center'
                }}>
                  <span>Discount (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    style={{
                      width: '60px',
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      textAlign: 'right',
                      fontSize: '13px'
                    }}
                  />
                </div>

                {discountAmount > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#28a745',
                    fontWeight: '600'
                  }}>
                    <span>Discount Amount:</span>
                    <span>-{formatBWP(discountAmount)}</span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  <span>Tax (12%):</span>
                  <span>{formatBWP(taxAmount)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  borderTop: '1px solid #e0e0e0',
                  paddingTop: '10px'
                }}>
                  <span>Total:</span>
                  <span>{formatBWP(grandTotal)}</span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>
                  Payment Method:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/checkout', { state: { cart, total: grandTotal, paymentMethod } })}
                  style={{
                    backgroundColor: '#ffc107',
                    color: '#1a1a1a',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className="fas fa-credit-card" style={{ marginRight: '8px' }}></i>
                  Process Payment
                </button>

                <button
                  type="button"
                  onClick={() => setCart([])}
                  style={{
                    backgroundColor: '#f0f0f0',
                    color: '#666',
                    border: '1px solid #ddd',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <i className="fas fa-trash" style={{ marginRight: '8px' }}></i>
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
