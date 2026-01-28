const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all payroll records (admin only)
router.get('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const db = readDB();
  const payroll = db.payroll || [];
  // Include employee information
  const payrollWithEmployees = payroll.map(record => {
    const employee = db.employees?.find(emp => emp.id === record.employeeId);
    return { ...record, employee };
  });
  res.json(payrollWithEmployees);
});

// Get payroll record by ID
router.get('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const db = readDB();
  const record = db.payroll?.find(p => p.id === req.params.id);
  if (!record) return res.status(404).json({ error: 'Payroll record not found' });

  const employee = db.employees?.find(emp => emp.id === record.employeeId);
  res.json({ ...record, employee });
});

// Create payroll record
router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const {
    employeeId,
    payPeriodStart,
    payPeriodEnd,
    hoursWorked,
    regularHours,
    overtimeHours,
    grossPay,
    deductions,
    taxes,
    netPay,
    paymentMethod,
    paymentDate
  } = req.body;

  if (!employeeId || !payPeriodStart || !payPeriodEnd || grossPay === undefined) {
    return res.status(400).json({ error: 'Employee ID, pay period dates, and gross pay are required' });
  }

  const db = readDB();

  // Verify employee exists
  const employee = db.employees?.find(emp => emp.id === employeeId);
  if (!employee) {
    return res.status(400).json({ error: 'Employee not found' });
  }

  if (!db.payroll) db.payroll = [];

  const payrollRecord = {
    id: uuidv4(),
    employeeId,
    payPeriodStart,
    payPeriodEnd,
    hoursWorked: hoursWorked ? parseFloat(hoursWorked) : 0,
    regularHours: regularHours ? parseFloat(regularHours) : 0,
    overtimeHours: overtimeHours ? parseFloat(overtimeHours) : 0,
    grossPay: parseFloat(grossPay),
    deductions: deductions ? parseFloat(deductions) : 0,
    taxes: taxes ? parseFloat(taxes) : 0,
    netPay: netPay ? parseFloat(netPay) : (parseFloat(grossPay) - (deductions || 0) - (taxes || 0)),
    paymentMethod: paymentMethod || 'Direct Deposit',
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    status: 'processed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.payroll.push(payrollRecord);
  writeDB(db);
  res.status(201).json({ ...payrollRecord, employee });
});

// Update payroll record
router.put('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const db = readDB();
  const recordIndex = db.payroll?.findIndex(p => p.id === req.params.id);

  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Payroll record not found' });
  }

  const {
    employeeId,
    payPeriodStart,
    payPeriodEnd,
    hoursWorked,
    regularHours,
    overtimeHours,
    grossPay,
    deductions,
    taxes,
    netPay,
    paymentMethod,
    paymentDate,
    status
  } = req.body;

  db.payroll[recordIndex] = {
    ...db.payroll[recordIndex],
    employeeId: employeeId || db.payroll[recordIndex].employeeId,
    payPeriodStart: payPeriodStart || db.payroll[recordIndex].payPeriodStart,
    payPeriodEnd: payPeriodEnd || db.payroll[recordIndex].payPeriodEnd,
    hoursWorked: hoursWorked !== undefined ? parseFloat(hoursWorked) : db.payroll[recordIndex].hoursWorked,
    regularHours: regularHours !== undefined ? parseFloat(regularHours) : db.payroll[recordIndex].regularHours,
    overtimeHours: overtimeHours !== undefined ? parseFloat(overtimeHours) : db.payroll[recordIndex].overtimeHours,
    grossPay: grossPay !== undefined ? parseFloat(grossPay) : db.payroll[recordIndex].grossPay,
    deductions: deductions !== undefined ? parseFloat(deductions) : db.payroll[recordIndex].deductions,
    taxes: taxes !== undefined ? parseFloat(taxes) : db.payroll[recordIndex].taxes,
    netPay: netPay !== undefined ? parseFloat(netPay) : db.payroll[recordIndex].netPay,
    paymentMethod: paymentMethod || db.payroll[recordIndex].paymentMethod,
    paymentDate: paymentDate || db.payroll[recordIndex].paymentDate,
    status: status || db.payroll[recordIndex].status,
    updatedAt: new Date().toISOString()
  };

  writeDB(db);
  const employee = db.employees?.find(emp => emp.id === db.payroll[recordIndex].employeeId);
  res.json({ ...db.payroll[recordIndex], employee });
});

// Delete payroll record
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const db = readDB();
  const recordIndex = db.payroll?.findIndex(p => p.id === req.params.id);

  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Payroll record not found' });
  }

  db.payroll.splice(recordIndex, 1);
  writeDB(db);
  res.json({ message: 'Payroll record deleted successfully' });
});

// Calculate payroll for an employee
router.post('/calculate/:employeeId', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { hoursWorked, overtimeHours, payPeriodStart, payPeriodEnd } = req.body;

  const db = readDB();
  const employee = db.employees?.find(emp => emp.id === req.params.employeeId);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  let grossPay = 0;
  let regularHours = 0;
  let overtime = 0;

  if (employee.payType === 'hourly') {
    regularHours = Math.min(hoursWorked || 0, 40); // Assuming 40 hour work week
    overtime = Math.max((hoursWorked || 0) - 40, 0) + (overtimeHours || 0);

    grossPay = (regularHours * employee.hourlyRate) + (overtime * employee.hourlyRate * 1.5);
  } else {
    // Salary - prorate based on pay period
    const annualSalary = employee.salary;
    grossPay = annualSalary / 26; // Bi-weekly pay periods
  }

  // Calculate taxes (simplified - in real QuickBooks this would be more complex)
  const federalTax = grossPay * 0.15; // 15% federal
  const stateTax = grossPay * 0.05; // 5% state
  const socialSecurity = grossPay * 0.062; // 6.2% social security
  const medicare = grossPay * 0.0145; // 1.45% medicare

  const totalTaxes = federalTax + stateTax + socialSecurity + medicare;
  const netPay = grossPay - totalTaxes;

  res.json({
    employee,
    calculation: {
      payPeriodStart,
      payPeriodEnd,
      hoursWorked: hoursWorked || 0,
      regularHours,
      overtimeHours: overtime,
      hourlyRate: employee.hourlyRate,
      grossPay,
      taxes: {
        federal: federalTax,
        state: stateTax,
        socialSecurity,
        medicare,
        total: totalTaxes
      },
      deductions: 0, // Can be expanded
      netPay
    }
  });
});

module.exports = router;