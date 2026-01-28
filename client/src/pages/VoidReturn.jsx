import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { formatBWP } from '../utils/currency.js'

export default function VoidReturn() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [action, setAction] = useState(null) // 'void' or 'return'
  const [returnItems, setReturnItems] = useState([])
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [userRole, setUserRole] = useState('')
  const token = localStorage.getItem('token')

  useEffect(() => {
    // Get user role
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]))
      setUserRole(decoded.role)
    } catch (_err) {
      setUserRole('')
    }
    
    fetchSales()
  }, [token])

  async function fetchSales() {
    try {
      setLoading(true)
      const res = await axios.get('/api/sales', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSales(res.data || [])
    } catch (err) {
      console.error('Failed to fetch sales:', err)
      alert('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  function handleReturnItemChange(itemId, qty) {
    if (qty <= 0) {
      setReturnItems(prev => prev.filter(item => item.id !== itemId))
      return
    }
    setReturnItems(prev => {
      const existing = prev.find(item => item.id === itemId)
      if (existing) {
        return prev.map(item =>
          item.id === itemId ? { ...item, qty } : item
        )
      }
      const saleItem = selectedSale?.items?.find(si => si.id === itemId)
      if (saleItem) {
        return [...prev, { id: itemId, qty, price: saleItem.price }]
      }
      return prev
    })
  }

  async function handleVoid() {
    if (!selectedSale) {
      alert('Please select a sale')
      return
    }

    if (userRole !== 'ADMIN') {
      alert('Only admins can void sales')
      return
    }

    if (!window.confirm(`Void sale ${selectedSale.invoiceNumber} for ${formatBWP(selectedSale.total)}?`)) {
      return
    }

    setProcessing(true)
    try {
      await axios.post(`/api/sales/${selectedSale.id}/void`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Sale voided successfully')
      fetchSales()
      setSelectedSale(null)
      setAction(null)
      setReason('')
    } catch (err) {
      console.error('Failed to void sale:', err)
      alert(err.response?.data?.error || 'Failed to void sale')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReturn() {
    if (!selectedSale) {
      alert('Please select a sale')
      return
    }

    if (returnItems.length === 0) {
      alert('Please select items to return')
      return
    }

    if (!window.confirm(`Return items totaling ${formatBWP(returnItems.reduce((sum, item) => sum + (item.qty * item.price), 0))}?`)) {
      return
    }

    setProcessing(true)
    try {
      const res = await axios.post(`/api/sales/${selectedSale.id}/return`, { items: returnItems, reason }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.status === 202) {
        alert('Return request submitted for approval')
      } else {
        alert('Return processed successfully')
      }

      fetchSales()
      setSelectedSale(null)
      setAction(null)
      setReturnItems([])
      setReason('')
    } catch (err) {
      console.error('Failed to process return:', err)
      alert(err.response?.data?.error || 'Failed to process return')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h2>Loading Sales...</h2>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h2>Void & Return Management</h2>

      {userRole !== 'ADMIN' && (
        <div style={{
          padding: '12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          marginBottom: '20px',
          color: '#991b1b'
        }}>
          ⚠️ You have limited permissions. Some actions require admin approval.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Sales List */}
        <div>
          <h3>Recent Sales</h3>
          <div style={{
            border: '1px solid #e6e6e6',
            borderRadius: '8px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            {sales.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No sales found
              </p>
            ) : (
              sales.map(sale => (
                <div
                  key={sale.id}
                  onClick={() => {
                    setSelectedSale(sale)
                    setAction(null)
                    setReturnItems([])
                  }}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #e6e6e6',
                    cursor: 'pointer',
                    background: selectedSale?.id === sale.id ? '#eff6ff' : '#fff',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = selectedSale?.id === sale.id ? '#eff6ff' : '#fff'}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {sale.invoiceNumber}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    {new Date(sale.createdAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Items: {sale.items?.length || 0} | Payment: {sale.paymentMethod}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#10b981'
                  }}>
                    {formatBWP(sale.total)}
                  </div>
                  {sale.status === 'VOIDED' && (
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      borderRadius: '4px',
                      fontSize: '11px',
                      marginTop: '4px'
                    }}>
                      VOIDED
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details & Actions */}
        <div>
          {!selectedSale ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999',
              border: '1px solid #e6e6e6',
              borderRadius: '8px',
              background: '#fafafa'
            }}>
              <p style={{ marginTop: 0 }}>Select a sale to continue</p>
            </div>
          ) : (
            <div style={{
              border: '1px solid #e6e6e6',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{ marginTop: 0 }}>
                {selectedSale.invoiceNumber}
              </h3>

              {/* Sale Summary */}
              <div style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px'
              }}>
                <div style={{ marginBottom: '4px' }}>
                  <strong>Date:</strong> {new Date(selectedSale.createdAt).toLocaleString()}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>Payment:</strong> {selectedSale.paymentMethod}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>Items:</strong> {selectedSale.items?.length || 0}
                </div>
                <div style={{
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #e6e6e6',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#10b981'
                }}>
                  Total: {formatBWP(selectedSale.total)}
                </div>
                {selectedSale.status === 'VOIDED' && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '4px',
                    fontWeight: '600'
                  }}>
                    ⚠️ This sale has been voided
                  </div>
                )}
              </div>

              {/* Items List */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '8px' }}>Items</h4>
                <div style={{
                  background: '#f9fafb',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}>
                  {selectedSale.items?.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 0',
                        borderBottom: idx < (selectedSale.items?.length || 0) - 1 ? '1px solid #e6e6e6' : 'none'
                      }}
                    >
                      <div style={{ fontWeight: '600' }}>
                        {item.name} × {item.qty}
                      </div>
                      <div style={{ color: '#666' }}>
                        {formatBWP(item.price)} = {formatBWP(item.qty * item.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Selection */}
              {selectedSale.status !== 'VOIDED' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <button
                    onClick={() => setAction('void')}
                    disabled={userRole !== 'ADMIN'}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: action === 'void' ? '2px solid #ff6b6b' : '1px solid #e6e6e6',
                      background: action === 'void' ? '#fff5f5' : '#fff',
                      color: '#ff6b6b',
                      cursor: userRole === 'ADMIN' ? 'pointer' : 'not-allowed',
                      fontWeight: '600',
                      opacity: userRole === 'ADMIN' ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fas fa-ban"></i> Void Sale
                  </button>
                  <button
                    onClick={() => setAction('return')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: action === 'return' ? '2px solid #3b82f6' : '1px solid #e6e6e6',
                      background: action === 'return' ? '#eff6ff' : '#fff',
                      color: '#3b82f6',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fas fa-undo"></i> Return Items
                  </button>
                </div>
              )}

              {/* Void Section */}
              {action === 'void' && userRole === 'ADMIN' && (
                <div style={{
                  padding: '12px',
                  background: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ marginTop: 0, color: '#991b1b' }}>Void Sale</h4>
                  <p style={{ fontSize: '13px', marginBottom: '12px' }}>
                    This will cancel the entire sale and reverse inventory.
                  </p>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for voiding..."
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #fecaca',
                      fontSize: '12px',
                      minHeight: '60px',
                      boxSizing: 'border-box',
                      marginBottom: '12px',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    onClick={handleVoid}
                    disabled={processing}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#ff6b6b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      opacity: processing ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fas fa-exclamation-circle"></i> {processing ? 'Processing...' : 'Confirm Void'}
                  </button>
                </div>
              )}

              {/* Return Section */}
              {action === 'return' && (
                <div style={{
                  padding: '12px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ marginTop: 0 }}>Return Items</h4>
                  <div style={{ marginBottom: '12px' }}>
                    {selectedSale.items?.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px',
                          background: '#fff',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          border: '1px solid #dbeafe'
                        }}
                      >
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 100px',
                          gap: '8px',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '13px' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Available: {item.qty} × {formatBWP(item.price)}
                            </div>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max={item.qty}
                            value={returnItems.find(ri => ri.id === item.id)?.qty || 0}
                            onChange={(e) => handleReturnItemChange(item.id, parseInt(e.target.value) || 0)}
                            placeholder="Return qty"
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #dbeafe',
                              fontSize: '12px'
                            }}
                          />
                        </div>
                        {returnItems.find(ri => ri.id === item.id) && (
                          <div style={{
                            fontSize: '12px',
                            color: '#10b981',
                            fontWeight: '600'
                          }}>
                            Return: {formatBWP(returnItems.find(ri => ri.id === item.id).qty * item.price)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for return..."
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #bfdbfe',
                      fontSize: '12px',
                      minHeight: '60px',
                      boxSizing: 'border-box',
                      marginBottom: '12px',
                      fontFamily: 'inherit'
                    }}
                  />

                  {returnItems.length > 0 && (
                    <div style={{
                      padding: '8px',
                      background: '#f0fdf4',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#10b981'
                    }}>
                      Return Total: {formatBWP(returnItems.reduce((sum, item) => sum + (item.qty * item.price), 0))}
                    </div>
                  )}

                  <button
                    onClick={handleReturn}
                    disabled={processing || returnItems.length === 0}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: processing || returnItems.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: processing || returnItems.length === 0 ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fas fa-arrow-left"></i> {processing ? 'Processing...' : 'Submit Return'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
