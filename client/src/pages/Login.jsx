import React, { useEffect, useState, Fragment } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Chatbot from "../components/Chatbot.jsx"

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [userShops, setUserShops] = useState([])
  const [selectedShop, setSelectedShop] = useState('')
  const [showShopSelect, setShowShopSelect] = useState(false)
  const navigate = useNavigate()

  useEffect(()=>{
    const params = new URLSearchParams(globalThis.location.search)
    const token = params.get('token')
    if(token){
      localStorage.setItem('token', token)
      params.delete('token')
      const newUrl = globalThis.location.pathname + (params.toString()?('?'+params.toString()):'')
      globalThis.history.replaceState({}, document.title, newUrl)
      navigate('/dashboard')
    }
  }, [navigate])

  async function handleLogin(e){
    e.preventDefault()
    setError('')
    try{
      const res = await axios.post('/api/auth/login', { email, password })
      console.log('=== LOGIN FLOW ===')
      console.log('Full response:', res.data)
      console.log('User object:', res.data.user)
      console.log('Role value:', res.data.user?.role)
      console.log('Type of role:', typeof res.data.user?.role)
      console.log('Role === "admin"?:', res.data.user?.role === 'admin')
      
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      const finalRole = res.data.user?.role
      console.log('Final role check:', finalRole, 'is admin?', finalRole === 'admin')
      
      // Route based on user role
      if (finalRole === 'admin') {
        console.log('✅ ROUTING TO /admin')
        navigate('/admin')
      } else {
        console.log('❌ ROUTING TO /dashboard')
        navigate('/dashboard')
      }
    }catch(err){
      console.error('Login error:', err)
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  async function handleRegister(e){
    e.preventDefault()
    setError('')
    try{
      const res = await axios.post('/api/auth/register', { name, email, password })
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    }catch(err){
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  async function handleShopSelect() {
    if (!selectedShop) return
    localStorage.setItem('currentShop', selectedShop)
    navigate('/dashboard')
  }

  return (
    <Fragment>
      <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '40px 0' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
          {/* Brand/Hero Section */}
          <div style={{ padding: '40px', background: 'linear-gradient(135deg, #ffc107 0%, #1a1a1a 100%)', borderRadius: '8px', color: '#fff' }}>
            <h1 style={{ fontSize: '36px', marginBottom: '20px', color: '#ffc107' }}>Variation Builders</h1>
            <p style={{ fontSize: '18px', marginBottom: '30px', opacity: 0.9 }}>Professional Quotation & Invoicing System</p>
            <ul style={{ listStyle: 'none', gap: '15px', display: 'flex', flexDirection: 'column' }}>
              <li>✓ Create quotations from inventory</li>
              <li>✓ Manage multiple products</li>
              <li>✓ Generate professional invoices</li>
              <li>✓ Track all transactions</li>
              <li>✓ Secure & reliable</li>
            </ul>
          </div>

          {/* Login Form Section */}
          <div>
            <div className="card" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: 'none', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #ffc107 0%, #1a1a1a 100%)', padding: '20px', textAlign: 'center' }}>
                <h2 style={{ color: '#fff', margin: '0', fontSize: '24px', fontWeight: '700' }}>
                  {isRegister ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p style={{ color: '#fff', margin: '5px 0 0', opacity: 0.9, fontSize: '14px' }}>
                  {isRegister ? 'Join Variation Builders today' : 'Sign in to your account'}
                </p>
              </div>
              <div style={{ padding: '30px' }}>

              {error && (
                <div style={{ background: '#fee', color: '#c00', padding: '12px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={isRegister ? handleRegister : handleLogin}>
                {isRegister && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>Full Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required={isRegister}
                      style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ width: '100%', padding: '12px', background: '#ffc107', color: '#1a1a1a', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {isRegister ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#ffc107', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline', fontWeight: '600' }}
                >
                  {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                </button>
              </div>

              <div style={{ margin: '20px 0', textAlign: 'center', color: '#999', fontSize: '14px' }}>OR</div>

              <a
                href="/api/auth/google"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px',
                  border: '2px solid #ffc107',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: '#ffc107',
                  background: '#1a1a1a',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.target.style.background = '#ffc107'; e.target.style.color = '#1a1a1a'; }}
                onMouseLeave={(e) => { e.target.style.background = '#1a1a1a'; e.target.style.color = '#ffc107'; }}
              >
                <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" style={{ width: '18px' }} />
                Sign in with Google
              </a>
              </div>
            </div>
          </div>
        </div>      
      </div>
      </div>
        {/* Shop Selection Modal */}
      {/* Shop Selection Modal (disabled) */}

      <Chatbot />
    </Fragment>
  )
}
