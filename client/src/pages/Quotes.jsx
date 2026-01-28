import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { formatBWP } from '../utils/currency.js'
import QuotationPrint from '../components/QuotationPrint.jsx'
import Receipt from '../components/Receipt.jsx'

export default function Quotes() {
  const [quotes, setQuotes] = useState([])
  const [invoices, setInvoices] = useState([])
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showPrintQuote, setShowPrintQuote] = useState(false)
  const [showPrintInvoice, setShowPrintInvoice] = useState(false)
  const [showEditQuote, setShowEditQuote] = useState(false)
  const [editQuoteData, setEditQuoteData] = useState(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchQuotes()
    fetchInvoices()
  }, [])

  async function fetchQuotes() {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.get('/api/quotes', { headers })
      setQuotes(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchInvoices() {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.get('/api/invoices', { headers })
      setInvoices(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function convertQuoteToInvoice(quoteId) {
    try {
      const token = localStorage.getItem('token')
      const _res = await axios.post(`/api/quotes/${quoteId}/convert`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Invoice created!')
      fetchQuotes()
      fetchInvoices()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to convert')
    }
  }

  async function deleteQuote(quoteId) {
    if (!window.confirm('Delete this quotation? This cannot be undone.')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/quotes/${quoteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Quotation deleted!')
      fetchQuotes()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete')
    }
  }

  async function deleteInvoice(invoiceId) {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Invoice deleted!')
      fetchInvoices()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete')
    }
  }

  function openEditQuote(quote) {
    setEditQuoteData({ ...quote })
    setShowEditQuote(true)
  }

  async function saveEditQuote() {
    if (!editQuoteData.items || editQuoteData.items.length === 0) {
      alert('Quote must have at least one item')
      return
    }
    try {
      const token = localStorage.getItem('token')
      await axios.put(`/api/quotes/${editQuoteData.id}`, {
        items: editQuoteData.items,
        notes: editQuoteData.notes,
        includeTax: editQuoteData.includeTax
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Quotation updated!')
      setShowEditQuote(false)
      setEditQuoteData(null)
      fetchQuotes()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update')
    }
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '30px' }}>
        <h2>Quotations & Invoices</h2>
        <p className="text-muted">Manage your quotations and generate invoices</p>
      </div>

      {/* Print Quote Modal */}
      {showPrintQuote && selectedQuote && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            maxHeight: '90vh',
            overflow: 'auto',
            width: '90%',
            maxWidth: '900px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Print Quotation</h3>
              <button onClick={() => setShowPrintQuote(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
              }}>×</button>
            </div>
            <QuotationPrint quotation={selectedQuote} />
          </div>
        </div>
      )}

      {/* Print Invoice Modal */}
      {showPrintInvoice && selectedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            maxHeight: '90vh',
            overflow: 'auto',
            width: '90%',
            maxWidth: '900px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Print Invoice</h3>
              <button onClick={() => setShowPrintInvoice(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
              }}>×</button>
            </div>
            <Receipt invoice={selectedInvoice} />
          </div>
        </div>
      )}

      {/* Edit Quote Modal */}
      {showEditQuote && editQuoteData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            maxHeight: '90vh',
            overflow: 'auto',
            width: '90%',
            maxWidth: '700px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Edit Quotation</h3>
              <button onClick={() => setShowEditQuote(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
              }}>×</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Notes</label>
              <textarea
                value={editQuoteData.notes || ''}
                onChange={(e) => setEditQuoteData({ ...editQuoteData, notes: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '80px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editQuoteData.includeTax || false}
                  onChange={(e) => setEditQuoteData({ ...editQuoteData, includeTax: e.target.checked })}
                />
                Include Tax
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4>Items</h4>
              {editQuoteData.items && editQuoteData.items.length > 0 ? (
                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Item</th>
                      <th style={{ textAlign: 'center', padding: '8px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Price</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editQuoteData.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px' }}>{item.name}</td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>
                          <input
                            type="number"
                            value={item.qty || 1}
                            onChange={(e) => {
                              const newItems = [...editQuoteData.items]
                              newItems[idx].qty = parseInt(e.target.value) || 1
                              setEditQuoteData({ ...editQuoteData, items: newItems })
                            }}
                            style={{ width: '50px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{formatBWP(item.price)}</td>
                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: '600' }}>
                          {formatBWP(item.price * (item.qty || 1))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#999' }}>No items</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditQuote(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEditQuote}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#28a745',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* Quotations */}
        <div className="col-lg-6 col-md-12 col-12">
          <div className="card">
            <h3>Quotations</h3>
            {quotes.length === 0 ? (
              <p className="text-muted">No quotations yet. <a href="/inventory">Create one</a></p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(q => (
                    <tr key={q.id}>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>{q.id.slice(0, 8)}...</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatBWP(q.total)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          background: q.status === 'converted' ? '#dcfce7' : '#dbeafe',
                          color: q.status === 'converted' ? '#166534' : '#1e40af',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {q.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setSelectedQuote(q)
                              setShowPrintQuote(true)
                            }}
                            title="Print"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              background: '#007bff',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fas fa-print"></i> Print
                          </button>
                          {q.status !== 'converted' && (
                            <>
                              <button
                                onClick={() => openEditQuote(q)}
                                title="Edit"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  background: '#ffc107',
                                  color: '#000',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button
                                onClick={() => deleteQuote(q.id)}
                                title="Delete"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  background: '#dc3545',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => convertQuoteToInvoice(q.id)}
                                className="btn btn-small"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  background: '#28a745',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <i className="fas fa-arrow-right"></i> Convert
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="col-lg-6 col-md-12 col-12">
          <div className="card">
            <h3>Invoices</h3>
            {invoices.length === 0 ? (
              <p className="text-muted">No invoices yet. Convert a quotation to create one.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>{inv.id.slice(0, 8)}...</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatBWP(inv.total)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          background: inv.status === 'unpaid' ? '#fee2e2' : '#dcfce7',
                          color: inv.status === 'unpaid' ? '#9f1239' : '#166534',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv)
                              setShowPrintInvoice(true)
                            }}
                            title="Print"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              background: '#007bff',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fas fa-print"></i> Print
                          </button>
                          <button
                            onClick={() => deleteInvoice(inv.id)}
                            title="Delete"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              background: '#dc3545',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
