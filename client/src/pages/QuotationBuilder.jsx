import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { formatBWP } from '../utils/currency.js'
import QuotationPrint from '../components/QuotationPrint.jsx'

export default function QuotationBuilder() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  
  if (!token) {
    navigate('/')
    return null
  }

  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Products')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItems, setSelectedItems] = useState(() => {
    try {
      const raw = localStorage.getItem('vb_quote_items')
      return raw ? JSON.parse(raw) : []
    } catch (_err) {
      return []
    }
  })
  const [viewMode, setViewMode] = useState('browse') // 'browse' or 'review'
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [tempQuotationNumber, setTempQuotationNumber] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])

  useEffect(() => {
    localStorage.setItem('vb_quote_items', JSON.stringify(selectedItems))
  }, [selectedItems])

  async function fetchProducts() {
    try {
      setError(null)
      const token = localStorage.getItem('token')
      const currentShop = localStorage.getItem('currentShop') || 'default-shop'
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      // Try /api/products first, fallback to /api/inventory
      try {
        const res = await axios.get(`/api/products?shopId=${currentShop}`, { headers })
        setProducts(res.data || [])
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 401) {
          const res = await axios.get(`/api/inventory?shopId=${currentShop}`, { headers })
          setProducts(res.data || [])
        } else {
          throw err
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function filterProducts() {
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'All Products' || product.category === selectedCategory
      return matchesSearch && matchesCategory && product.qty > 0
    })
    setFilteredProducts(filtered)
  }

  const categories = ['All Products', ...new Set(products.map(p => p.category).filter(Boolean))]

  function toggleProductSelection(product) {
    const existing = selectedItems.find(item => item.id === product.id)
    if (existing) {
      // Remove if exists
      setSelectedItems(selectedItems.filter(item => item.id !== product.id))
    } else {
      // Add with quantity 1
      setSelectedItems([...selectedItems, { ...product, selectedQty: 1 }])
    }
  }

  function updateQuantity(productId, qty) {
    if (qty <= 0) {
      setSelectedItems(selectedItems.filter(item => item.id !== productId))
    } else {
      const product = selectedItems.find(item => item.id === productId)
      if (product && qty > product.qty) {
        setError(`Cannot select more than ${product.qty} available`)
        setTimeout(() => setError(null), 3000)
        return
      }
      setSelectedItems(selectedItems.map(item =>
        item.id === productId ? { ...item, selectedQty: qty } : item
      ))
    }
  }

  function removeFromSelection(productId) {
    setSelectedItems(selectedItems.filter(item => item.id !== productId))
  }

  function isProductSelected(productId) {
    return selectedItems.some(item => item.id === productId)
  }

  async function submitQuotation() {
    if (selectedItems.length === 0) {
      setError('Please select at least one item')
      return
    }

    try {
      // JWT format: header.payload.signature - decode the payload (middle part)
      const decoded = JSON.parse(atob(token.split('.')[1]))
      const quotationItems = selectedItems.map(item => ({
        itemId: item.id,
        name: item.name,
        price: item.price,
        qty: item.selectedQty
      }))
      
      const total = selectedItems.reduce((sum, item) => sum + (item.price * item.selectedQty), 0)

      const res = await axios.post('/api/quotes', {
        userId: decoded.id,
        items: quotationItems,
        total: total
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Store the quotation number for later use
      setTempQuotationNumber(res.data.quotationNumber || res.data.id)
      localStorage.removeItem('vb_quote_items')
      setSelectedItems([])
      alert('Quotation created successfully!')
      navigate('/quotes')
    } catch (err) {
      console.error('Failed to create quotation:', err)
      setError(err.response?.data?.error || 'Failed to create quotation')
    }
  }

  const totalValue = selectedItems.reduce((sum, item) => sum + (item.price * item.selectedQty), 0)
  const totalItems = selectedItems.reduce((sum, item) => sum + item.selectedQty, 0)

  if (viewMode === 'review') {
    return (
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
        {/* Review Header */}
        <div style={{ marginBottom: '30px' }}>
          <button onClick={() => setViewMode('browse')} style={{
            background: 'none',
            border: 'none',
            color: '#ffc107',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            padding: '0',
            marginBottom: '15px'
          }}>
            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
            Back to Browse
          </button>

          <div className="card" style={{
            background: 'linear-gradient(135deg, #ffc107 0%, #1a1a1a 100%)',
            color: '#fff',
            borderRadius: '12px',
            padding: '30px',
            textAlign: 'center'
          }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px' }}>Review Your Quotation</h1>
            <p style={{ opacity: 0.95, marginBottom: '0' }}>
              Review the items you've selected before submitting your quotation request
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row" style={{ marginBottom: '30px' }}>
          <div className="col-lg-3 col-md-6 col-12">
            <div className="card" style={{ textAlign: 'center', background: '#f3f4f6', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>{selectedItems.length}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Products Selected</div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <div className="card" style={{ textAlign: 'center', background: '#f3f4f6', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>{totalItems}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Total Items</div>
            </div>
          </div>
          <div className="col-lg-6 col-md-12 col-12">
            <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #ffc107 0%, #1a1a1a 100%)', color: '#fff', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>{formatBWP(totalValue)}</div>
              <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>Total Value</div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="card" style={{ marginBottom: '30px', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: '0' }}>Selected Items</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f3f4f6' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Product Name</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Unit Price</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Quantity</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Total</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a1a', fontWeight: '500' }}>{item.name}</td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>{formatBWP(item.price)}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <button onClick={() => updateQuantity(item.id, item.selectedQty - 1)} style={{
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          width: '28px',
                          height: '28px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#1a1a1a'
                        }}>−</button>
                        <input type="number" min="1" max={item.qty} value={item.selectedQty} onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)} style={{
                          width: '50px',
                          padding: '6px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontSize: '13px'
                        }} />
                        <button onClick={() => updateQuantity(item.id, item.selectedQty + 1)} style={{
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          width: '28px',
                          height: '28px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#1a1a1a'
                        }}>+</button>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a1a1a', fontWeight: '600' }}>{formatBWP(item.price * item.selectedQty)}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button onClick={() => removeFromSelection(item.id)} style={{
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        color: '#dc2626',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        <i className="fas fa-trash" style={{ marginRight: '4px' }}></i>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setViewMode('browse')} style={{
            flex: 1,
            padding: '14px 20px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            color: '#1a1a1a',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px'
          }}>
            <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
            Add More Items
          </button>
          <button onClick={() => setShowPrintPreview(true)} style={{
            flex: 1,
            padding: '14px 20px',
            background: '#e3f2fd',
            border: '1px solid #3b82f6',
            color: '#3b82f6',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px'
          }}>
            <i className="fas fa-print" style={{ marginRight: '8px' }}></i>
            Print/Download
          </button>
          <button onClick={submitQuotation} style={{
            flex: 1,
            padding: '14px 20px',
            background: '#ffc107',
            border: 'none',
            color: '#1a1a1a',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '15px'
          }}>
            <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
            Submit Quotation
          </button>
        </div>
        {showPrintPreview && (
          <QuotationPrint
            items={selectedItems}
            totalValue={totalValue}
            quotationNumber={tempQuotationNumber}
            onClose={() => setShowPrintPreview(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #ffc107 100%)',
          color: '#fff',
          borderRadius: '12px',
          padding: '30px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px' }}>Browse Our Inventory</h1>
          <p style={{ opacity: 0.95, marginBottom: '0' }}>
            Select products to include in your quotation. Use the search or filters to find what you need.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="row" style={{ marginBottom: '30px', gap: '16px' }}>
        <div className="col-lg-8 col-md-12 col-12">
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '14px', color: '#9ca3af', fontSize: '15px' }}></i>
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>
        <div className="col-lg-4 col-md-12 col-12">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Summary Bar */}
      {selectedItems.length > 0 && (
        <div style={{
          background: '#fef3c7',
          border: '2px solid #fcd34d',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#78350f', marginRight: '15px' }}>
              <i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i>
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#78350f' }}>
              Total: {formatBWP(totalValue)}
            </span>
          </div>
          <button onClick={() => setViewMode('review')} style={{
            background: '#ffc107',
            border: 'none',
            color: '#1a1a1a',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px'
          }}>
            <i className="fas fa-arrow-right" style={{ marginRight: '6px' }}></i>
            Review Selection
          </button>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '16px', display: 'block' }}></i>
          Loading inventory...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px', display: 'block' }}></i>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>No products found</h3>
          <p style={{ color: '#6b7280', marginBottom: '0' }}>
            Try adjusting your search terms or filters
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {filteredProducts.map((product) => {
            const isSelected = isProductSelected(product.id)
            const selectedItem = selectedItems.find(item => item.id === product.id)
            return (
              <div
                key={product.id}
                style={{
                  background: '#fff',
                  border: isSelected ? '2px solid #ffc107' : '1px solid #e5e7eb',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: isSelected ? '0 4px 12px rgba(255, 193, 7, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Product Info */}
                <div style={{ padding: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500', marginBottom: '4px' }}>
                      SKU: {product.sku}
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px', margin: '0' }}>
                      {product.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {product.category}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Unit Price</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffc107' }}>{formatBWP(product.price)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>In Stock</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>{product.qty}</div>
                    </div>
                  </div>

                  {/* Selection Controls */}
                  {isSelected ? (
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Quantity Selected</div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <button
                          onClick={() => updateQuantity(product.id, selectedItem.selectedQty - 1)}
                          style={{
                            flex: 1,
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            padding: '8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1a1a1a'
                          }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={product.qty}
                          value={selectedItem.selectedQty}
                          onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            border: '1px solid #ffc107',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#ffc107'
                          }}
                        />
                        <button
                          onClick={() => updateQuantity(product.id, selectedItem.selectedQty + 1)}
                          style={{
                            flex: 1,
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            padding: '8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1a1a1a'
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => toggleProductSelection(product)}
                        style={{
                          width: '100%',
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          color: '#dc2626',
                          padding: '10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}
                      >
                        <i className="fas fa-times" style={{ marginRight: '4px' }}></i>
                        Deselect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleProductSelection(product)}
                      style={{
                        width: '100%',
                        background: '#ffc107',
                        border: 'none',
                        color: '#1a1a1a',
                        padding: '10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '13px'
                      }}
                    >
                      <i className="fas fa-plus" style={{ marginRight: '4px' }}></i>
                      Add to Quotation
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
