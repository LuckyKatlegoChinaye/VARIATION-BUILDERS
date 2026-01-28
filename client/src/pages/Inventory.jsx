import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { formatBWP } from '../utils/currency.js'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('vb_cart')
      return raw ? JSON.parse(raw) : []
    } catch (_err) {
      return []
    }
  })
  const navigate = useNavigate()
  
  // Admin product management state
  const [userRole, setUserRole] = useState('customer')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [categories, setCategories] = useState([])
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    qty: '',
    description: '',
    image: ''
  })

  useEffect(() => {
    // Get user role
    const token = localStorage.getItem('token')
    if (token) {
      try {
        // JWT format: header.payload.signature - decode the payload (middle part)
        const decoded = JSON.parse(atob(token.split('.')[1]))
        setUserRole(decoded.role || 'customer')
      } catch (_err) {
        // ignore
      }
    }
    fetchItems()
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await axios.get('/api/categories')
      setCategories(res.data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.post('/api/categories', { name: newCategoryName }, { headers })
      alert('Category created successfully!')
      setNewCategoryName('')
      setShowCreateCategory(false)
      fetchCategories()
    } catch (err) {
      alert('Error creating category: ' + (err.response?.data?.error || err.message))
    }
  }

  async function fetchItems() {
    try {
      const currentShop = localStorage.getItem('currentShop') || 'default-shop';
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.get(`/api/inventory?shopId=${currentShop}`, { headers })
      setItems(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  function addToCart(item) {
    const existing = cart.find(c => c.itemId === item.id)
    if (existing) {
      setCart(cart.map(c => c.itemId === item.id ? { ...c, qty: c.qty + 1 } : c))
    } else {
      setCart([...cart, { itemId: item.id, name: item.name, price: item.price, qty: 1 }])
    }
  }

  function removeFromCart(itemId) {
    setCart(cart.filter(c => c.itemId !== itemId))
  }

  function updateQty(itemId, qty) {
    if (qty <= 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map(c => c.itemId === itemId ? { ...c, qty } : c))
    }
  }

  // persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vb_cart', JSON.stringify(cart))
    } catch (_err) {
      // ignore
    }
  }, [cart])

  // Admin product management functions
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        setFormData({...formData, image: reader.result})
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      
      const productData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        price: parseFloat(formData.price),
        qty: parseInt(formData.qty),
        description: formData.description,
        image: formData.image || ''
      }
      
      if (editingProduct) {
        // Update product
        await axios.put(`/api/inventory/${editingProduct.id}`, productData, { headers })
        alert('Product updated successfully!')
      } else {
        // Create new product
        await axios.post('/api/inventory', productData, { headers })
        alert('Product added successfully!')
      }
      
      setFormData({ name: '', sku: '', category: '', price: '', qty: '', description: '', image: '' })
      setImagePreview(null)
      setShowAddForm(false)
      setEditingProduct(null)
      fetchItems()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Error saving product')
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setImagePreview(product.image || null)
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category || '',
      price: product.price.toString(),
      qty: product.qty.toString(),
      description: product.description || '',
      image: product.image || ''
    })
    setShowAddForm(true)
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      await axios.delete(`/api/inventory/${productId}`, { headers })
      alert('Product deleted successfully!')
      fetchItems()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Error deleting product')
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingProduct(null)
    setFormData({ name: '', sku: '', category: '', price: '', qty: '', description: '', image: '' })
    setImagePreview(null)
  }

  async function createQuote() {
    if (cart.length === 0) {
      alert('Add items to cart')
      return
    }
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/')
        return
      }
      // JWT format: header.payload.signature - decode the payload (middle part)
      const decoded = JSON.parse(atob(token.split('.')[1]))
      const _res = await axios.post('/api/quotes', {
        userId: decoded.id,
        items: cart
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Quote created!')
      setCart([])
      navigate('/quotes')
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to create quote')
    }
  }

  const cartTotal = cart.reduce((sum, c) => sum + (c.price * c.qty), 0)

  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1a1a1a',
        color: '#ffc107',
        padding: '20px',
        borderBottom: '3px solid #ffc107'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              margin: 0,
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-boxes" style={{ marginRight: '15px' }}></i>
              Inventory & Quotes
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '16px' }}>
              Create professional quotations from your product inventory
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link
              to="/admin"
              style={{
                backgroundColor: '#333',
                color: '#ffc107',
                padding: '10px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
              Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        
        {/* Admin Product Management Section */}
        {userRole === 'admin' && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1a1a1a',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="fas fa-cogs" style={{ marginRight: '10px', color: '#dc3545' }}></i>
                    Inventory Management
                  </h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                    Add, edit, or remove products from inventory
                  </p>
                </div>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    style={{
                      backgroundColor: '#28a745',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="fas fa-plus"></i>
                    Add Product
                  </button>
                )}
              </div>

              {showAddForm && (
                <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
                  <form onSubmit={handleAddProduct}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '5px' }}>Product Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Product name"
                          required
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '5px' }}>SKU *</label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) => setFormData({...formData, sku: e.target.value})}
                          placeholder="Stock keeping unit"
                          required
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '5px' }}>Category</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <select
                            value={formData.category}
                            onChange={(e) => {
                              if (e.target.value === 'CREATE_NEW') {
                                setShowCreateCategory(true)
                              } else {
                                setFormData({...formData, category: e.target.value})
                              }
                            }}
                            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                          >
                            <option value="">-- Select Category --</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                            <option value="CREATE_NEW" style={{ fontWeight: 'bold', color: '#007bff' }}>+ Create New Category</option>
                          </select>
                        </div>
                        {showCreateCategory && (
                          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f8ff', border: '1px solid #007bff', borderRadius: '4px' }}>
                            <input
                              type="text"
                              placeholder="New category name"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              style={{ width: '100%', padding: '8px', border: '1px solid #007bff', borderRadius: '4px', fontSize: '14px', marginBottom: '8px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                type="button"
                                onClick={handleCreateCategory}
                                style={{ flex: 1, padding: '8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                              >
                                Create Category
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCreateCategory(false)
                                  setNewCategoryName('')
                                }}
                                style={{ flex: 1, padding: '8px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '5px' }}>Price (BWP) *</label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          placeholder="0.00"
                          step="0.01"
                          required
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '5px' }}>Quantity *</label>
                        <input
                          type="number"
                          value={formData.qty}
                          onChange={(e) => setFormData({...formData, qty: e.target.value})}
                          placeholder="0"
                          required
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '5px' }}>Description</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Product description"
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '5px' }}>Product Image</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '2px dashed #ddd', 
                                borderRadius: '4px', 
                                fontSize: '14px',
                                cursor: 'pointer'
                              }}
                            />
                            <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0' }}>
                              Supported formats: JPG, PNG, GIF. Max size: 5MB
                            </p>
                          </div>
                          {imagePreview && (
                            <div style={{ 
                              border: '1px solid #ddd', 
                              borderRadius: '4px', 
                              padding: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f9f9f9'
                            }}>
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '150px',
                                  borderRadius: '4px'
                                }} 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={handleCancel}
                        style={{
                          backgroundColor: '#6c757d',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          backgroundColor: '#007bff',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Products Section */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: 0,
                display: 'flex',
                alignItems: 'center'
              }}>
                <i className="fas fa-cube" style={{ marginRight: '10px', color: '#ffc107' }}></i>
                Available Products
              </h3>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                Select products to add to your quotation
              </p>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        borderBottom: '2px solid #e0e0e0'
                      }}>Product</th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        borderBottom: '2px solid #e0e0e0'
                      }}>SKU</th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        borderBottom: '2px solid #e0e0e0'
                      }}>Price</th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        borderBottom: '2px solid #e0e0e0'
                      }}>Stock</th>
                      <th style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        borderBottom: '2px solid #e0e0e0'
                      }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} style={{
                        borderBottom: '1px solid #e0e0e0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={item.image || '/images/placeholder.png'}
                              alt={item.name}
                              style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                border: '1px solid #e0e0e0'
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#666', fontSize: '12px' }}>
                          {item.sku}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1a1a1a' }}>
                          {formatBWP(item.price)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                          {item.qty}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              style={{
                                backgroundColor: '#ffc107',
                                color: '#1a1a1a',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '12px',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#e6b800'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#ffc107'}
                            >
                              <i className="fas fa-plus" style={{ marginRight: '5px' }}></i>
                              Add
                            </button>
                            {userRole === 'admin' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEditProduct(item)}
                                  style={{
                                    backgroundColor: '#17a2b8',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '12px'
                                  }}
                                  title="Edit product"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(item.id)}
                                  style={{
                                    backgroundColor: '#dc3545',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '12px'
                                  }}
                                  title="Delete product"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Shopping Cart */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            height: 'fit-content',
            position: 'sticky',
            top: '20px'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: 0,
                display: 'flex',
                alignItems: 'center'
              }}>
                <i className="fas fa-shopping-cart" style={{ marginRight: '10px', color: '#ffc107' }}></i>
                Quotation Cart
              </h3>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
              </p>
            </div>

            <div style={{ padding: '20px' }}>
              {cart.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#666'
                }}>
                  <i className="fas fa-shopping-cart" style={{
                    fontSize: '48px',
                    marginBottom: '20px',
                    color: '#ccc'
                  }}></i>
                  <p>Your cart is empty</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>
                    Add products from the inventory to create a quotation
                  </p>
                </div>
              ) : (
                <>
                  <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    marginBottom: '20px'
                  }}>
                    {cart.map(c => (
                      <div key={c.itemId} style={{
                        padding: '15px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        marginBottom: '12px',
                        backgroundColor: '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontWeight: '600',
                              color: '#1a1a1a',
                              marginBottom: '8px'
                            }}>
                              {c.name}
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              marginBottom: '8px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <label style={{ fontSize: '12px', color: '#666' }}>Qty:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={c.qty}
                                  onChange={e => updateQty(c.itemId, parseInt(e.target.value))}
                                  style={{
                                    width: '60px',
                                    padding: '4px 8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                  }}
                                />
                              </div>
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              {formatBWP(c.price)} × {c.qty} = <strong style={{ color: '#1a1a1a' }}>{formatBWP(c.price * c.qty)}</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(c.itemId)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div style={{
                    borderTop: '2px solid #e0e0e0',
                    paddingTop: '15px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '10px'
                    }}>
                      <span>Subtotal</span>
                      <span>{formatBWP(cartTotal)}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#17a2b8'
                    }}>
                      <span>Total</span>
                      <span>{formatBWP(cartTotal)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={createQuote}
                    style={{
                      width: '100%',
                      backgroundColor: '#28a745',
                      color: '#fff',
                      border: 'none',
                      padding: '15px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '16px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                  >
                    <i className="fas fa-file-invoice-dollar" style={{ marginRight: '8px' }}></i>
                    Create Quotation
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
