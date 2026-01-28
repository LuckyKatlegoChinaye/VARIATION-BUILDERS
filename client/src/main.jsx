import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Inventory from './pages/Inventory.jsx'
import Quotes from './pages/Quotes.jsx'
import QuotationBuilder from './pages/QuotationBuilder.jsx'
import Admin from './pages/Admin.jsx'
import SystemAdmin from './pages/SystemAdmin.jsx'
import Customers from './pages/Customers.jsx'
import Employees from './pages/Employees.jsx'
import Payroll from './pages/Payroll.jsx'
import Banking from './pages/Banking.jsx'
import Expenses from './pages/Expenses.jsx'
import Reports from './pages/Reports.jsx'
import BusinessManagement from './pages/BusinessManagement.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import Toners from './pages/Toners.jsx'
import Furniture from './pages/Furniture.jsx'
import Stationery from './pages/Stationery.jsx'
import Electronics from './pages/Electronics.jsx'
import Shops from './pages/Shops.jsx'
import AdminSettings from './pages/AdminSettings.jsx'
import ShopBrowse from './pages/ShopBrowse.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import POS from './pages/POS.jsx'
import VoidReturn from './pages/VoidReturn.jsx'
import Header from './components/Header.jsx'
import ChatBot from './components/Chatbot.jsx'
import './template-styles.css'
import './styles.css'

// Vite is already configured to proxy /api requests to http://localhost:4000
// So axios doesn't need a baseURL, it will use relative paths

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/" />
}

function Layout({ children }) {
  const token = localStorage.getItem('token')
  let user = null
  if (token) {
    try {
      // JWT format: header.payload.signature - decode the payload (middle part)
      const decoded = JSON.parse(atob(token.split('.')[1]))
      user = { ...decoded, name: decoded.email?.split('@')[0] || 'User' }
    } catch (_err) {
      // ignore
    }
  }
  return (
    <>
      <Header user={user} />
      <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingTop: '20px' }}>
        {children}
      </div>
    </>
  )
}

function ProtectedLayout({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/" />
  return <Layout>{children}</Layout>
}

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home/>} />
              <Route path="/shop-browse" element={<ShopBrowse/>} />
              <Route path="/shop" element={<Shop/>} />
              <Route path="/shop/toners" element={<Toners/>} />
              <Route path="/shop/furniture" element={<Furniture/>} />
              <Route path="/shop/stationery" element={<Stationery/>} />
              <Route path="/shop/electronics" element={<Electronics/>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>} />
              <Route path="/quotation-builder" element={<PrivateRoute><QuotationBuilder/></PrivateRoute>} />
              <Route path="/inventory" element={<PrivateRoute><Inventory/></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute><Admin/></PrivateRoute>} />
              <Route path="/admin/settings" element={<PrivateRoute><AdminSettings/></PrivateRoute>} />
              <Route path="/system-admin" element={<PrivateRoute><SystemAdmin/></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><Customers/></PrivateRoute>} />
              <Route path="/employees" element={<PrivateRoute><Employees/></PrivateRoute>} />
              <Route path="/payroll" element={<PrivateRoute><Payroll/></PrivateRoute>} />
              <Route path="/banking" element={<PrivateRoute><Banking/></PrivateRoute>} />
              <Route path="/expenses" element={<PrivateRoute><Expenses/></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><Reports/></PrivateRoute>} />
              <Route path="/business-management" element={<PrivateRoute><BusinessManagement/></PrivateRoute>} />
              <Route path="/quotes" element={<PrivateRoute><Quotes/></PrivateRoute>} />
              <Route path="/shops" element={<PrivateRoute><Shops/></PrivateRoute>} />
              <Route path="/pos" element={<PrivateRoute><POS/></PrivateRoute>} />
              <Route path="/void-return" element={<PrivateRoute><VoidReturn/></PrivateRoute>} />
              <Route path="/change-password" element={<PrivateRoute><ChangePassword/></PrivateRoute>} />
              <Route path="/product/:id" element={<Product/>} />
              <Route path="/cart" element={<Cart/>} />
            </Routes>
          </Layout>
        } />
      </Routes>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/26776853770"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#25d366',
          color: '#fff',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          textDecoration: 'none',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      </a>

      <ChatBot />
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
