import React, { useRef, useState, useEffect } from 'react'
import { formatBWP } from '../utils/currency.js'
import html2pdf from 'html2pdf.js'
import axios from 'axios'

export default function QuotationPrint({ items, totalValue, quotationNumber, onClose }) {
  const printRef = useRef()
  const [includeTax, setIncludeTax] = useState(true)
  const [settings, setSettings] = useState(null)
  const quotId = quotationNumber || ('VBQ-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'))
  const quotationDate = new Date().toLocaleString()

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
        quotationTemplate: {
          fontSize: 13,
          fontFamily: 'Arial',
          accentColor: '#ffc107'
        }
      })
    }
  }

  // Calculate totals based on tax inclusion and custom tax rate
  const taxRate = settings?.taxRate || 12
  const subtotal = items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || totalValue || 0
  const tax = includeTax ? (subtotal * (taxRate / 100)) : 0
  const total = subtotal + tax

  function handlePrint() {
    const printWindow = window.open('', '_blank')
    if (printRef.current) {
      const printDoc = printWindow.document
      printDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Quotation - ${quotId}</title>
            <style>
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: #fff;
              }
              .container {
                max-width: 210mm;
                height: 297mm;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 20px;
                margin-bottom: 20px;
              }
              .logo {
                height: 60px;
                margin-bottom: 10px;
              }
              .company-name {
                font-size: 22px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .company-details {
                font-size: 12px;
                color: #555;
                line-height: 1.6;
              }
              .quotation-title {
                font-size: 24px;
                font-weight: bold;
                margin: 20px 0 10px 0;
                color: #1a1a1a;
              }
              .meta-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
              }
              .meta-section {
                font-size: 13px;
              }
              .meta-section strong {
                display: block;
                margin-bottom: 5px;
                color: #333;
              }
              .meta-section div {
                margin-bottom: 3px;
                color: #666;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              thead {
                background: #f3f4f6;
                border-bottom: 2px solid #000;
              }
              th {
                padding: 12px;
                text-align: left;
                font-weight: 600;
                font-size: 13px;
              }
              td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 13px;
              }
              .text-right {
                text-align: right;
              }
              .totals {
                margin-bottom: 30px;
              }
              .total-row {
                display: grid;
                grid-template-columns: 1fr 150px;
                gap: 20px;
                padding: 10px 0;
                font-size: 14px;
              }
              .total-row.final {
                border-top: 2px solid #000;
                border-bottom: 2px solid #000;
                font-weight: bold;
                font-size: 16px;
                padding: 12px 0;
              }
              .footer {
                text-align: center;
                border-top: 2px solid #000;
                padding-top: 15px;
                margin-top: 30px;
                font-size: 11px;
                color: #555;
                line-height: 1.6;
              }
              .terms {
                margin-top: 20px;
                font-size: 12px;
                color: #333;
              }
              .terms strong {
                display: block;
                margin: 10px 0 5px 0;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="/images/logo.png" alt="Company Logo" class="logo" />
                <div class="company-name">VARIATION BUILDERS</div>
                <div class="company-details">
                  Building Excellence Since 2020<br/>
                  Plot 6815, Broadhurst Extension, Gaborone<br/>
                  Phone: +267 397 4000 | Email: info@variationbuilders.co.bw<br/>
                  Tax ID: BW123456789
                </div>
              </div>

              <div class="quotation-title">QUOTATION</div>

              <div class="meta-info">
                <div class="meta-section">
                  <strong>QUOTATION DETAILS</strong>
                  <div><strong style="font-weight: normal;">Quotation #:</strong> ${quotId}</div>
                  <div><strong style="font-weight: normal;">Date:</strong> ${quotationDate}</div>
                  <div><strong style="font-weight: normal;">Validity:</strong> 30 days from date</div>
                </div>
                <div class="meta-section">
                  <strong>FROM</strong>
                  <div>Variation Builders</div>
                  <div>Gaborone, Botswana</div>
                  <div style="margin-top: 8px; font-style: italic;">Professional Supplies & Services</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th style="text-align: center;">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td><strong>${item.name}</strong></td>
                      <td style="text-align: center;">${item.selectedQty}</td>
                      <td class="text-right">P${item.price.toFixed(2)}</td>
                      <td class="text-right"><strong>P${(item.price * item.selectedQty).toFixed(2)}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="totals">
                <div class="total-row">
                  <div style="text-align: right;">Subtotal:</div>
                  <div class="text-right">P${totalValue.toFixed(2)}</div>
                </div>
                <div class="total-row final">
                  <div>TOTAL QUOTATION VALUE:</div>
                  <div>P${totalValue.toFixed(2)}</div>
                </div>
              </div>

              <div class="terms">
                <strong>Terms & Conditions:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This quotation is valid for 30 days from the date above</li>
                  <li>Prices are exclusive of VAT where applicable</li>
                  <li>Payment terms: 50% deposit, balance on completion</li>
                  <li>Delivery: FOB Gaborone</li>
                  <li>All products are subject to availability</li>
                </ul>
              </div>

              <div class="footer">
                <strong style="display: block; margin-bottom: 8px;">Thank you for your interest in Variation Builders</strong>
                For more information or to place an order, please contact us.<br/>
                <strong>Phone:</strong> +267 397 4000 | <strong>Email:</strong> sales@variationbuilders.co.bw<br/>
                <div style="margin-top: 15px; font-size: 10px; color: #999;">
                  Generated on: ${new Date().toLocaleString()}<br/>
                  This is a quotation and not an invoice. Valid with official stamp and signature.
                </div>
              </div>
            </div>
          </body>
        </html>
      `)
      printDoc.close()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  function downloadQuotationPDF() {
    const element = printRef.current
    if (!element) return

    const opt = {
      margin: 10,
      filename: `${quotId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    html2pdf().set(opt).from(element).save()
  }

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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#1a1a1a' }}>
          <i className="fas fa-file-invoice-dollar" style={{ marginRight: '10px', color: '#ffc107' }}></i>
          Quotation Preview
        </h2>

        {/* Tax Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          padding: '12px',
          background: '#f3f4f6',
          borderRadius: '8px',
          borderLeft: `4px solid ${settings?.quotationTemplate?.accentColor || '#ffc107'}`
        }}>
          <input
            type="checkbox"
            id="includeTaxQuote"
            checked={includeTax}
            onChange={(e) => setIncludeTax(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="includeTaxQuote" style={{ cursor: 'pointer', margin: 0, fontWeight: '500' }}>
            Include {taxRate}% Tax on Quotation
          </label>
        </div>

        {/* Quotation Preview */}
        <div
          ref={printRef}
          style={{
            padding: '30px',
            background: '#fff',
            border: '1px solid #e6e6e6',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
        >
          {/* Header with Logo */}
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
            <img src="/images/logo.png" alt="Company Logo" style={{ height: '60px', marginBottom: '10px' }} />
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>
              VARIATION BUILDERS
            </div>
            <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>
              Building Excellence Since 2020
            </div>
            <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
              Plot 6815, Broadhurst Extension, Gaborone<br/>
              Phone: +267 397 4000 | Email: info@variationbuilders.co.bw<br/>
              Tax ID: BW123456789
            </div>
          </div>

          <h1 style={{ textAlign: 'center', fontSize: '24px', marginBottom: '20px', color: '#1a1a1a' }}>
            QUOTATION
          </h1>

          {/* Quotation Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', fontSize: '13px' }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>QUOTATION DETAILS</div>
              <div><strong style={{ fontWeight: 'normal' }}>Quotation #:</strong> {quotId}</div>
              <div><strong style={{ fontWeight: 'normal' }}>Date:</strong> {quotationDate}</div>
              <div><strong style={{ fontWeight: 'normal' }}>Validity:</strong> 30 days from date</div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>FROM</div>
              <div>Variation Builders</div>
              <div>Gaborone, Botswana</div>
              <div style={{ marginTop: '8px', fontStyle: 'italic', color: '#555' }}>
                Professional Supplies & Services
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead style={{ backgroundColor: '#f3f4f6' }}>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Product Name</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>Qty</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '13px' }}>Unit Price</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '13px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{item.name}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{item.selectedQty}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>P{item.price.toFixed(2)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                    P{(item.price * item.selectedQty).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: '20px', paddingBottom: '10px' }}>
              <div style={{ textAlign: 'right' }}>Subtotal:</div>
              <div style={{ textAlign: 'right' }}>P{subtotal.toFixed(2)}</div>
            </div>
            {includeTax && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: '20px', paddingBottom: '10px' }}>
                <div style={{ textAlign: 'right' }}>Tax ({taxRate}%):</div>
                <div style={{ textAlign: 'right' }}>P{tax.toFixed(2)}</div>
              </div>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 150px',
              gap: '20px',
              padding: '12px 0',
              borderTop: '2px solid #000',
              borderBottom: '2px solid #000',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              <div>TOTAL QUOTATION VALUE:</div>
              <div style={{ textAlign: 'right' }}>P{total.toFixed(2)}</div>
            </div>
          </div>

          {/* Terms */}
          <div style={{ fontSize: '12px', marginBottom: '20px' }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>Terms & Conditions:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#555' }}>
              <li>This quotation is valid for 30 days from the date above</li>
              <li>Prices are exclusive of VAT where applicable</li>
              <li>Payment terms: 50% deposit, balance on completion</li>
              <li>Delivery: FOB Gaborone</li>
              <li>All products are subject to availability</li>
            </ul>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', borderTop: '2px solid #000', paddingTop: '15px', marginTop: '20px', fontSize: '11px', color: '#555' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Thank you for your interest in Variation Builders</div>
            <div style={{ lineHeight: '1.5' }}>
              For more information or to place an order, please contact us.<br/>
              <strong>Phone:</strong> +267 397 4000 | <strong>Email:</strong> sales@variationbuilders.co.bw
            </div>
            <div style={{ marginTop: '12px', fontSize: '10px', color: '#999', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
              Generated: {new Date().toLocaleString()}<br/>
              This is a quotation and not an invoice. Valid with official stamp and signature.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
            onMouseOver={(e) => { e.target.style.background = '#dbeafe'; e.target.style.borderColor = '#1d4ed8' }}
            onMouseOut={(e) => { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#3b82f6' }}
          >
            <i className="fas fa-print"></i> Print
          </button>
          <button
            onClick={downloadQuotationPDF}
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
            onMouseOver={(e) => { e.target.style.background = '#fef3c7'; e.target.style.borderColor = '#d97706' }}
            onMouseOut={(e) => { e.target.style.background = '#fffbeb'; e.target.style.borderColor = '#f59e0b' }}
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
            onMouseOver={(e) => { e.target.style.background = '#059669' }}
            onMouseOut={(e) => { e.target.style.background = '#10b981' }}
          >
            <i className="fas fa-check"></i> Done
          </button>
        </div>
      </div>
    </div>
  )
}
