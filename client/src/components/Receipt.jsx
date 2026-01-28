import React, { useRef, useState, useEffect } from 'react'
import { formatBWP } from '../utils/currency.js'
import html2pdf from 'html2pdf.js'
import axios from 'axios'

export default function Receipt({ sale, onClose }) {
  const printRef = useRef()
  const [includeTax, setIncludeTax] = useState(true)
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setSettings(response.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
      // Use defaults if failed
      setSettings({
        taxRate: 12,
        invoiceTemplate: {
          fontSize: 13,
          fontFamily: 'Courier New',
          accentColor: '#3b82f6'
        }
      })
    }
  }

  // Calculate totals based on tax inclusion and custom tax rate
  const taxRate = settings?.taxRate || 12
  const subtotal = sale.items?.reduce((sum, item) => sum + (item.qty * item.price), 0) || 0
  const tax = includeTax ? (subtotal * (taxRate / 100)) : 0
  const total = subtotal + tax

  function handlePrint() {
    const printWindow = window.open('', '_blank')
    const element = printRef.current
    if (element) {
      const html = element.innerHTML
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Invoice ${sale.invoiceNumber || sale.id}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                margin: 0;
                padding: 20px;
                background: #fff;
              }
              @media print {
                @page {
                  size: A4;
                  margin: 10mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
              }
              .receipt-container {
                max-width: 210mm;
                height: 297mm;
                margin: 0 auto;
                padding: 20px;
                background: #fff;
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              ${html}
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  function downloadReceiptPDF() {
    const element = printRef.current
    if (!element) return

    const opt = {
      margin: 10,
      filename: `${sale.invoiceNumber || sale.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    html2pdf().set(opt).from(element).save()
  }

  const receiptDate = new Date(sale.createdAt).toLocaleString()

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
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Receipt Preview</h2>

        {/* Tax Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          padding: '12px',
          background: '#f3f4f6',
          borderRadius: '8px',
          borderLeft: `4px solid ${settings?.invoiceTemplate?.accentColor || '#3b82f6'}`
        }}>
          <input
            type="checkbox"
            id="includeTax"
            checked={includeTax}
            onChange={(e) => setIncludeTax(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="includeTax" style={{ cursor: 'pointer', margin: 0, fontWeight: '500' }}>
            Include {taxRate}% Tax on Invoice
          </label>
        </div>

        {/* Receipt Preview */}
        <div
          ref={printRef}
          style={{
            padding: '20px',
            background: '#fff',
            border: '1px solid #e6e6e6',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'monospace',
            lineHeight: '1.6',
            marginBottom: '20px',
            maxWidth: '500px'
          }}
        >
          {/* Company Header with Logo */}
          <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
            <img src="/images/logo.png" alt="Company Logo" style={{ height: '60px', marginBottom: '8px' }} />
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '2px' }}>
              VARIATION BUILDERS
            </div>
            <div style={{ fontSize: '12px', color: '#333', marginBottom: '4px' }}>
              Building Excellence Since 2020
            </div>
            <div style={{ fontSize: '11px', color: '#555' }}>
              Plot 6815, Broadhurst Extension, Gaborone
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>
              Phone: +267 397 4000 | Email: info@variationbuilders.co.bw
            </div>
            <div style={{ fontSize: '11px' }}>
              Sales Receipt | Tax ID: BW123456789
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div><strong>Invoice #:</strong> {sale.invoiceNumber || sale.id}</div>
            <div><strong>Date & Time:</strong> {receiptDate}</div>
            <div><strong>Cashier:</strong> {sale.cashierName || 'POS System'}</div>
            <div><strong>Customer:</strong> {sale.customerName || 'Walk-in Customer'}</div>
            {sale.customerPhone && <div><strong>Phone:</strong> {sale.customerPhone}</div>}
            <div style={{ borderBottom: '1px solid #000', paddingBottom: '8px', marginTop: '8px' }}>
              <strong>Payment Method:</strong> {sale.paymentMethod}
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '4px', marginBottom: '8px', fontWeight: 'bold' }}>
              <div>Item</div>
              <div style={{ textAlign: 'right' }}>Qty</div>
              <div style={{ textAlign: 'right' }}>Price</div>
              <div style={{ textAlign: 'right' }}>Total</div>
            </div>
            <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', paddingTop: '4px', paddingBottom: '8px', marginBottom: '8px' }}>
              {sale.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '4px', fontSize: '12px', marginBottom: '4px' }}>
                  <div>{item.name}</div>
                  <div style={{ textAlign: 'right' }}>{item.qty}</div>
                  <div style={{ textAlign: 'right' }}>P{item.price?.toFixed(2) || '0.00'}</div>
                  <div style={{ textAlign: 'right' }}>P{(item.qty * item.price)?.toFixed(2) || '0.00'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
              <div>Subtotal:</div>
              <div style={{ textAlign: 'right' }}>P{subtotal.toFixed(2)}</div>
            </div>
            {includeTax && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>Tax ({taxRate}%):</div>
                <div style={{ textAlign: 'right' }}>P{tax.toFixed(2)}</div>
              </div>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              borderTop: '1px solid #000',
              paddingTop: '8px',
              marginBottom: '12px'
            }}>
              <div>TOTAL:</div>
              <div style={{ textAlign: 'right' }}>P{total.toFixed(2)}</div>
            </div>
          </div>

          {/* Payment Info */}
          <div style={{ marginBottom: '12px', fontSize: '12px' }}>
            <div>Amount Paid: P{sale.amountPaid?.toFixed(2) || '0.00'}</div>
            {sale.change !== undefined && sale.change > 0 && (
              <div>Change: P{sale.change?.toFixed(2)}</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '12px', borderTop: '2px solid #000', paddingTop: '8px', fontSize: '11px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Thank You for Your Purchase!</div>
            <div style={{ marginBottom: '4px' }}>We appreciate your business</div>
            <div style={{ fontSize: '10px', color: '#555', marginTop: '8px', lineHeight: '1.4' }}>
              Variation Builders - Your Trusted Partner<br/>
              Quality Products | Excellent Service | Competitive Prices
            </div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '8px', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
              Printed: {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px'
        }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              border: '1px solid #3b82f6',
              background: '#eff6ff',
              color: '#3b82f6',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="fas fa-print"></i> Print
          </button>
          <button
            onClick={downloadReceiptPDF}
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              border: '1px solid #f59e0b',
              background: '#fffbeb',
              color: '#f59e0b',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="fas fa-file-pdf"></i> PDF
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#10b981',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="fas fa-check"></i> Done
          </button>
        </div>
      </div>
    </div>
  )
}
