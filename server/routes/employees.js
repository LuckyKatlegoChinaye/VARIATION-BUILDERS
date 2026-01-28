const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all employees (admin only)
router.get('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const db = readDB();
  const employees = db.employees || [];
  res.json(employees);
});

// Get employee by ID
router.get('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const db = readDB();
  const employee = db.employees?.find(emp => emp.id === req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  res.json(employee);
});

// Create new employee
router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    hireDate,
    position,
    department,
    salary,
    hourlyRate,
    payType,
    taxId,
    bankAccount,
    emergencyContact
  } = req.body;

  if (!firstName || !lastName || !email || !hireDate) {
    return res.status(400).json({ error: 'First name, last name, email, and hire date are required' });
  }

  const db = readDB();
  if (!db.employees) db.employees = [];

  // Check if employee with this email already exists
  const existing = db.employees.find(emp => emp.email === email);
  if (existing) {
    return res.status(400).json({ error: 'Employee with this email already exists' });
  }

  const employee = {
    id: uuidv4(),
    firstName,
    lastName,
    email,
    phone: phone || '',
    address: address || '',
    hireDate,
    position: position || '',
    department: department || '',
    salary: salary ? parseFloat(salary) : 0,
    hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 0,
    payType: payType || 'salary', // 'salary' or 'hourly'
    taxId: taxId || '',
    bankAccount: bankAccount || '',
    emergencyContact: emergencyContact || {},
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.employees.push(employee);
  writeDB(db);
  res.status(201).json(employee);
});

// Update employee
router.put('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const db = readDB();
  const employeeIndex = db.employees?.findIndex(emp => emp.id === req.params.id);

  if (employeeIndex === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    hireDate,
    position,
    department,
    salary,
    hourlyRate,
    payType,
    taxId,
    bankAccount,
    emergencyContact,
    status
  } = req.body;

  // Check if email is taken by another employee
  const existing = db.employees.find(emp => emp.email === email && emp.id !== req.params.id);
  if (existing) {
    return res.status(400).json({ error: 'Email already in use by another employee' });
  }

  db.employees[employeeIndex] = {
    ...db.employees[employeeIndex],
    firstName: firstName || db.employees[employeeIndex].firstName,
    lastName: lastName || db.employees[employeeIndex].lastName,
    email: email || db.employees[employeeIndex].email,
    phone: phone !== undefined ? phone : db.employees[employeeIndex].phone,
    address: address !== undefined ? address : db.employees[employeeIndex].address,
    hireDate: hireDate || db.employees[employeeIndex].hireDate,
    position: position !== undefined ? position : db.employees[employeeIndex].position,
    department: department !== undefined ? department : db.employees[employeeIndex].department,
    salary: salary !== undefined ? parseFloat(salary) : db.employees[employeeIndex].salary,
    hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : db.employees[employeeIndex].hourlyRate,
    payType: payType || db.employees[employeeIndex].payType,
    taxId: taxId !== undefined ? taxId : db.employees[employeeIndex].taxId,
    bankAccount: bankAccount !== undefined ? bankAccount : db.employees[employeeIndex].bankAccount,
    emergencyContact: emergencyContact !== undefined ? emergencyContact : db.employees[employeeIndex].emergencyContact,
    status: status || db.employees[employeeIndex].status,
    updatedAt: new Date().toISOString()
  };

  writeDB(db);
  res.json(db.employees[employeeIndex]);
});

// Delete employee
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const db = readDB();
  const employeeIndex = db.employees?.findIndex(emp => emp.id === req.params.id);

  if (employeeIndex === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  db.employees.splice(employeeIndex, 1);
  writeDB(db);
  res.json({ message: 'Employee deleted successfully' });
});

// Get payroll data for an employee
router.get('/:id/payroll', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const db = readDB();
  const employee = db.employees?.find(emp => emp.id === req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const payrollRecords = db.payroll?.filter(p => p.employeeId === req.params.id) || [];
  res.json({ employee, payroll: payrollRecords });
});

module.exports = router;