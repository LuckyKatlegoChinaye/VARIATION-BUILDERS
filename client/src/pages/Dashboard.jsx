import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { formatBWP } from '../utils/currency.js'

export default function Dashboard() {
  const [stats, setStats] = useState({ quoteCount: 0, invoiceCount: 0, totalValue: 0 })
  
  // Get user role immediately from token (not in useEffect)
  let userRole = 'customer'
  const token = localStorage.getItem('token')
  if (token) {
    try {
      // JWT format: header.payload.signature - decode the payload (middle part)
      const decoded = JSON.parse(atob(token.split('.')[1]))
      userRole = decoded.role || 'customer'
    } catch (_err) {
      console.error('Failed to decode token')
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const [quotesRes, invoicesRes] = await Promise.all([
        axios.get('/api/quotes', { headers }),
        axios.get('/api/invoices', { headers })
      ])
      const quotes = quotesRes.data || []
      const invoices = invoicesRes.data || []
      const totalValue = quotes.reduce((sum, q) => sum + (q.total || 0), 0)
      setStats({
        quoteCount: quotes.length,
        invoiceCount: invoices.length,
        totalValue: totalValue
      })
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    }
  }

  // Check if user is admin or cashier
  const isAdminOrCashier = userRole === 'admin' || userRole === 'cashier'

  return (
    <div className="container">
      {/* Admin/Cashier Dashboard */}
      {isAdminOrCashier && (
        <>
          <div style={{ marginBottom: '30px' }}>
            <div className="card" style={{
              background: '#ffc107',
              border: '2px solid #ffc107',
              textAlign: 'center',
              padding: '30px'
            }}>
              <h2 style={{ color: '#1a1a1a', marginBottom: '20px', fontSize: '28px' }}>
                Business Management Suite
              </h2>
              <p style={{ color: '#1a1a1a', marginBottom: '0', fontSize: '16px' }}>
                Access all your business tools: Invoicing, Customers, Employees, Payroll, Expenses, Reports & more
              </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link
                to="/business-management"
                className="btn"
                style={{
                  background: '#1a1a1a',
                  color: '#ffc107',
                  fontWeight: '700',
                  fontSize: '18px',
                  padding: '15px 30px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                }}
              >
                Open Business Suite
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="row">
            <div className="col-lg-4 col-md-6 col-12">
              <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #ffc107 0%, #1a1a1a 100%)', color: '#fff' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>{stats.quoteCount}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Quotations</div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-12">
              <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #ffc107 100%)', color: '#ffc107' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>{stats.invoiceCount}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Invoices</div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-12">
              <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #ffc107 0%, #1a1a1a 100%)', color: '#fff' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>{formatBWP(stats.totalValue)}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Value</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginTop: '30px' }}>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: '0', marginBottom: '15px' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start' }}>
                {userRole === 'admin' && (
                  <Link to="/admin" style={{ textDecoration: 'none', background: '#dc3545', color: '#fff', fontWeight: '700', fontSize: '14px', padding: '10px 15px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}><i className="fas fa-shield-alt" style={{ fontSize: '16px' }}></i> ADMIN PANEL</Link>
                )}
                <Link to="/shop" style={{ textDecoration: 'none', background: '#ffc107', color: '#1a1a1a', fontWeight: '600', padding: '10px 15px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}><i className="fas fa-shopping-cart" style={{ fontSize: '16px' }}></i> Make a Sale (POS)</Link>
                <Link to="/inventory" style={{ textDecoration: 'none', background: '#1a1a1a', color: '#ffc107', fontWeight: '600', padding: '10px 15px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}><i className="fas fa-boxes" style={{ fontSize: '16px' }}></i> Manage Inventory</Link>
                <Link to="/quotes" style={{ textDecoration: 'none', background: '#28a745', color: '#fff', fontWeight: '600', padding: '10px 15px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}><i className="fas fa-file-invoice" style={{ fontSize: '16px' }}></i> View All Quotations</Link>
                <Link to="/business-management" style={{ textDecoration: 'none', background: '#17a2b8', color: '#fff', fontWeight: '600', padding: '10px 15px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}><i className="fas fa-briefcase" style={{ fontSize: '16px' }}></i> Business Suite</Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Customer Dashboard */}
      {!isAdminOrCashier && (
        <>
          <div style={{ marginBottom: '35px' }}>
            <div className="card" style={{
              background: 'linear-gradient(135deg, #ffc107 0%, #1a1a1a 100%)',
              border: 'none',
              textAlign: 'center',
              padding: '35px 40px',
              color: '#fff',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(255, 193, 7, 0.2)'
            }}>
              <h1 style={{ marginBottom: '12px', fontSize: '32px', fontWeight: '700' }}>
                Welcome to Quotation Builder
              </h1>
              <p style={{ marginBottom: '0', fontSize: '15px', opacity: 0.95, lineHeight: '1.6' }}>
                Create professional quotations from our inventory. Build your quote and convert it to a formal request for your business.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="row" style={{ marginBottom: '35px' }}>
            <div className="col-lg-6 col-md-12 col-12">
              <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #ffc107 0%, #1a1a1a 100%)', color: '#fff', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)', padding: '28px 20px' }}>
                <div style={{ fontSize: '44px', fontWeight: 'bold', marginBottom: '8px' }}>{stats.quoteCount}</div>
                <div style={{ fontSize: '15px', opacity: 0.9, fontWeight: '500' }}>Your Quotations</div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-12">
              <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #ffc107 100%)', color: '#ffc107', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)', padding: '28px 20px' }}>
                <div style={{ fontSize: '44px', fontWeight: 'bold', marginBottom: '8px' }}>{formatBWP(stats.totalValue)}</div>
                <div style={{ fontSize: '15px', opacity: 0.9, fontWeight: '500' }}>Total Value</div>
              </div>
            </div>
          </div>

          {/* Main Actions - Horizontal Layout */}
          <div style={{ marginBottom: '35px' }}>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>What would you like to do?</h2>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: '0' }}>Choose an option below to get started with your quotation</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {/* Card 1: Browse Products */}
              <Link to="/quotation-builder" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff',
                  border: '2px solid #ffc107',
                  borderRadius: '10px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  height: '100%',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 193, 7, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <i style={{ fontSize: '24px', flexShrink: 0, color: '#ffc107', minWidth: '30px' }} className="fas fa-shopping-bag"></i>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px', margin: '0' }}>
                      Browse Products & Create Quotation
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.5', margin: '0' }}>
                      Explore our full product catalog and start building your quotation by adding items to your cart
                    </p>
                  </div>
                </div>
              </Link>

              {/* Card 2: View Quotations */}
              <Link to="/quotes" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff',
                  border: '2px solid #1a1a1a',
                  borderRadius: '10px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  height: '100%',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(26, 26, 26, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <i style={{ fontSize: '24px', flexShrink: 0, color: '#1a1a1a', minWidth: '30px' }} className="fas fa-file-alt"></i>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px', margin: '0' }}>
                      View My Quotations
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.5', margin: '0' }}>
                      Track all your submitted quotations and their status. Convert quotations to formal requests
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Information Section - Compact Design */}
          <div className="card" style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <i style={{ fontSize: '24px', color: '#1a1a1a', minWidth: '28px' }} className="fas fa-info-circle"></i>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', marginBottom: '3px', margin: '0' }}>
                  About Our Quotation System
                </h2>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '0' }}>
                  A quotation is a formal document that lists the products you wish to purchase from us, along with their prices and quantities. It's perfect for business inquiries and bulk orders.
                </p>
              </div>
            </div>

            {/* Process Steps - Horizontal Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <i style={{ fontSize: '20px', marginBottom: '6px', color: '#1a1a1a', display: 'block' }} className="fas fa-box"></i>
                <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '13px', marginBottom: '3px' }}>Browse Catalog</div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>Explore our full product inventory</div>
              </div>
              <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <i style={{ fontSize: '20px', marginBottom: '6px', color: '#1a1a1a', display: 'block' }} className="fas fa-shopping-cart"></i>
                <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '13px', marginBottom: '3px' }}>Add to Cart</div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>Select items you want to purchase</div>
              </div>
              <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <i style={{ fontSize: '20px', marginBottom: '6px', color: '#28a745', display: 'block' }} className="fas fa-check-circle"></i>
                <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '13px', marginBottom: '3px' }}>Generate Quotation</div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>Create a formal quotation from your cart</div>
              </div>
              <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <i style={{ fontSize: '20px', marginBottom: '6px', color: '#1a1a1a', display: 'block' }} className="fas fa-paper-plane"></i>
                <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '13px', marginBottom: '3px' }}>Submit Request</div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>Send to our team for review</div>
              </div>
              <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <i style={{ fontSize: '20px', marginBottom: '6px', color: '#1a1a1a', display: 'block' }} className="fas fa-chart-line"></i>
                <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '13px', marginBottom: '3px' }}>Track Status</div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>Monitor all your past quotations</div>
              </div>
              <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <i style={{ fontSize: '20px', marginBottom: '6px', color: '#1a1a1a', display: 'block' }} className="fas fa-comments"></i>
                <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '13px', marginBottom: '3px' }}>Get Feedback</div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>Receive pricing and availability info</div>
              </div>
            </div>

            {/* Support Message */}
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <i style={{ fontSize: '20px', flexShrink: 0, color: '#78350f', minWidth: '24px' }} className="fas fa-handshake"></i>
              <div>
                <div style={{ fontWeight: '600', color: '#78350f', marginBottom: '4px', fontSize: '14px' }}>Need Help?</div>
                <p style={{ fontSize: '13px', color: '#92400e', marginBottom: '0', lineHeight: '1.5' }}>
                  Our team will review your quotation and get back to you shortly with detailed pricing and availability information. We're here to support your business needs!
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
