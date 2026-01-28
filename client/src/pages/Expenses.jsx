import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatBWP } from '../utils/currency.js';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
    description: '',
    category: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    taxAmount: '',
    isReimbursable: false
  });

  useEffect(() => {
    fetchExpenses();
    fetchAccounts();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chart-of-accounts/type/expense', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
      const method = editingExpense ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchExpenses();
        setShowForm(false);
        setEditingExpense(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      accountId: expense.accountId,
      amount: expense.amount,
      description: expense.description,
      category: expense.category || '',
      vendor: expense.vendor || '',
      date: expense.date,
      taxAmount: expense.taxAmount || '',
      isReimbursable: expense.isReimbursable || false
    });
    setShowForm(true);
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchExpenses();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error deleting expense');
    }
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      amount: '',
      description: '',
      category: '',
      vendor: '',
      date: new Date().toISOString().split('T')[0],
      taxAmount: '',
      isReimbursable: false
    });
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

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
          <p style={{ fontSize: '18px', fontWeight: '500' }}>Loading Expense Management...</p>
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
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #404040',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <i className="fas fa-receipt" style={{
              fontSize: '24px',
              color: '#ffc107'
            }}></i>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#ffc107',
                margin: 0
              }}>Expense Tracking</h1>
              <p style={{
                fontSize: '14px',
                color: '#cccccc',
                margin: '4px 0 0 0'
              }}>Record and categorize your business expenses</p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            style={{
              backgroundColor: '#ffc107',
              color: '#1a1a1a',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e6b800'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ffc107'}
          >
            <i className="fas fa-plus"></i>
            Add New Expense
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px'
      }}>
        {/* Summary Cards */}
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
                }}>Total Expenses</p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0
                }}>{formatBWP(totalExpenses)}</p>
                <p style={{
                  fontSize: '12px',
                  color: '#cccccc',
                  margin: '4px 0 0 0'
                }}>This period</p>
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
                }}>Expense Count</p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0
                }}>{expenses.length}</p>
                <p style={{
                  fontSize: '12px',
                  color: '#cccccc',
                  margin: '4px 0 0 0'
                }}>Total transactions</p>
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
                <i className="fas fa-calculator" style={{
                  fontSize: '20px',
                  color: '#1a1a1a'
                }}></i>
              </div>
              <div>
                <p style={{
                  fontSize: '14px',
                  color: '#cccccc',
                  margin: '0 0 4px 0'
                }}>Average Expense</p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0
                }}>
                  {expenses.length > 0 ? formatBWP(totalExpenses / expenses.length) : formatBWP(0)}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: '#cccccc',
                  margin: '4px 0 0 0'
                }}>Per transaction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Form Modal */}
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
                }}>
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingExpense(null);
                    resetForm();
                  }}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Expense Account *</label>
                    <select
                      value={formData.accountId}
                      onChange={(e) => setFormData({...formData, accountId: e.target.value})}
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
                      <option value="">Select Account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
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
                      placeholder="0.00"
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
                    }}>Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
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
                    }}>Vendor</label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData({...formData, vendor: e.target.value})}
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
                      placeholder="Vendor name"
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: '#ffffff'
                  }}>Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                    placeholder="Expense description"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
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
                      <option value="">Select Category</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Travel">Travel</option>
                      <option value="Meals">Meals</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>Tax Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.taxAmount}
                      onChange={(e) => setFormData({...formData, taxAmount: e.target.value})}
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
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="isReimbursable"
                    checked={formData.isReimbursable}
                    onChange={(e) => setFormData({...formData, isReimbursable: e.target.checked})}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: '#ffc107'
                    }}
                  />
                  <label htmlFor="isReimbursable" style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}>
                    This expense is reimbursable
                  </label>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '16px'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingExpense(null);
                      resetForm();
                    }}
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
                    {editingExpense ? 'Update Expense' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expenses Table */}
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
                  }}>Date</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Description</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Vendor</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Category</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Account</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Amount</th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#cccccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #404040'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#2d2d2d' }}>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      color: '#cccccc',
                      fontSize: '16px'
                    }}>
                      No expenses found.{' '}
                      <button
                        onClick={() => setShowForm(true)}
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
                        Add your first expense
                      </button>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} style={{
                      borderBottom: '1px solid #404040',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.closest('tr').style.backgroundColor = '#333'}
                    onMouseOut={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#cccccc'
                        }}>{new Date(expense.date).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#ffffff'
                          }}>{expense.description}</div>
                          {expense.isReimbursable && (
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              fontSize: '10px',
                              backgroundColor: '#007bff',
                              color: '#ffffff',
                              borderRadius: '3px',
                              alignSelf: 'flex-start'
                            }}>
                              Reimbursable
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#cccccc'
                        }}>
                          {expense.vendor || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#cccccc'
                        }}>
                          {expense.category || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#cccccc'
                        }}>
                          {expense.account?.name || 'Unknown'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#dc3545'
                        }}>
                          {formatBWP(expense.amount)}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(expense)}
                            style={{
                              color: '#ffc107',
                              background: 'none',
                              border: 'none',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#e6b800'}
                            onMouseOut={(e) => e.target.style.color = '#ffc107'}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            style={{
                              color: '#dc3545',
                              background: 'none',
                              border: 'none',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#c82333'}
                            onMouseOut={(e) => e.target.style.color = '#dc3545'}
                          >
                            Delete
                          </button>
                        </div>
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

export default Expenses;