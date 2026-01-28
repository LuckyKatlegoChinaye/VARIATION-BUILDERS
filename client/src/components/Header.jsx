import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Header({ user }) {
  const navigate = useNavigate()
  const [cartCount, setCartCount] = useState(0)
  const [showBusinessMenu, setShowBusinessMenu] = useState(false)

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem('vb_cart')
        const cart = raw ? JSON.parse(raw) : []
        const count = cart.reduce((s, c) => s + (c.qty || 1), 0)
        setCartCount(count)
      } catch (_err) {
        setCartCount(0)
      }
    }
    load()
    globalThis.addEventListener('storage', load)
    return () => globalThis.removeEventListener('storage', load)
  }, [])

  function handleLogout() {
    try {
      // Clear all auth and session data
      localStorage.removeItem('token')
      localStorage.removeItem('currentShop')
      localStorage.removeItem('vb_cart')
      localStorage.removeItem('user')
      
      // Close any open menus
      setShowBusinessMenu(false)
      
      // Clear cart count
      setCartCount(0)
      
      // Navigate to home and reload to clear any cached user state
      navigate('/')
      
      // Force a slight delay to ensure navigation completes, then reload
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/'
    }
  }

  return (
    <>
      <div style={{ background: '#111827', color: '#fbbf24', padding: '8px 20px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <div>+267 3111272 / 3930013</div>
          <div>info@vb.co.bw</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div>BBS Mall, B/Hurst Industrial</div>
          {user ? (
            <>
              <span style={{ color: '#fbbf24' }}>{user.name}</span>
              <Link to="/change-password" style={{ color: '#fbbf24', textDecoration: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                <i className="fas fa-key" style={{ marginRight: '5px' }}></i>Change Password
              </Link>
              <button type="button" onClick={handleLogout} style={{ background: '#fbbf24', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#111827' }}>Logout</button>
            </>
          ) : (
            <Link to="/login" style={{ background: '#fbbf24', color: '#111827', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>Sign In / Register</Link>
          )}
        </div>
      </div>

      <div style={{ background: '#111827', padding: '14px 20px', borderBottom: '3px solid #fbbf24' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img src="/images/logo.png" alt="VB" style={{ width: '90px', height: '90px', objectFit: 'contain', borderRadius: '6px' }} />
            <div style={{ color: '#fbbf24', fontWeight: '700', fontSize: '20px' }}>Variation Builders</div>
          </Link>

          <div style={{ flex: 1 }}>
            <form onSubmit={(e) => { e.preventDefault(); const q = e.target.search.value; navigate(`/shop-browse?q=${encodeURIComponent(q)}`) }} style={{ display: 'flex' }}>
              <input name="search" placeholder="Search products, e.g. toner" type="search" style={{ flex: 1, padding: '10px 14px', borderRadius: '6px 0 0 6px', border: '1px solid #555', background: '#333', color: '#fff', outline: 'none' }} />
              <button type="submit" style={{ padding: '10px 16px', background: '#fbbf24', color: '#111827', border: '1px solid #fbbf24', borderRadius: '0 6px 6px 0' }}>Search</button>
            </form>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to="/" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: '600' }}>Home</Link>
            {(!user || (user.role !== 'cashier' && user.role !== 'admin')) && <Link to="/shop-browse" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: '600' }}>Shop</Link>}
            {user && user.role === 'admin' && <Link to="/dashboard" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: '600' }}>Dashboard</Link>}
            {user && (user.role === 'cashier' || user.role === 'admin') && (
              <>
                <Link to="/pos" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: '700', background: 'rgba(255, 193, 7, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fbbf24' }}>
                  <i className="fas fa-shopping-cart" style={{ marginRight: '6px' }}></i> POS
                </Link>
              </>
            )}
            
            {/* Business Suite Dropdown */}
            {user && user.role === 'admin' && (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowBusinessMenu(!showBusinessMenu)}
                  style={{
                    color: '#fbbf24',
                    textDecoration: 'none',
                    fontWeight: '700',
                    background: 'rgba(255, 193, 7, 0.1)',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border: '1px solid #fbbf24',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Business Suite
                  <i className="fas fa-chevron-down" style={{ fontSize: '11px', transform: showBusinessMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}></i>
                </button>

                {showBusinessMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: '#1f2937',
                    border: '1px solid #fbbf24',
                    borderRadius: '6px',
                    marginTop: '4px',
                    minWidth: '200px',
                    zIndex: 1000,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                  }}>
                    <Link to="/pos" onClick={() => setShowBusinessMenu(false)} style={{ display: 'block', color: '#fbbf24', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid #374151', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#374151'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      <i className="fas fa-shopping-cart" style={{ marginRight: '8px' }}></i> POS
                    </Link>
                    <Link to="/admin" onClick={() => setShowBusinessMenu(false)} style={{ display: 'block', color: '#fbbf24', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid #374151', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#374151'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      Admin
                    </Link>
                    <Link to="/customers" onClick={() => setShowBusinessMenu(false)} style={{ display: 'block', color: '#fbbf24', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid #374151', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#374151'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      Customers
                    </Link>
                    <Link to="/employees" onClick={() => setShowBusinessMenu(false)} style={{ display: 'block', color: '#fbbf24', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid #374151', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#374151'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      Employees
                    </Link>
                    <Link to="/payroll" onClick={() => setShowBusinessMenu(false)} style={{ display: 'block', color: '#fbbf24', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid #374151', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#374151'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      Payroll
                    </Link>
                    <Link to="/banking" onClick={() => setShowBusinessMenu(false)} style={{ display: 'block', color: '#fbbf24', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid #374151', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#374151'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      Banking
                    </Link>
                    <Link to="/expenses" onClick={() => setShowBusinessMenu(false)} style={{ display: 'block', color: '#fbbf24', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid #374151', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#374151'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      Expenses
                    </Link>
                    <Link to="/reports" onClick={() => setShowBusinessMenu(false)} style={{ display: 'block', color: '#fbbf24', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid #374151', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#374151'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      Reports
                    </Link>
                    <Link to="/quotes" onClick={() => setShowBusinessMenu(false)} style={{ display: 'block', color: '#fbbf24', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid #374151', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#374151'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      Quotations
                    </Link>
                    <Link to="/admin/settings" onClick={() => setShowBusinessMenu(false)} style={{ display: 'block', color: '#fbbf24', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid #374151', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#374151'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      <i className="fas fa-cog" style={{ marginRight: '8px' }}></i> Document Settings
                    </Link>
                    <Link to="/inventory" onClick={() => setShowBusinessMenu(false)} style={{ display: 'block', color: '#fbbf24', textDecoration: 'none', padding: '12px 16px', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#374151'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      Inventory
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            <Link to="/cart" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: '600', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <i className="fas fa-shopping-cart" style={{ fontSize: '18px' }}></i>
              {cartCount > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: '#ef4444', color: '#fff', borderRadius: '12px', padding: '2px 6px', fontSize: '12px' }}>{cartCount}</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Buttons removed - now global in main.jsx */}
    </>
  )
}
