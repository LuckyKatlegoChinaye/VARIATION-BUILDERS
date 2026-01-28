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
  const [error, setError] = useState(null)

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
      console.error('Failed to fetch customers:', err)
    }
  }

  async function handleCompleteSale() {
    if (!cart || cart.length === 0) return

    // Validate cash payment
    if (selectedPaymentMethod === 'Cash') {
      const paid = parseFloat(amountPaid) || 0
      const totalAmount = total || cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
      if (paid < totalAmount) {
        setError('Amount paid is less than total. Please enter correct amount.')
        return
      }
    }

    setProcessing(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const currentShop = localStorage.getItem('currentShop') || 'default-shop'
      
      // Calculate totals
      const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
      const taxAmount = cartTotal * 0.12
      const grandTotal = cartTotal + taxAmount

      // Create invoice
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

      const invoiceRes = await axios.post('/api/invoices', invoiceData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!invoiceRes.data?.id) {
        throw new Error('Failed to create invoice')
      }

      // Update inventory for each item
      let inventoryErrors = []
      for (const item of cart) {
        if (item.id) {
          try {
            const currentItem = await axios.get(`/api/inventory/${item.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            
            const currentQty = currentItem.data?.qty || 0
            const newQty = Math.max(0, currentQty - item.qty)
            
            await axios.put(`/api/inventory/${item.id}`, {
              qty: newQty,
              lastModified: new Date().toISOString()
            }, {
              headers: { Authorization: `Bearer ${token}` }
            })
          } catch (err) {
            console.error(`Failed to update inventory for item ${item.id}:`, err)
            inventoryErrors.push(item.name)
          }
        }
      }

      // Generate receipt
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
        shop: currentShop,
        inventoryErrors
      }

      setReceipt(receiptData)
      localStorage.removeItem('vb_cart')

    } catch (err) {
      console.error('Failed to complete sale:', err)
      setError(err.response?.data?.error || err.message || 'Failed to complete sale')
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
    return (
      <div style={{
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-shopping-cart" style={{ fontSize: '48px', color: '#ffc107', marginBottom: '20px', opacity: 0.5 }}></i>
          <p style={{ color: '#666', fontSize: '16px' }}>Cart is empty. Redirecting...</p>
        </div>
      </div>
    )
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
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Receipt */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '40px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }} id="receipt">
            {/* Receipt Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #ffc107' }}>
              <h1 style={{ color: '#1a1a1a', margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
                Variation Builders
              </h1>
              <p style={{ color: '#666', margin: '5px 0', fontSize: '16px', fontWeight: '600' }}>
                Point of Sale Receipt
              </p>
              <div style={{ marginTop: '15px', fontSize: '13px', color: '#999' }}>
                <p style={{ margin: '3px 0' }}>Invoice # {receipt.invoiceNumber}</p>
                <p style={{ margin: '3px 0' }}>Date: {new Date(receipt.timestamp).toLocaleDateString()}</p>
                <p style={{ margin: '3px 0' }}>Time: {new Date(receipt.timestamp).toLocaleTimeString()}</p>
                {receipt.shop && <p style={{ margin: '3px 0' }}>Location: {receipt.shop}</p>}
              </div>
            </div>

            {/* Customer Information */}
            {receipt.customer && (
              <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', borderLeft: '4px solid #ffc107' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1a1a1a', fontSize: '14px', fontWeight: '600' }}>Customer Information</h4>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                  <strong>Name:</strong> {receipt.customer.name}
                </p>
                {receipt.customer.email && (
                  <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                    <strong>Email:</strong> {receipt.customer.email}
                  </p>
                )}
              </div>
            )}

            {/* Line Items */}
            <div style={{ marginBottom: '25px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: '600', color: '#1a1a1a', fontSize: '13px' }}>Item</th>
                    <th style={{ padding: '12px 0', textAlign: 'center', fontWeight: '600', color: '#1a1a1a', fontSize: '13px' }}>Qty</th>
                    <th style={{ padding: '12px 0', textAlign: 'right', fontWeight: '600', color: '#1a1a1a', fontSize: '13px' }}>Unit Price</th>
                    <th style={{ padding: '12px 0', textAlign: 'right', fontWeight: '600', color: '#1a1a1a', fontSize: '13px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 0', color: '#333', fontSize: '14px' }}>
                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>SKU: {item.sku}</div>
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'center', color: '#666', fontSize: '14px', fontWeight: '600' }}>
                        {item.qty}
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: '#666', fontSize: '14px' }}>
                        {formatBWP(item.price)}
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: '#1a1a1a', fontSize: '14px', fontWeight: '600' }}>
                        {formatBWP(item.price * item.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Subtotal:</span>
                <span style={{ color: '#1a1a1a', fontWeight: '500' }}>{formatBWP(receipt.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Tax (12%):</span>
                <span style={{ color: '#1a1a1a', fontWeight: '500' }}>{formatBWP(receipt.tax)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '18px', 
                fontWeight: 'bold',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px'
              }}>
                <span style={{ color: '#1a1a1a' }}>Total:</span>
                <span style={{ color: '#ffc107' }}>{formatBWP(receipt.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#1a1a1a', fontSize: '14px', fontWeight: '600' }}>Payment Details</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Payment Method:</span>
                <span style={{ color: '#1a1a1a', fontWeight: '600' }}>{receipt.paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Amount Paid:</span>
                <span style={{ color: '#1a1a1a', fontWeight: '600' }}>{formatBWP(receipt.amountPaid)}</span>
              </div>
              {receipt.change > 0 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '10px',
                  backgroundColor: '#d4edda',
                  borderRadius: '4px',
                  borderLeft: '4px solid #28a745'
                }}>
                  <span style={{ color: '#155724', fontWeight: '600' }}>Change:</span>
                  <span style={{ color: '#155724', fontWeight: 'bold', fontSize: '16px' }}>
                    {formatBWP(receipt.change)}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ 
              marginTop: '30px', 
              paddingTop: '20px', 
              borderTop: '2px solid #ffc107',
              textAlign: 'center',
              color: '#999',
              fontSize: '12px'
            }}>
              <p style={{ margin: '0 0 5px 0' }}>Thank you for your purchase!</p>
              <p style={{ margin: '0' }}>Please retain this receipt for warranty and returns</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              onClick={handlePrintReceipt}
              style={{
                backgroundColor: '#ffc107',
                color: '#1a1a1a',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-print"></i>
              Print Receipt
            </button>
            <button
              onClick={handleNewSale}
              style={{
                backgroundColor: '#28a745',
                color: '#fff',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-plus"></i>
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
            Complete Sale - Checkout
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '16px' }}>
            Process payment and complete the transaction
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          maxWidth: '1200px',
          margin: '20px auto',
          padding: '15px 20px',
          backgroundColor: '#f8d7da',
          borderRadius: '6px',
          borderLeft: '4px solid #dc3545',
          color: '#721c24',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Order Summary */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '25px'
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
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '3px' }}>
                      {item.name}
                    </div>
                    <div style={{ color: '#666', fontSize: '13px' }}>
                      {formatBWP(item.price)} × {item.qty}
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#ffc107', fontSize: '15px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#666' }}>Tax (12%):</span>
                <span style={{ color: '#1a1a1a', fontWeight: '600' }}>{formatBWP(taxAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
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
            padding: '25px',
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

            {/* Customer Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '8px'
              }}>
                <i className="fas fa-user" style={{ marginRight: '8px', color: '#ffc107' }}></i>
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
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
              >
                <option value="">Walk-in Customer</option>
                {customers.map(cust => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '8px'
              }}>
                <i className="fas fa-money-bill-wave" style={{ marginRight: '8px', color: '#ffc107' }}></i>
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

            {/* Amount Paid (for Cash) */}
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
                    fontSize: '14px',
                    marginBottom: '10px'
                  }}
                />
                {change > 0 && (
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    color: '#155724',
                    fontWeight: '600',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    Change: {formatBWP(change)}
                  </div>
                )}
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              onClick={handleCompleteSale}
              disabled={processing || (selectedPaymentMethod === 'Cash' && (!amountPaid || parseFloat(amountPaid) < grandTotal))}
              style={{
                width: '100%',
                backgroundColor: processing || (selectedPaymentMethod === 'Cash' && (!amountPaid || parseFloat(amountPaid) < grandTotal)) ? '#ccc' : '#28a745',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '6px',
                cursor: processing || (selectedPaymentMethod === 'Cash' && (!amountPaid || parseFloat(amountPaid) < grandTotal)) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {processing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
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
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-arrow-left"></i>
              Back to POS
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
