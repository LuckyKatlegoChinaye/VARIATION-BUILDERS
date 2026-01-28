const express = require('express')
const authMiddleware = require('../middleware/authMiddleware.js')
const { roleMiddleware } = require('../middleware/rbacMiddleware.js')
const { readDB, writeDB } = require('../dataStore.js')

const router = express.Router()

// Get current settings (authenticated users only)
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = readDB()
    const settings = db.adminSettings || {
      taxRate: 12,
      companyName: 'VARIATION BUILDERS',
      companyAddress: 'Plot 6815, Broadhurst Extension, Gaborone',
      companyPhone: '+267 397 4000',
      companyEmail: 'info@variationbuilders.co.bw',
      companyTaxId: 'BW123456789',
      invoiceTemplate: {
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#000000',
        accentColor: '#3b82f6',
        fontSize: 13,
        fontFamily: 'Courier New',
        logoSize: 60,
        showCompanyDetails: true,
        showTaxId: true,
        footerText: 'Thank you for your business!'
      },
      quotationTemplate: {
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#000000',
        accentColor: '#ffc107',
        fontSize: 13,
        fontFamily: 'Arial',
        logoSize: 60,
        showCompanyDetails: true,
        showTermsAndConditions: true,
        termsText: 'This quotation is valid for 30 days. Payment terms: 50% deposit, balance on completion.'
      }
    }
    res.json(settings)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Update tax rate (admin only)
router.put('/tax-rate', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const { taxRate } = req.body

    if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100) {
      return res.status(400).json({ error: 'Tax rate must be between 0 and 100' })
    }

    const db = readDB()
    if (!db.adminSettings) {
      db.adminSettings = {}
    }
    db.adminSettings.taxRate = taxRate
    writeDB(db)

    res.json({ success: true, taxRate, message: `Tax rate updated to ${taxRate}%` })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Update company information (admin only)
router.put('/company-info', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const { companyName, companyAddress, companyPhone, companyEmail, companyTaxId } = req.body

    const db = readDB()
    if (!db.adminSettings) {
      db.adminSettings = {}
    }

    if (companyName) db.adminSettings.companyName = companyName
    if (companyAddress) db.adminSettings.companyAddress = companyAddress
    if (companyPhone) db.adminSettings.companyPhone = companyPhone
    if (companyEmail) db.adminSettings.companyEmail = companyEmail
    if (companyTaxId) db.adminSettings.companyTaxId = companyTaxId

    writeDB(db)

    res.json({ success: true, message: 'Company information updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Update invoice template (admin only)
router.put('/invoice-template', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const template = req.body

    const db = readDB()
    if (!db.adminSettings) {
      db.adminSettings = {}
    }
    if (!db.adminSettings.invoiceTemplate) {
      db.adminSettings.invoiceTemplate = {}
    }

    // Validate color fields
    const validColors = ['headerBackgroundColor', 'headerTextColor', 'accentColor']
    validColors.forEach(color => {
      if (template[color] && /^#[0-9A-F]{6}$/i.test(template[color])) {
        db.adminSettings.invoiceTemplate[color] = template[color]
      }
    })

    // Validate numeric fields
    if (typeof template.fontSize === 'number' && template.fontSize > 0) {
      db.adminSettings.invoiceTemplate.fontSize = template.fontSize
    }
    if (typeof template.logoSize === 'number' && template.logoSize > 0) {
      db.adminSettings.invoiceTemplate.logoSize = template.logoSize
    }

    // Validate boolean fields
    if (typeof template.showCompanyDetails === 'boolean') {
      db.adminSettings.invoiceTemplate.showCompanyDetails = template.showCompanyDetails
    }
    if (typeof template.showTaxId === 'boolean') {
      db.adminSettings.invoiceTemplate.showTaxId = template.showTaxId
    }

    // Update text fields
    if (template.fontFamily) db.adminSettings.invoiceTemplate.fontFamily = template.fontFamily
    if (template.footerText) db.adminSettings.invoiceTemplate.footerText = template.footerText

    writeDB(db)

    res.json({ success: true, message: 'Invoice template updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Update quotation template (admin only)
router.put('/quotation-template', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const template = req.body

    const db = readDB()
    if (!db.adminSettings) {
      db.adminSettings = {}
    }
    if (!db.adminSettings.quotationTemplate) {
      db.adminSettings.quotationTemplate = {}
    }

    // Validate color fields
    const validColors = ['headerBackgroundColor', 'headerTextColor', 'accentColor']
    validColors.forEach(color => {
      if (template[color] && /^#[0-9A-F]{6}$/i.test(template[color])) {
        db.adminSettings.quotationTemplate[color] = template[color]
      }
    })

    // Validate numeric fields
    if (typeof template.fontSize === 'number' && template.fontSize > 0) {
      db.adminSettings.quotationTemplate.fontSize = template.fontSize
    }
    if (typeof template.logoSize === 'number' && template.logoSize > 0) {
      db.adminSettings.quotationTemplate.logoSize = template.logoSize
    }

    // Validate boolean fields
    if (typeof template.showCompanyDetails === 'boolean') {
      db.adminSettings.quotationTemplate.showCompanyDetails = template.showCompanyDetails
    }
    if (typeof template.showTermsAndConditions === 'boolean') {
      db.adminSettings.quotationTemplate.showTermsAndConditions = template.showTermsAndConditions
    }

    // Update text fields
    if (template.fontFamily) db.adminSettings.quotationTemplate.fontFamily = template.fontFamily
    if (template.termsText) db.adminSettings.quotationTemplate.termsText = template.termsText

    writeDB(db)

    res.json({ success: true, message: 'Quotation template updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Reset templates to defaults (admin only)
router.post('/reset-templates', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  try {
    const db = readDB()
    if (!db.adminSettings) {
      db.adminSettings = {}
    }

    db.adminSettings.invoiceTemplate = {
      headerBackgroundColor: '#ffffff',
      headerTextColor: '#000000',
      accentColor: '#3b82f6',
      fontSize: 13,
      fontFamily: 'Courier New',
      logoSize: 60,
      showCompanyDetails: true,
      showTaxId: true,
      footerText: 'Thank you for your business!'
    }

    db.adminSettings.quotationTemplate = {
      headerBackgroundColor: '#ffffff',
      headerTextColor: '#000000',
      accentColor: '#ffc107',
      fontSize: 13,
      fontFamily: 'Arial',
      logoSize: 60,
      showCompanyDetails: true,
      showTermsAndConditions: true,
      termsText: 'This quotation is valid for 30 days. Payment terms: 50% deposit, balance on completion.'
    }

    writeDB(db)

    res.json({ success: true, message: 'Templates reset to defaults' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
