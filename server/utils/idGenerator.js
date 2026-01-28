const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { counters: { invoiceNum: 1, quotationNum: 1 } };
  }
}

function writeDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

/**
 * Generate next invoice number (VB-INV-001, VB-INV-002, etc.)
 */
function getNextInvoiceNumber() {
  try {
    const db = readDB();
    
    // Initialize if not exists
    if (!db.counters) {
      db.counters = { invoiceNum: 1 };
      writeDB(db);
      return `VB-INV-001`;
    }
    
    if (!db.counters.invoiceNum) {
      db.counters.invoiceNum = 1;
    }
    
    const num = db.counters.invoiceNum;
    db.counters.invoiceNum++;
    writeDB(db);
    
    return `VB-INV-${String(num).padStart(3, '0')}`;
  } catch (err) {
    console.error('Error generating invoice number:', err);
    // Fallback to timestamp-based if database error
    return `VB-INV-${Date.now()}`;
  }
}

/**
 * Generate next quotation number (VBQ-001, VBQ-002, etc.)
 */
function getNextQuotationNumber() {
  try {
    const db = readDB();
    
    // Initialize if not exists
    if (!db.counters) {
      db.counters = { quotationNum: 1 };
      writeDB(db);
      return `VBQ-001`;
    }
    
    if (!db.counters.quotationNum) {
      db.counters.quotationNum = 1;
    }
    
    const num = db.counters.quotationNum;
    db.counters.quotationNum++;
    writeDB(db);
    
    return `VBQ-${String(num).padStart(3, '0')}`;
  } catch (err) {
    console.error('Error generating quotation number:', err);
    // Fallback to timestamp-based if database error
    return `VBQ-${Date.now()}`;
  }
}

module.exports = {
  getNextInvoiceNumber,
  getNextQuotationNumber
};
