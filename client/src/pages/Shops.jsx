import React, { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import axios from 'axios'

export default function Shops() {
  const [shops, setShops] = useState([])
  const [users, setUsers] = useState([])
  const [showAddShop, setShowAddShop] = useState(false)
  const [showAssignUser, setShowAssignUser] = useState(false)
  const [selectedShop, setSelectedShop] = useState(null)
  const [newShop, setNewShop] = useState({ name: '', location: '', parentShopId: '', sharedInventory: false })
  const [assignment, setAssignment] = useState({ userId: '', role: 'cashier' })
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
  
  // Only admins can access this page
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" />
  }

  useEffect(() => {
    fetchShops()
    fetchUsers()
  }, [])

  async function fetchShops() {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.get('/api/shops', { headers })
      setShops(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.get('/api/users', { headers })
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAddShop(e) {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.post('/api/shops', newShop, { headers })
      setNewShop({ name: '', location: '', parentShopId: '', sharedInventory: false })
      setShowAddShop(false)
      fetchShops()
      alert('Shop added successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to add shop: ' + (err.response?.data?.error || err.message))
    }
  }

  async function handleAssignUser(e) {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.post(`/api/shops/${selectedShop.id}/users`, assignment, { headers })
      setAssignment({ userId: '', role: 'cashier' })
      setShowAssignUser(false)
      setSelectedShop(null)
      fetchShops()
      alert('User assigned successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to assign user: ' + (err.response?.data?.error || err.message))
    }
  }

  async function _handleRemoveUser(shopId, userId) {
    if (!confirm('Remove this user from the shop?')) return
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.delete(`/api/shops/${shopId}/users/${userId}`, { headers })
      fetchShops()
      alert('User removed successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to remove user: ' + (err.response?.data?.error || err.message))
    }
  }

  async function handleDeleteShop(shopId) {
    if (!confirm('Delete this shop? This will remove all assignments.')) return
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.delete(`/api/shops/${shopId}`, { headers })
      fetchShops()
      alert('Shop deleted successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to delete shop: ' + (err.response?.data?.error || err.message))
    }
  }

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
        padding: '20px 0',
        borderBottom: '3px solid #ffc107'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <i className="fas fa-store" style={{ marginRight: '15px' }}></i>
            Shop Management
          </h1>
          <p style={{
            color: '#ccc',
            fontSize: '16px',
            margin: 0,
            fontWeight: '300'
          }}>
            Manage multiple shops, branches, and user assignments
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Actions */}
        <div style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
          <button
            type="button"
            onClick={() => setShowAddShop(true)}
            style={{
              backgroundColor: '#ffc107',
              color: '#1a1a1a',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
            Add New Shop
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            style={{
              backgroundColor: '#1a1a1a',
              color: '#ffc107',
              border: '2px solid #ffc107',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
            Back to Admin
          </button>
        </div>

        {/* Shops List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {shops.map(shop => (
            <div key={shop.id} style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{
                  color: '#1a1a1a',
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '5px'
                }}>
                  {shop.name}
                </h3>
                <p style={{
                  color: '#666',
                  fontSize: '14px',
                  margin: '0 0 10px 0'
                }}>
                  <i className="fas fa-map-marker-alt" style={{ marginRight: '5px' }}></i>
                  {shop.location}
                </p>
                {shop.parentShopId && (
                  <p style={{
                    color: '#28a745',
                    fontSize: '12px',
                    margin: '0 0 10px 0'
                  }}>
                    <i className="fas fa-code-branch" style={{ marginRight: '5px' }}></i>
                    Branch of {shops.find(s => s.id === shop.parentShopId)?.name}
                    {shop.sharedInventory ? ' (Shared Inventory)' : ' (Separate Inventory)'}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShop(shop)
                    setShowAssignUser(true)
                  }}
                  style={{
                    backgroundColor: '#1a1a1a',
                    color: '#ffc107',
                    border: '2px solid #ffc107',
                    padding: '8px 15px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <i className="fas fa-user-plus" style={{ marginRight: '5px' }}></i>
                  Assign User
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteShop(shop.id)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <i className="fas fa-trash" style={{ marginRight: '5px' }}></i>
                  Delete Shop
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Shop Modal */}
        {showAddShop && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '30px',
              width: '500px',
              maxWidth: '90%'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#1a1a1a' }}>Add New Shop</h3>
              <form onSubmit={handleAddShop}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Shop Name</label>
                  <input
                    type="text"
                    value={newShop.name}
                    onChange={(e) => setNewShop({...newShop, name: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Location</label>
                  <input
                    type="text"
                    value={newShop.location}
                    onChange={(e) => setNewShop({...newShop, location: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Parent Shop (for branches)</label>
                  <select
                    value={newShop.parentShopId}
                    onChange={(e) => setNewShop({...newShop, parentShopId: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="">None (Main Shop)</option>
                    {shops.map(shop => (
                      <option key={shop.id} value={shop.id}>{shop.name}</option>
                    ))}
                  </select>
                </div>
                {newShop.parentShopId && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={newShop.sharedInventory}
                        onChange={(e) => setNewShop({...newShop, sharedInventory: e.target.checked})}
                        style={{ marginRight: '8px' }}
                      />
                      Share inventory with parent shop
                    </label>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddShop(false)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#ffc107',
                      color: '#1a1a1a',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Add Shop
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign User Modal */}
        {showAssignUser && selectedShop && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '30px',
              width: '500px',
              maxWidth: '90%'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#1a1a1a' }}>
                Assign User to {selectedShop.name}
              </h3>
              <form onSubmit={handleAssignUser}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>User</label>
                  <select
                    value={assignment.userId}
                    onChange={(e) => setAssignment({...assignment, userId: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="">Select User</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Role</label>
                  <select
                    value={assignment.role}
                    onChange={(e) => setAssignment({...assignment, role: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="cashier">Cashier - POS Operations</option>
                    <option value="worker">Worker - General Staff</option>
                    <option value="manager">Manager - Shop Management</option>
                    <option value="admin">Admin - Full Access</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignUser(false)
                      setSelectedShop(null)
                    }}
                    style={{
                      backgroundColor: '#6c757d',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#ffc107',
                      color: '#1a1a1a',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Assign User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}