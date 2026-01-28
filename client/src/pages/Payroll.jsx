import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatBWP } from '../utils/currency.js';

const Payroll = () => {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [totalPayrollThisMonth, setTotalPayrollThisMonth] = useState(0);
  const [formData, setFormData] = useState({
    employeeId: '',
    payPeriodStart: '',
    payPeriodEnd: '',
    hoursWorked: '',
    regularHours: '',
    overtimeHours: '',
    grossPay: '',
    deductions: '',
    taxes: '',
    netPay: '',
    paymentMethod: 'Direct Deposit',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPayrollRecords();
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Calculate total payroll for this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthPayroll = payrollRecords
      .filter(record => {
        const recordDate = new Date(record.paymentDate);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      })
      .reduce((total, record) => total + (record.netPay || 0), 0);
    setTotalPayrollThisMonth(thisMonthPayroll);
  }, [payrollRecords]);

  const fetchPayrollRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payroll', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPayrollRecords(data);
      }
    } catch (error) {
      console.error('Error fetching payroll records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCalculatePayroll = async () => {
    if (!selectedEmployee || !formData.payPeriodStart || !formData.payPeriodEnd) {
      alert('Please select an employee and pay period');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payroll/calculate/${selectedEmployee.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          hoursWorked: formData.hoursWorked,
          overtimeHours: formData.overtimeHours,
          payPeriodStart: formData.payPeriodStart,
          payPeriodEnd: formData.payPeriodEnd
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCalculation(data.calculation);
        setFormData({
          ...formData,
          grossPay: data.calculation.grossPay.toFixed(2),
          taxes: data.calculation.taxes.total.toFixed(2),
          netPay: data.calculation.netPay.toFixed(2),
          regularHours: data.calculation.regularHours,
          overtimeHours: data.calculation.overtimeHours
        });
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error calculating payroll:', error);
      alert('Error calculating payroll');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchPayrollRecords();
        setShowForm(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error saving payroll record:', error);
      alert('Error saving payroll record');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      payPeriodStart: '',
      payPeriodEnd: '',
      hoursWorked: '',
      regularHours: '',
      overtimeHours: '',
      grossPay: '',
      deductions: '',
      taxes: '',
      netPay: '',
      paymentMethod: 'Direct Deposit',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setSelectedEmployee(null);
    setCalculation(null);
  };

  const handleEmployeeChange = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    setSelectedEmployee(employee);
    setFormData({ ...formData, employeeId });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#ffc107',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #333',
            borderTop: '4px solid #ffc107',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ fontSize: '18px', fontWeight: '500' }}>Loading Payroll Management...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        borderBottom: '2px solid #ffc107',
        padding: '20px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)'
            }}>
              <i className="fas fa-dollar-sign" style={{
                fontSize: '24px',
                color: '#1a1a1a'
              }}></i>
            </div>
            <div>
              <h1 style={{
                fontSize: '26px',
                fontWeight: '700',
                color: '#ffc107',
                margin: 0
              }}>Payroll Management</h1>
              <p style={{
                fontSize: '13px',
                color: '#b0b0b0',
                margin: '4px 0 0 0'
              }}>Process payments, calculate taxes, manage deductions</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowCalculator(true)}
              style={{
                backgroundColor: '#ffc107',
                color: '#1a1a1a',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(255, 193, 7, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.background = '#ffb300'}
              onMouseOut={(e) => e.target.style.background = '#ffc107'}
            >
              <i className="fas fa-calculator"></i>
              Calculate
            </button>

            <button
              onClick={() => setShowForm(true)}
              style={{
                backgroundColor: '#28a745',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              <i className="fas fa-plus-circle"></i>
              Process Payment
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px'
      }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: '#2d2d2d',
            border: '1px solid #404040',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#ffc107',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-users" style={{
                  fontSize: '20px',
                  color: '#1a1a1a'
                }}></i>
              </div>
              <div>
                <p style={{
                  fontSize: '14px',
                  color: '#cccccc',
                  margin: '0 0 4px 0'
                }}>Total Employees</p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0
                }}>{employees.length}</p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#2d2d2d',
            border: '1px solid #404040',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#ffc107',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-dollar-sign" style={{
                  fontSize: '20px',
                  color: '#1a1a1a'
                }}></i>
              </div>
              <div>
                <p style={{
                  fontSize: '14px',
                  color: '#cccccc',
                  margin: '0 0 4px 0'
                }}>Total Payroll This Month</p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0
                }}>{formatBWP(totalPayrollThisMonth)}</p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#2d2d2d',
            border: '1px solid #404040',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#ffc107',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-file-invoice-dollar" style={{
                  fontSize: '20px',
                  color: '#1a1a1a'
                }}></i>
              </div>
              <div>
                <p style={{
                  fontSize: '14px',
                  color: '#cccccc',
                  margin: '0 0 4px 0'
                }}>Payroll Records</p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0
                }}>{payrollRecords.length}</p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#2d2d2d',
            border: '1px solid #404040',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#ffc107',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-calendar-check" style={{
                  fontSize: '20px',
                  color: '#1a1a1a'
                }}></i>
              </div>
              <div>
                <p style={{
                  fontSize: '14px',
                  color: '#cccccc',
                  margin: '0 0 4px 0'
                }}>Pending Payments</p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0
                }}>{payrollRecords.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Calculator Modal */}
        {showCalculator && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              backgroundColor: '#2d2d2d',
              border: '1px solid #404040',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#ffc107',
                  margin: 0
                }}>Payroll Calculator</h2>
                <button
                  onClick={() => { setShowCalculator(false); resetForm(); }}
                  style={{
                    color: '#cccccc',
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.color = '#ffffff'}
                  onMouseOut={(e) => e.target.style.color = '#cccccc'}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: '#ffffff'
                  }}>Select Employee</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #404040',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                    onBlur={(e) => e.target.style.borderColor = '#404040'}
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedEmployee && (
                  <div style={{
                    backgroundColor: '#1a1a1a',
                    padding: '16px',
                    borderRadius: '6px',
                    border: '1px solid #404040'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#ffc107',
                      marginBottom: '8px'
                    }}>Employee Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                      <p style={{ margin: 0, color: '#cccccc' }}><strong style={{ color: '#ffffff' }}>Name:</strong> {selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                      <p style={{ margin: 0, color: '#cccccc' }}><strong style={{ color: '#ffffff' }}>Position:</strong> {selectedEmployee.position}</p>
                      <p style={{ margin: 0, color: '#cccccc' }}><strong style={{ color: '#ffffff' }}>Pay Type:</strong> {selectedEmployee.payType}</p>
                      {selectedEmployee.payType === 'salary' ? (
                        <p style={{ margin: 0, color: '#cccccc' }}><strong style={{ color: '#ffffff' }}>Annual Salary:</strong> ${selectedEmployee.salary?.toLocaleString()}</p>
                      ) : (
                        <p style={{ margin: 0, color: '#cccccc' }}><strong style={{ color: '#ffffff' }}>Hourly Rate:</strong> ${selectedEmployee.hourlyRate}/hour</p>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Pay Period Start</label>
                    <input
                      type="date"
                      value={formData.payPeriodStart}
                      onChange={(e) => setFormData({...formData, payPeriodStart: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                      onBlur={(e) => e.target.style.borderColor = '#404040'}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Pay Period End</label>
                    <input
                      type="date"
                      value={formData.payPeriodEnd}
                      onChange={(e) => setFormData({...formData, payPeriodEnd: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                      onBlur={(e) => e.target.style.borderColor = '#404040'}
                    />
                  </div>
                </div>

                {selectedEmployee?.payType === 'hourly' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '4px',
                        color: '#ffffff'
                      }}>Hours Worked</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.hoursWorked}
                        onChange={(e) => setFormData({...formData, hoursWorked: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #404040',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                        onBlur={(e) => e.target.style.borderColor = '#404040'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '4px',
                        color: '#ffffff'
                      }}>Overtime Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.overtimeHours}
                        onChange={(e) => setFormData({...formData, overtimeHours: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #404040',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                        onBlur={(e) => e.target.style.borderColor = '#404040'}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCalculatePayroll}
                  style={{
                    width: '100%',
                    backgroundColor: '#28a745',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                >
                  Calculate Payroll
                </button>

                {calculation && (
                  <div style={{
                    backgroundColor: '#1a1a1a',
                    padding: '16px',
                    borderRadius: '6px',
                    border: '1px solid #404040'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#ffc107',
                      marginBottom: '8px'
                    }}>Payroll Calculation</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '14px' }}>
                      <p style={{ margin: 0, color: '#cccccc' }}><strong style={{ color: '#ffffff' }}>Gross Pay:</strong> {formatBWP(calculation.grossPay)}</p>
                      <p style={{ margin: 0, color: '#cccccc' }}><strong style={{ color: '#ffffff' }}>Federal Tax:</strong> {formatBWP(calculation.taxes.federal)}</p>
                      <p style={{ margin: 0, color: '#cccccc' }}><strong style={{ color: '#ffffff' }}>State Tax:</strong> {formatBWP(calculation.taxes.state)}</p>
                      <p style={{ margin: 0, color: '#cccccc' }}><strong style={{ color: '#ffffff' }}>Social Security:</strong> {formatBWP(calculation.taxes.socialSecurity)}</p>
                      <p style={{ margin: 0, color: '#cccccc' }}><strong style={{ color: '#ffffff' }}>Medicare:</strong> {formatBWP(calculation.taxes.medicare)}</p>
                      <p style={{ margin: 0, color: '#cccccc' }}><strong style={{ color: '#ffffff' }}>Total Taxes:</strong> {formatBWP(calculation.taxes.total)}</p>
                      <p style={{ margin: '4px 0', color: '#28a745', fontWeight: '600', gridColumn: 'span 2', textAlign: 'center' }}>
                        <strong>Net Pay:</strong> {formatBWP(calculation.netPay)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payroll Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              backgroundColor: '#2d2d2d',
              border: '1px solid #404040',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#ffc107',
                  margin: 0
                }}>Process Payroll</h2>
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  style={{
                    color: '#cccccc',
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.color = '#ffffff'}
                  onMouseOut={(e) => e.target.style.color = '#cccccc'}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: '#ffffff'
                  }}>Employee *</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #404040',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                    onBlur={(e) => e.target.style.borderColor = '#404040'}
                    required
                  >
                    <option value="">Select an employee...</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Pay Period Start *</label>
                    <input
                      type="date"
                      value={formData.payPeriodStart}
                      onChange={(e) => setFormData({...formData, payPeriodStart: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                      onBlur={(e) => e.target.style.borderColor = '#404040'}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Pay Period End *</label>
                    <input
                      type="date"
                      value={formData.payPeriodEnd}
                      onChange={(e) => setFormData({...formData, payPeriodEnd: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                      onBlur={(e) => e.target.style.borderColor = '#404040'}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Gross Pay *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.grossPay}
                      onChange={(e) => setFormData({...formData, grossPay: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                      onBlur={(e) => e.target.style.borderColor = '#404040'}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Taxes</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.taxes}
                      onChange={(e) => setFormData({...formData, taxes: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                      onBlur={(e) => e.target.style.borderColor = '#404040'}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Deductions</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deductions}
                      onChange={(e) => setFormData({...formData, deductions: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                      onBlur={(e) => e.target.style.borderColor = '#404040'}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Net Pay</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.netPay}
                      onChange={(e) => setFormData({...formData, netPay: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                      onBlur={(e) => e.target.style.borderColor = '#404040'}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                      onBlur={(e) => e.target.style.borderColor = '#404040'}
                    >
                      <option value="Direct Deposit">Direct Deposit</option>
                      <option value="Check">Check</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Payment Date</label>
                    <input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #404040',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                      onBlur={(e) => e.target.style.borderColor = '#404040'}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '16px'
                }}>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ffc107',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e6b800'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#ffc107'}
                  >
                    Process Payroll
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payroll Records Table */}
        <div style={{
          backgroundColor: '#2d2d2d',
          border: '1px solid #404040',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#1a1a1a' }}>
                <tr>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Employee</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Pay Period</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Gross Pay</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Taxes</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Net Pay</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Payment Date</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Status</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#2d2d2d' }}>
                {payrollRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      color: '#cccccc',
                      fontSize: '16px'
                    }}>
                      No payroll records found.{' '}
                      <button
                        onClick={() => setShowCalculator(true)}
                        style={{
                          color: '#ffc107',
                          textDecoration: 'underline',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        onMouseOver={(e) => e.target.style.color = '#e6b800'}
                        onMouseOut={(e) => e.target.style.color = '#ffc107'}
                      >
                        Process your first payroll
                      </button>
                    </td>
                  </tr>
                ) : (
                  payrollRecords.map((record) => (
                    <tr key={record.id} style={{
                      borderBottom: '1px solid #404040',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.closest('tr').style.backgroundColor = '#333'}
                    onMouseOut={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#ffc107',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1a1a1a'
                          }}>
                            {record.employee ? record.employee.firstName.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#ffffff'
                            }}>
                              {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Unknown'}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#cccccc'
                            }}>
                              {record.employee?.position}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#cccccc'
                        }}>
                          {record.payPeriodStart} to {record.payPeriodEnd}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#ffffff'
                        }}>
                          {formatBWP(record.grossPay || 0)}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#cccccc'
                        }}>
                          {formatBWP(record.taxes || 0)}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#28a745'
                        }}>
                          {formatBWP(record.netPay || 0)}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#cccccc'
                        }}>
                          {record.paymentDate}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '4px',
                          backgroundColor: '#28a745',
                          color: '#ffffff',
                          textTransform: 'uppercase'
                        }}>
                          {record.status || 'processed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;