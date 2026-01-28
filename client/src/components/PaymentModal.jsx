import React, { useState } from 'react'
import { formatBWP } from '../utils/currency.js'

export default function PaymentModal({ total, onClose, onComplete, isProcessing }) {
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [amountPaid, setAmountPaid] = useState('')
  const [isCredit, setIsCredit] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedOption, setSelectedOption] = useState('CASH')

  const paymentMethods = {
    CASH: {
      label: 'Cash',
      icon: 'fas fa-money-bill-wave',
      description: 'Pay with cash'
    },
    ORANGE_MONEY: {
      label: 'Orange Money',
      icon: 'fas fa-mobile-alt',
      description: 'Orange Money (Botswana)',
      phone: true
    },
    MY_ZAKA: {
      label: 'My Zaka',
      icon: 'fas fa-wallet',
      description: 'My Zaka Digital Wallet',
      phone: true
    },
    BANK_TRANSFER: {
      label: 'Bank Transfer',
      icon: 'fas fa-university',
      description: 'Direct bank transfer'
    },
    CARD: {
      label: 'Card Payment',
      icon: 'fas fa-credit-card',
      description: 'Debit/Credit Card'
    },
    CHEQUE: {
      label: 'Cheque',
      icon: 'fas fa-check-square',
      description: 'Cheque payment'
    },
    CREDIT: {
      label: 'Buy on Credit',
      icon: 'fas fa-handshake',
      description: 'Company credit account'
    }
  }

  function calculateChange() {
    if (selectedOption !== 'CASH') return 0
    const paid = parseFloat(amountPaid) || 0
    return Math.max(0, paid - total)
  }

  async function handlePayment(e) {
    e.preventDefault()

    // Validation
    if (selectedOption === 'CASH') {
      const paid = parseFloat(amountPaid)
      if (!paid || paid < total) {
        alert('Amount paid must be at least ' + formatBWP(total))
        return
      }
    }

    if (selectedOption === 'CREDIT') {
      if (!customerName.trim()) {
        alert('Customer name is required for credit purchases')
        return
      }
      // In a real system, you'd need approval
      const approved = window.confirm(
        `Credit Purchase:\nCustomer: ${customerName}\nAmount: ${formatBWP(total)}\n\nRequire approval from manager?`
      )
      if (!approved) {
        alert('Credit purchase requires manager approval')
        return
      }
    }

    const paymentData = {
      method: selectedOption,
      amountPaid: selectedOption === 'CASH' ? parseFloat(amountPaid) : total,
      change: calculateChange(),
      customerId: null,
      customerName: selectedOption === 'CREDIT' ? customerName : '',
      customerPhone: selectedOption === 'CREDIT' ? customerPhone : '',
      isCredit: selectedOption === 'CREDIT',
      notes: notes
    }

    onComplete(paymentData)
  }

  const change = calculateChange()

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '800px',
        width: '95%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Payment Method</h2>

        {/* Amount Display */}
        <div style={{
          background: '#f0f9ff',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Amount</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
            {formatBWP(total)}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
            Select Payment Method
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            {Object.entries(paymentMethods).map(([key, method]) => (
              <div
                key={key}
                onClick={() => setSelectedOption(key)}
                style={{
                  padding: '16px 12px',
                  border: selectedOption === key ? '2px solid #3b82f6' : '1px solid #e6e6e6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedOption === key ? '#eff6ff' : '#fff',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  minHeight: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>
              <i className={method.icon} style={{ color: '#3b82f6' }}></i>
            </div>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#1a1a1a' }}>
                  {method.label}
                </div>
                <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.3' }}>
                  {method.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cash Amount Input */}
        {selectedOption === 'CASH' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Amount Paid
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="Enter amount paid"
              step="0.01"
              min={total}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e6e6e6',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            {amountPaid && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                background: '#f0fdf4',
                borderRadius: '6px',
                fontSize: '13px'
              }}>
                <div style={{ marginBottom: '4px' }}>
                  <strong>Amount to Pay:</strong> {formatBWP(total)}
                </div>
                <div style={{ color: '#10b981', fontWeight: '600' }}>
                  <strong>Change:</strong> {formatBWP(change)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Credit Purchase Fields */}
        {selectedOption === 'CREDIT' && (
          <div style={{ marginBottom: '20px', padding: '12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
            <h4 style={{ marginTop: 0, color: '#991b1b' }}>Credit Purchase</h4>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
              Customer Name *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #fecaca',
                fontSize: '14px',
                boxSizing: 'border-box',
                marginBottom: '12px'
              }}
            />
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
              Customer Phone
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter customer phone"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #fecaca',
                fontSize: '14px',
                boxSizing: 'border-box',
                marginBottom: '12px'
              }}
            />
            <div style={{ padding: '8px', background: '#fff', borderRadius: '6px', fontSize: '13px' }}>
              <strong>Credit Amount:</strong> {formatBWP(total)}
            </div>
          </div>
        )}

        {/* Notes Field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any payment notes..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #e6e6e6',
              fontSize: '13px',
              minHeight: '60px',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              border: '1px solid #e6e6e6',
              background: '#fff',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              opacity: isProcessing ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing || (selectedOption === 'CASH' && !amountPaid)}
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#10b981',
              color: '#fff',
              cursor: isProcessing || (selectedOption === 'CASH' && !amountPaid) ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              opacity: isProcessing || (selectedOption === 'CASH' && !amountPaid) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <i className="fas fa-check-circle"></i>
            {isProcessing ? 'Processing...' : 'Complete Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
