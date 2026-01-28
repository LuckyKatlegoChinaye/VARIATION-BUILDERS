import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import axios from 'axios'
import { formatBWP } from '../utils/currency.js'

export default function Admin() {
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

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalShops: 0,
    totalSales: 0,
    todaySales: 0,
    lowStockItems: 0,
    monthSales: 0,
    averageTransaction: 0
  })
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [showClearDb, setShowClearDb] = useState(false)
  const [dbStats, setDbStats] = useState(null)
  const [clearingDb, setClearingDb] = useState(false)
  const [clearConfirmation, setClearConfirmation] = useState('')
  const [selectedDataTypes, setSelectedDataTypes] = useState({
    sales: true,
    quotations: true,
    expenses: true,
    reports: false,
    creditTransactions: false,
    voidReturns: false
  })

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchDashboardData() {
    try {
      setRefreshing(true)
      const token = localStorage.getItem('token')

      // Fetch stats with individual error handling
      let products = []
      let customers = []
      let shops = []
      let sales = []

      try {
        const productsRes = await axios.get('/api/inventory', { headers: { Authorization: `Bearer ${token}` } })
        products = productsRes.data || []
      } catch (err) {
        console.warn('Failed to fetch products:', err)
      }

      try {
        const customersRes = await axios.get('/api/customers', { headers: { Authorization: `Bearer ${token}` } })
        customers = customersRes.data || []
      } catch (err) {
        console.warn('Failed to fetch customers:', err)
      }

      try {
        const shopsRes = await axios.get('/api/shops', { headers: { Authorization: `Bearer ${token}` } })
        shops = shopsRes.data || []
      } catch (err) {
        console.warn('Failed to fetch shops:', err)
      }

      try {
        const salesRes = await axios.get('/api/sales', { headers: { Authorization: `Bearer ${token}` } })
        sales = salesRes.data || []
      } catch (err) {
        console.warn('Failed to fetch sales:', err)
      }

      // Calculate stats
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]

      const todaySalesList = sales.filter(s => s.createdAt?.startsWith(todayStr))
      const monthSalesList = sales.filter(s => s.createdAt >= monthStart)
      
      const todaySales = todaySalesList.reduce((sum, s) => sum + (s.total || 0), 0)
      const monthSales = monthSalesList.reduce((sum, s) => sum + (s.total || 0), 0)
      const averageTransaction = sales.length > 0 ? sales.reduce((sum, s) => sum + (s.total || 0), 0) / sales.length : 0
      const lowStockItems = products.filter(p => p.qty <= 5).length

      setStats({
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalShops: shops.length,
        totalSales: sales.length,
        todaySales,
        monthSales,
        averageTransaction,
        lowStockItems
      })

      // Get recent sales with customer info
      const recent = sales
        .map(s => ({
          ...s,
          customer: customers.find(c => c.id === s.customerId)
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
      setRecentSales(recent)
      setLastRefresh(new Date())
      setLoading(false)

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      // Don't show alert - just set loading to false and use default empty stats
      setLoading(false)
    } finally {
      setRefreshing(false)
    }
  }

  // Fetch database statistics
  async function fetchDbStats() {
    try {
      const token = localStorage.getItem('token')
      console.log('Fetching DB stats with token:', token ? 'present' : 'missing')
      const res = await axios.get('/api/admin/database-stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('DB stats received:', res.data)
      setDbStats(res.data)
    } catch (err) {
      console.error('Failed to fetch DB stats:', err.response?.status, err.response?.data || err.message)
      alert('Failed to fetch database statistics: ' + (err.response?.data?.error || err.message))
    }
  }

  // Clear database
  async function handleClearDatabase() {
    if (clearConfirmation !== 'CLEAR_ALL_DATA') {
      alert('Invalid confirmation code. Please type CLEAR_ALL_DATA exactly.')
      return
    }

    const selected = Object.keys(selectedDataTypes).filter(key => selectedDataTypes[key])
    if (selected.length === 0) {
      alert('Please select at least one data type to clear.')
      return
    }

    const clearMessage = `⚠️ WARNING: This will delete:\n${selected.map(t => `• ${t}`).join('\n')}\n\nInventory, products, shops, and users will be preserved.\n\nAre you absolutely sure?`
    if (!window.confirm(clearMessage)) {
      return
    }

    setClearingDb(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/admin/clear-database', 
        { 
          confirmation: 'CLEAR_ALL_DATA',
          dataTypes: selected
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (res.data.success) {
        const deletedList = Object.entries(res.data.deleted).map(([key, count]) => `${key}: ${count}`).join('\n')
        alert(`✅ Database cleared successfully!\n\nDeleted:\n${deletedList}\n\nPreserved:\n- Inventory\n- Products\n- Shops\n- Users`)
        setShowClearDb(false)
        setClearConfirmation('')
        setDbStats(null)
        setSelectedDataTypes({
          sales: true,
          quotations: true,
          expenses: true,
          reports: false,
          creditTransactions: false,
          voidReturns: false
        })
        // Force refresh the page to see cleared data
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (err) {
      console.error('Clear database error:', err)
      alert('❌ Failed to clear database: ' + (err.response?.data?.error || err.message))
    } finally {
      setClearingDb(false)
    }
  }

  const quickActions = [
    {
      title: 'Point of Sale',
      description: 'Process customer transactions',
      icon: 'fas fa-cash-register',
      color: '#28a745',
      action: () => navigate('/shop'),
      primary: true
    },
    {
      title: 'Inventory Management',
      description: 'Manage products and stock',
      icon: 'fas fa-boxes',
      color: '#007bff',
      action: () => navigate('/inventory')
    },
    {
      title: 'Customer Management',
      description: 'View and manage customers',
      icon: 'fas fa-users',
      color: '#6f42c1',
      action: () => navigate('/customers')
    },
    {
      title: 'Shop Management',
      description: 'Manage multiple locations',
      icon: 'fas fa-store',
      color: '#fd7e14',
      action: () => navigate('/shops')
    },
    {
      title: 'Financial Reports',
      description: 'View sales and profit reports',
      icon: 'fas fa-chart-line',
      color: '#20c997',
      action: () => navigate('/reports')
    },
    {
      title: 'Employee Management',
      description: 'Manage staff and payroll',
      icon: 'fas fa-user-tie',
      color: '#e83e8c',
      action: () => navigate('/employees')
    }
  ]

  const secondaryActions = [
    {
      title: 'Banking',
      description: 'Manage accounts and transactions',
      icon: 'fas fa-university',
      action: () => navigate('/banking')
    },
    {
      title: 'Expenses',
      description: 'Track business expenses',
      icon: 'fas fa-receipt',
      action: () => navigate('/expenses')
    },
    {
      title: 'Payroll',
      description: 'Process employee salaries',
      icon: 'fas fa-money-check',
      action: () => navigate('/payroll')
    },
    {
      title: 'Quotes',
      description: 'Manage quotations',
      icon: 'fas fa-file-invoice',
      action: () => navigate('/quotes')
    }
  ]

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: '#ffc107', marginBottom: '20px' }}></i>
          <p style={{ color: '#666', fontSize: '18px' }}>Loading dashboard...</p>
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
        padding: '20px 0',
        borderBottom: '3px solid #ffc107'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                marginBottom: '5px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <i className="fas fa-tachometer-alt" style={{ marginRight: '15px' }}></i>
                Admin Dashboard
              </h1>
              <p style={{
                color: '#ccc',
                fontSize: '14px',
                margin: 0,
                fontWeight: '300'
              }}>
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              style={{
                backgroundColor: refreshing ? '#999' : '#ffc107',
                color: '#1a1a1a',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className={`fas fa-sync ${refreshing ? 'fa-spin' : ''}`}></i>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Stats Cards */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            color: '#1a1a1a',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            borderBottom: '2px solid #ffc107',
            paddingBottom: '10px'
          }}>
            <i className="fas fa-chart-bar" style={{ marginRight: '10px' }}></i>
            Business Overview
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #28a745'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <i className="fas fa-boxes" style={{ fontSize: '24px', color: '#28a745', marginRight: '15px' }}></i>
                <div>
                  <h3 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' }}>
                    {stats.totalProducts}
                  </h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Total Products</p>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #007bff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <i className="fas fa-users" style={{ fontSize: '24px', color: '#007bff', marginRight: '15px' }}></i>
                <div>
                  <h3 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' }}>
                    {stats.totalCustomers}
                  </h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Total Customers</p>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #ffc107'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <i className="fas fa-store" style={{ fontSize: '24px', color: '#ffc107', marginRight: '15px' }}></i>
                <div>
                  <h3 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' }}>
                    {stats.totalShops}
                  </h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Total Shops</p>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #dc3545'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <i className="fas fa-file-invoice-dollar" style={{ fontSize: '24px', color: '#dc3545', marginRight: '15px' }}></i>
                <div>
                  <h3 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' }}>
                    {formatBWP(stats.todaySales)}
                  </h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Today's Sales</p>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #20c997'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <i className="fas fa-calendar-alt" style={{ fontSize: '24px', color: '#20c997', marginRight: '15px' }}></i>
                <div>
                  <h3 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' }}>
                    {formatBWP(stats.monthSales)}
                  </h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Month's Sales</p>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #6f42c1'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <i className="fas fa-handshake" style={{ fontSize: '24px', color: '#6f42c1', marginRight: '15px' }}></i>
                <div>
                  <h3 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' }}>
                    {formatBWP(stats.averageTransaction)}
                  </h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Avg Transaction</p>
                </div>
              </div>
            </div>
          </div>

          {stats.lowStockItems > 0 && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '15px',
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#856404', marginRight: '15px', fontSize: '20px' }}></i>
              <div>
                <strong style={{ color: '#856404' }}>Low Stock Alert:</strong>
                <span style={{ color: '#856404', marginLeft: '5px' }}>
                  {stats.lowStockItems} item{stats.lowStockItems > 1 ? 's' : ''} with low stock levels
                </span>
                <button
                  onClick={() => navigate('/inventory')}
                  style={{
                    backgroundColor: '#ffc107',
                    color: '#1a1a1a',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginLeft: '10px'
                  }}
                >
                  View Inventory
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            color: '#1a1a1a',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            borderBottom: '2px solid #ffc107',
            paddingBottom: '10px'
          }}>
            <i className="fas fa-bolt" style={{ marginRight: '10px' }}></i>
            Quick Actions
          </h2>

          {/* Primary Actions - Horizontal */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'center' }}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                style={{
                  backgroundColor: action.primary ? '#ffc107' : '#fff',
                  color: action.primary ? '#1a1a1a' : '#1a1a1a',
                  border: action.primary ? 'none' : '2px solid #e0e0e0',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  boxShadow: action.primary ? '0 4px 15px rgba(255, 193, 7, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  if (action.primary) {
                    e.target.style.backgroundColor = '#e6a800'
                  } else {
                    e.target.style.borderColor = action.color
                    e.target.style.boxShadow = `0 4px 15px rgba(0,0,0,0.2)`
                  }
                }}
                onMouseOut={(e) => {
                  if (action.primary) {
                    e.target.style.backgroundColor = '#ffc107'
                  } else {
                    e.target.style.borderColor = '#e0e0e0'
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <i className={action.icon} style={{
                  fontSize: '18px',
                  color: action.primary ? '#1a1a1a' : action.color
                }}></i>
                <span>{action.title}</span>
              </button>
            ))}
          </div>

          {/* Secondary Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            {secondaryActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                style={{
                  backgroundColor: '#fff',
                  color: '#1a1a1a',
                  border: '2px solid #e0e0e0',
                  padding: '15px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.borderColor = '#ffc107'
                  e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                }}
                onMouseOut={(e) => {
                  e.target.style.borderColor = '#e0e0e0'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <i className={action.icon} style={{ fontSize: '20px', marginRight: '15px', color: '#666' }}></i>
                <div>
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>{action.title}</div>
                  <div style={{ fontSize: '12px', fontWeight: '400', color: '#666' }}>{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Clear Database Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            color: '#1a1a1a',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            borderBottom: '2px solid #dc3545',
            paddingBottom: '10px'
          }}>
            <i className="fas fa-database" style={{ marginRight: '10px', color: '#dc3545' }}></i>
            Database Management
          </h2>

          <div style={{
            backgroundColor: '#fff5f5',
            border: '2px solid #f08080',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#dc3545', fontSize: '18px', fontWeight: '600' }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                  Clear Transactional Data
                </h3>
                <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                  Remove all sales, quotations, and expenses from database. Inventory, products, shops, and users will be preserved.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowClearDb(!showClearDb)
                  if (!showClearDb) {
                    fetchDbStats()
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: showClearDb ? '#dc3545' : '#f08080',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {showClearDb ? 'Cancel' : 'Configure'}
              </button>
            </div>

            {showClearDb && (
              <div style={{
                borderTop: '1px solid #f08080',
                paddingTop: '15px',
                marginTop: '15px',
                backgroundColor: '#fff',
                padding: '15px',
                borderRadius: '6px'
              }}>
                {dbStats ? (
                  <>
                    <h4 style={{ margin: '0 0 15px 0', color: '#1a1a1a' }}>Select data to delete:</h4>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #dee2e6' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        {[
                          { key: 'sales', label: 'Sales Records', count: dbStats.sales || 0 },
                          { key: 'quotations', label: 'Quotations', count: dbStats.quotations || 0 },
                          { key: 'expenses', label: 'Expenses', count: dbStats.expenses || 0 },
                          { key: 'reports', label: 'Reports', count: '—' },
                          { key: 'creditTransactions', label: 'Credit Transactions', count: '—' },
                          { key: 'voidReturns', label: 'Void/Return Records', count: '—' }
                        ].map(item => (
                          <label key={item.key} style={{ display: 'flex', alignItems: 'center', padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid #e6e6e6', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedDataTypes[item.key]}
                              onChange={(e) => setSelectedDataTypes({ ...selectedDataTypes, [item.key]: e.target.checked })}
                              style={{ marginRight: '10px', cursor: 'pointer', width: '18px', height: '18px' }}
                            />
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a1a' }}>{item.label}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>Records: {item.count}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <h4 style={{ margin: '0 0 15px 0', color: '#1a1a1a' }}>Data to be preserved:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                      <div style={{ background: '#d4edda', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>{dbStats.inventory || 0}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Inventory Items</div>
                      </div>
                      <div style={{ background: '#d4edda', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>{dbStats.products || 0}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Products</div>
                      </div>
                      <div style={{ background: '#d4edda', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>{dbStats.shops || 0}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Shops</div>
                      </div>
                      <div style={{ background: '#d4edda', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>{dbStats.users || 0}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Users</div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #dee2e6' }}>
                      <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#1a1a1a' }}>
                        Type CLEAR_ALL_DATA to confirm:
                      </label>
                      <input
                        type="text"
                        value={clearConfirmation}
                        onChange={(e) => setClearConfirmation(e.target.value)}
                        placeholder="Enter confirmation code"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'monospace',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <button
                      onClick={handleClearDatabase}
                      disabled={clearingDb || clearConfirmation !== 'CLEAR_ALL_DATA'}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: clearingDb || clearConfirmation !== 'CLEAR_ALL_DATA' ? '#ccc' : '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: clearingDb || clearConfirmation !== 'CLEAR_ALL_DATA' ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                    >
                      {clearingDb ? 'Clearing Database...' : 'Permanently Clear Database'}
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    Loading database statistics...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            color: '#1a1a1a',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            borderBottom: '2px solid #ffc107',
            paddingBottom: '10px'
          }}>
            <i className="fas fa-history" style={{ marginRight: '10px' }}></i>
            Recent Sales
          </h2>

          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {recentSales.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <i className="fas fa-receipt" style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}></i>
                <p>No recent sales found</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#1a1a1a' }}>Sale #</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#1a1a1a' }}>Customer</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#1a1a1a' }}>Amount</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#1a1a1a' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(sale => (
                    <tr key={sale.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px', color: '#333' }}>{sale.id}</td>
                      <td style={{ padding: '15px', color: '#333' }}>{sale.customer?.name || sale.customerName || 'Unknown'}</td>
                      <td style={{ padding: '15px', color: '#333' }}>{formatBWP(sale.total || 0)}</td>
                      <td style={{ padding: '15px', color: '#333' }}>{new Date(sale.createdAt).toLocaleDateString()}</td>
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
