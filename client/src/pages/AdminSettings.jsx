import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function AdminSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tax')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setSettings(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage('Failed to load settings', 'error')
      setLoading(false)
    }
  }

  const showMessage = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const updateTaxRate = async (e) => {
    e.preventDefault()
    try {
      const taxRate = parseFloat(e.target.taxRate.value)
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        showMessage('Tax rate must be between 0 and 100', 'error')
        return
      }
      const token = localStorage.getItem('token')
      const response = await axios.put('/api/admin/settings/tax-rate', { taxRate }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setSettings(prev => ({ ...prev, taxRate }))
      showMessage(`Tax rate updated to ${taxRate}%`)
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error updating tax rate', 'error')
    }
  }

  const updateCompanyInfo = async (e) => {
    e.preventDefault()
    try {
      const data = {
        companyName: e.target.companyName.value,
        companyAddress: e.target.companyAddress.value,
        companyPhone: e.target.companyPhone.value,
        companyEmail: e.target.companyEmail.value,
        companyTaxId: e.target.companyTaxId.value
      }
      const token = localStorage.getItem('token')
      await axios.put('/api/admin/settings/company-info', data, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setSettings(prev => ({ ...prev, ...data }))
      showMessage('Company information updated')
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error updating company info', 'error')
    }
  }

  const updateInvoiceTemplate = async (e) => {
    e.preventDefault()
    try {
      const template = {
        headerBackgroundColor: e.target.invoiceHeaderBg.value,
        headerTextColor: e.target.invoiceHeaderText.value,
        accentColor: e.target.invoiceAccent.value,
        fontSize: parseInt(e.target.invoiceFontSize.value),
        fontFamily: e.target.invoiceFontFamily.value,
        logoSize: parseInt(e.target.invoiceLogoSize.value),
        showCompanyDetails: e.target.showCompanyDetails.checked,
        showTaxId: e.target.showTaxId.checked,
        footerText: e.target.invoiceFooter.value
      }
      const token = localStorage.getItem('token')
      await axios.put('/api/admin/settings/invoice-template', template, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setSettings(prev => ({
        ...prev,
        invoiceTemplate: { ...prev.invoiceTemplate, ...template }
      }))
      showMessage('Invoice template updated')
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error updating invoice template', 'error')
    }
  }

  const updateQuotationTemplate = async (e) => {
    e.preventDefault()
    try {
      const template = {
        headerBackgroundColor: e.target.quotHeaderBg.value,
        headerTextColor: e.target.quotHeaderText.value,
        accentColor: e.target.quotAccent.value,
        fontSize: parseInt(e.target.quotFontSize.value),
        fontFamily: e.target.quotFontFamily.value,
        logoSize: parseInt(e.target.quotLogoSize.value),
        showCompanyDetails: e.target.showQuotCompanyDetails.checked,
        showTermsAndConditions: e.target.showTermsAndConditions.checked,
        termsText: e.target.termsText.value
      }
      const token = localStorage.getItem('token')
      await axios.put('/api/admin/settings/quotation-template', template, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setSettings(prev => ({
        ...prev,
        quotationTemplate: { ...prev.quotationTemplate, ...template }
      }))
      showMessage('Quotation template updated')
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error updating quotation template', 'error')
    }
  }

  const resetTemplates = async () => {
    if (!window.confirm('Are you sure? This will reset all templates to defaults.')) return
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/admin/settings/reset-templates', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchSettings()
      showMessage('Templates reset to defaults')
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error resetting templates', 'error')
    }
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading settings...</div>
  }

  if (!settings) {
    return <div style={{ padding: '20px', color: '#e74c3c' }}>Failed to load settings</div>
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', color: '#1a1a1a' }}>Admin Settings</h1>

      {message && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '6px',
          background: messageType === 'success' ? '#d4edda' : '#f8d7da',
          color: messageType === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #e6e6e6'
      }}>
        {[
          { id: 'tax', label: '💰 Tax Settings' },
          { id: 'company', label: '🏢 Company Info' },
          { id: 'invoice', label: '📄 Invoice Template' },
          { id: 'quotation', label: '📋 Quotation Template' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#666',
              cursor: 'pointer',
              fontWeight: '600',
              borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAX SETTINGS */}
      {activeTab === 'tax' && (
        <form onSubmit={updateTaxRate} style={{
          background: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '500px'
        }}>
          <h2 style={{ marginTop: 0, color: '#1a1a1a' }}>Tax Rate Configuration</h2>
          <p style={{ color: '#666' }}>Set the default tax percentage applied to all invoices and quotations.</p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Tax Rate (%)
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                name="taxRate"
                defaultValue={settings.taxRate || 12}
                min="0"
                max="100"
                step="0.01"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <span style={{ fontWeight: '600', minWidth: '30px' }}>%</span>
            </div>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              Current: {settings.taxRate || 12}%
            </p>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Update Tax Rate
          </button>
        </form>
      )}

      {/* COMPANY INFORMATION */}
      {activeTab === 'company' && (
        <form onSubmit={updateCompanyInfo} style={{
          background: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '600px'
        }}>
          <h2 style={{ marginTop: 0, color: '#1a1a1a' }}>Company Information</h2>
          <p style={{ color: '#666' }}>This information appears on all invoices and quotations.</p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Company Name</label>
            <input
              type="text"
              name="companyName"
              defaultValue={settings.companyName || ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Address</label>
            <input
              type="text"
              name="companyAddress"
              defaultValue={settings.companyAddress || ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Phone</label>
            <input
              type="text"
              name="companyPhone"
              defaultValue={settings.companyPhone || ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Email</label>
            <input
              type="email"
              name="companyEmail"
              defaultValue={settings.companyEmail || ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Tax ID</label>
            <input
              type="text"
              name="companyTaxId"
              defaultValue={settings.companyTaxId || ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Update Company Info
          </button>
        </form>
      )}

      {/* INVOICE TEMPLATE */}
      {activeTab === 'invoice' && (
        <form onSubmit={updateInvoiceTemplate} style={{
          background: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h2 style={{ marginTop: 0, color: '#1a1a1a' }}>Invoice Template Customization</h2>
          <p style={{ color: '#666' }}>Customize the appearance of invoice documents.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Header Background Color</label>
              <input
                type="color"
                name="invoiceHeaderBg"
                defaultValue={settings.invoiceTemplate?.headerBackgroundColor || '#ffffff'}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Header Text Color</label>
              <input
                type="color"
                name="invoiceHeaderText"
                defaultValue={settings.invoiceTemplate?.headerTextColor || '#000000'}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Accent Color</label>
              <input
                type="color"
                name="invoiceAccent"
                defaultValue={settings.invoiceTemplate?.accentColor || '#3b82f6'}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Font Size</label>
              <input
                type="number"
                name="invoiceFontSize"
                defaultValue={settings.invoiceTemplate?.fontSize || 13}
                min="8"
                max="24"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Font Family</label>
              <select
                name="invoiceFontFamily"
                defaultValue={settings.invoiceTemplate?.fontFamily || 'Courier New'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="Courier New">Courier New</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Calibri">Calibri</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Logo Size (px)</label>
              <input
                type="number"
                name="invoiceLogoSize"
                defaultValue={settings.invoiceTemplate?.logoSize || 60}
                min="30"
                max="150"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="showCompanyDetails"
                defaultChecked={settings.invoiceTemplate?.showCompanyDetails}
              />
              <span style={{ fontWeight: '600' }}>Show Company Details</span>
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="showTaxId"
                defaultChecked={settings.invoiceTemplate?.showTaxId}
              />
              <span style={{ fontWeight: '600' }}>Show Tax ID</span>
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Footer Text</label>
            <textarea
              name="invoiceFooter"
              defaultValue={settings.invoiceTemplate?.footerText || ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                minHeight: '80px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Update Invoice Template
          </button>
        </form>
      )}

      {/* QUOTATION TEMPLATE */}
      {activeTab === 'quotation' && (
        <form onSubmit={updateQuotationTemplate} style={{
          background: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h2 style={{ marginTop: 0, color: '#1a1a1a' }}>Quotation Template Customization</h2>
          <p style={{ color: '#666' }}>Customize the appearance of quotation documents.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Header Background Color</label>
              <input
                type="color"
                name="quotHeaderBg"
                defaultValue={settings.quotationTemplate?.headerBackgroundColor || '#ffffff'}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Header Text Color</label>
              <input
                type="color"
                name="quotHeaderText"
                defaultValue={settings.quotationTemplate?.headerTextColor || '#000000'}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Accent Color</label>
              <input
                type="color"
                name="quotAccent"
                defaultValue={settings.quotationTemplate?.accentColor || '#ffc107'}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Font Size</label>
              <input
                type="number"
                name="quotFontSize"
                defaultValue={settings.quotationTemplate?.fontSize || 13}
                min="8"
                max="24"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Font Family</label>
              <select
                name="quotFontFamily"
                defaultValue={settings.quotationTemplate?.fontFamily || 'Arial'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="Courier New">Courier New</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Calibri">Calibri</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Logo Size (px)</label>
              <input
                type="number"
                name="quotLogoSize"
                defaultValue={settings.quotationTemplate?.logoSize || 60}
                min="30"
                max="150"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="showQuotCompanyDetails"
                defaultChecked={settings.quotationTemplate?.showCompanyDetails}
              />
              <span style={{ fontWeight: '600' }}>Show Company Details</span>
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="showTermsAndConditions"
                defaultChecked={settings.quotationTemplate?.showTermsAndConditions}
              />
              <span style={{ fontWeight: '600' }}>Show Terms & Conditions</span>
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Terms & Conditions Text</label>
            <textarea
              name="termsText"
              defaultValue={settings.quotationTemplate?.termsText || ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                minHeight: '100px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Update Quotation Template
          </button>
        </form>
      )}

      {/* RESET BUTTON */}
      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #e6e6e6' }}>
        <button
          onClick={resetTemplates}
          style={{
            padding: '10px 16px',
            background: '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Reset All Templates to Defaults
        </button>
      </div>
    </div>
  )
}
