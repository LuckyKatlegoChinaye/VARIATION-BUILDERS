import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { formatBWP } from '../utils/currency.js'

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, total, paymentMethod } = location.state || {}

  const [customer, setCustomer] = useState('')
  const [customers, setCustomers] = useState([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethod || 'Cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [change, setChange] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    if (!cart || cart.length === 0) {
      navigate('/shop')
      return
    }
    fetchCustomers()
  }, [cart, navigate])

  useEffect(() => {
    if (selectedPaymentMethod === 'Cash' && amountPaid) {
      const paid = parseFloat(amountPaid) || 0
      const totalAmount = total || cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
      setChange(Math.max(0, paid - totalAmount))
    } else {
      setChange(0)
    }
  }, [amountPaid, selectedPaymentMethod, total, cart])

  async function fetchCustomers() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCustomers(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCompleteSale() {
    if (!cart || cart.length === 0) return

    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      const currentShop = localStorage.getItem('currentShop') || 'default-shop'
      
      // Calculate totals with discount support from previous screen
      const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
      const taxAmount = cartTotal * 0.12 // 12% VAT
      const grandTotal = cartTotal + taxAmount

      // Create invoice with all required fields
      const invoiceData = {
        customerId: customer || null,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: item.price,
          qty: item.qty,
          total: item.price * item.qty
        })),
        subtotal: cartTotal,
        taxAmount: taxAmount,
        total: grandTotal,
        paymentMethod: selectedPaymentMethod,
        amountPaid: selectedPaymentMethod === 'Cash' ? parseFloat(amountPaid) : grandTotal,
        change: selectedPaymentMethod === 'Cash' ? change : 0,
        status: 'completed',
        notes: `POS Sale - Shop: ${currentShop}`,
        timestamp: new Date().toISOString()
      }

      // Create invoice first
      const invoiceRes = await axios.post('/api/invoices', invoiceData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!invoiceRes.data?.id) {
        throw new Error('Failed to create invoice - no invoice ID returned')
      }

      // Update inventory for each item
      let inventoryUpdatesFailed = false
      for (const item of cart) {
        if (item.id) {
          try {
            // Get current stock first
            const currentItem = await axios.get(`/api/inventory/${item.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            
            const currentQty = currentItem.data?.qty || 0
            const newQty = Math.max(0, currentQty - item.qty)
            
            // Update with new quantity
            await axios.put(`/api/inventory/${item.id}`, {
              qty: newQty,
              lastModified: new Date().toISOString()
            }, {
              headers: { Authorization: `Bearer ${token}` }
            })
          } catch (err) {
            console.error(`Failed to update inventory for item ${item.id}:`, err)
            inventoryUpdatesFailed = true
          }
        }
      }

      // Generate receipt data
      const receiptData = {
        invoiceId: invoiceRes.data.id,
        invoiceNumber: invoiceRes.data.id.slice(0, 8).toUpperCase(),
        items: cart,
        subtotal: cartTotal,
        tax: taxAmount,
        total: grandTotal,
        paymentMethod: selectedPaymentMethod,
        amountPaid: selectedPaymentMethod === 'Cash' ? parseFloat(amountPaid) : grandTotal,
        change: change,
        customer: customer ? customers.find(c => c.id === customer) : null,
        timestamp: new Date().toISOString(),
        shop: currentShop
      }

      setReceipt(receiptData)

      // Clear cart and session storage
      localStorage.removeItem('vb_cart')

      // Show success with warning if inventory updates failed
      if (inventoryUpdatesFailed) {
        alert('Sale completed but some inventory updates failed. Please review inventory manually.')
      } else {
        alert('Sale completed successfully!')
      }

    } catch (err) {
      console.error('Failed to complete sale:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error occurred'
      alert('Failed to complete sale: ' + errorMessage)
    } finally {
      setProcessing(false)
    }
  }
      }

      setReceipt(receiptData)

      // Clear cart
      localStorage.removeItem('vb_cart')

      // Show success message
      alert('Sale completed successfully!')

    } catch (err) {
      console.error(err)
      alert('Failed to complete sale: ' + (err.response?.data?.error || err.message))
    } finally {
      setProcessing(false)
    }
  }

  function handleNewSale() {
    navigate('/shop')
  }

  function handlePrintReceipt() {
    window.print()
  }

  if (!cart || cart.length === 0) {
    return <div>Loading...</div>
  }

  const subtotal = total || cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const taxAmount = subtotal * 0.12
  const grandTotal = subtotal + taxAmount

  if (receipt) {
    return (
      <div style={{
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Receipt */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }} id="receipt">
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h1 style={{ color: '#1a1a1a', marginBottom: '10px' }}>Variation Builders</h1>
              <p style={{ color: '#666', margin: '0' }}>Point of Sale Receipt</p>
              <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                Invoice #{receipt.invoiceId?.slice(0, 8)}...
              </p>
              <p style={{ color: '#666', fontSize: '14px', margin: '0' }}>
                {new Date(receipt.timestamp).toLocaleString()}
              </p>
            </div>

            {receipt.customer && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}>Customer</h4>
                <p style={{ margin: '0', color: '#666' }}>{receipt.customer.name}</p>
                <p style={{ margin: '0', color: '#666' }}>{receipt.customer.email}</p>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '10px 0', textAlign: 'left', fontWeight: '600', color: '#1a1a1a' }}>Item</th>
                    <th style={{ padding: '10px 0', textAlign: 'center', fontWeight: '600', color: '#1a1a1a' }}>Qty</th>
                    <th style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600', color: '#1a1a1a' }}>Price</th>
                    <th style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600', color: '#1a1a1a' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 0', color: '#666' }}>{item.name}</td>
                      <td style={{ padding: '10px 0', textAlign: 'center', color: '#666' }}>{item.qty}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', color: '#666' }}>{formatBWP(item.price)}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', color: '#666' }}>{formatBWP(item.price * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#666' }}>Subtotal:</span>
                <span style={{ color: '#1a1a1a', fontWeight: '600' }}>{formatBWP(receipt.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#666' }}>Tax (12%):</span>
                <span style={{ color: '#1a1a1a', fontWeight: '600' }}>{formatBWP(receipt.tax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                <span style={{ color: '#1a1a1a' }}>Total:</span>
                <span style={{ color: '#ffc107' }}>{formatBWP(receipt.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#666' }}>Payment Method:</span>
                <span style={{ color: '#1a1a1a', fontWeight: '600' }}>{receipt.paymentMethod}</span>
              </div>
              {receipt.paymentMethod === 'Cash' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#666' }}>Amount Paid:</span>
                    <span style={{ color: '#1a1a1a', fontWeight: '600' }}>{formatBWP(receipt.amountPaid)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Change:</span>
                    <span style={{ color: '#28a745', fontWeight: '600' }}>{formatBWP(receipt.change)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              onClick={handlePrintReceipt}
              style={{
                backgroundColor: '#ffc107',
                color: '#1a1a1a',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              <i className="fas fa-print" style={{ marginRight: '8px' }}></i>
              Print Receipt
            </button>
            <button
              onClick={handleNewSale}
              style={{
                backgroundColor: '#28a745',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
              New Sale
            </button>
          </div>
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
      {/* Header */}
      <div style={{
        backgroundColor: '#1a1a1a',
        color: '#ffc107',
        padding: '20px',
        borderBottom: '3px solid #ffc107'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            margin: 0,
            display: 'flex',
            alignItems: 'center'
          }}>
            <i className="fas fa-cash-register" style={{ marginRight: '15px' }}></i>
            Checkout - Complete Sale
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '16px' }}>
            Process payment and complete the transaction
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Order Summary */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-shopping-cart" style={{ marginRight: '10px', color: '#ffc107' }}></i>
              Order Summary
            </h3>

            <div style={{ marginBottom: '20px' }}>
              {cart.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '5px' }}>
                      {item.name}
                    </div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      {formatBWP(item.price)} × {item.qty}
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#ffc107' }}>
                    {formatBWP(item.price * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#666' }}>Subtotal:</span>
                <span style={{ color: '#1a1a1a', fontWeight: '600' }}>{formatBWP(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#666' }}>Tax (12%):</span>
                <span style={{ color: '#1a1a1a', fontWeight: '600' }}>{formatBWP(taxAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                <span style={{ color: '#1a1a1a' }}>Total:</span>
                <span style={{ color: '#ffc107' }}>{formatBWP(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '20px',
            height: 'fit-content'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-credit-card" style={{ marginRight: '10px', color: '#ffc107' }}></i>
              Payment Details
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '8px'
              }}>
                Customer (Optional)
              </label>
              <select
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Walk-in Customer</option>
                {customers.map(cust => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} - {cust.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '8px'
              }}>
                Payment Method
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {selectedPaymentMethod === 'Cash' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>
                  Amount Paid
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {change > 0 && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    color: '#155724'
                  }}>
                    Change: {formatBWP(change)}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCompleteSale}
              disabled={processing || (selectedPaymentMethod === 'Cash' && (!amountPaid || parseFloat(amountPaid) < grandTotal))}
              style={{
                width: '100%',
                backgroundColor: processing ? '#ccc' : '#28a745',
                color: '#fff',
                border: 'none',
                padding: '15px',
                borderRadius: '6px',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                marginBottom: '10px'
              }}
            >
              {processing ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                  Complete Sale
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/shop')}
              style={{
                width: '100%',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
              Back to POS
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
