import React, { useState, useEffect } from 'react';
import { formatBWP } from '../utils/currency.js';

const Banking = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importData, setImportData] = useState({ accountId: '', transactions: [] });
  // Fixed structure

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/banking/accounts', {
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

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/banking/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    // Form handling would go here
    setShowAccountForm(false);
  };

  const handleImportTransactions = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/banking/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(importData)
      });

      if (response.ok) {
        fetchTransactions();
        setShowImportForm(false);
        setImportData({ accountId: '', transactions: [] });
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error importing transactions:', error);
      alert('Error importing transactions');
    }
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
          <p style={{ fontSize: '18px', fontWeight: '500' }}>Loading Banking Management...</p>
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
    <>
      {/* Outer Container */}
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
                <i className="fas fa-bank" style={{
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
                }}>Banking & Reconciliation</h1>
                <p style={{
                  fontSize: '13px',
                  color: '#b0b0b0',
                  margin: '4px 0 0 0'
                }}>Manage accounts, track transactions, and reconcile balances</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowAccountForm(true)}
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
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 6px rgba(255, 193, 7, 0.3)'
                }}
                onMouseOver={(e) => e.target.style.background = '#ffb300'}
                onMouseOut={(e) => e.target.style.background = '#ffc107'}
              >
                <i className="fas fa-plus-circle"></i>
                New Account
              </button>
              <button
                onClick={() => setShowImportForm(true)}
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
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
              >
                <i className="fas fa-file-upload"></i>
                Import Transactions
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
          {/* Bank Accounts Section */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#ffc107',
              marginBottom: '16px'
            }}>Bank Accounts</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {accounts.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    color: '#b0b0b0',
                    fontSize: '16px',
                    marginBottom: '20px'
                  }}>
                    No bank accounts found.
                  </p>
                  <button
                    onClick={() => setShowAccountForm(true)}
                    style={{
                      backgroundColor: '#ffc107',
                      color: '#1a1a1a',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e6b800'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#ffc107'}
                  >
                    Add Your First Account
                  </button>
                </div>
              ) : (
                accounts.map((account) => (
                  <div key={account.id} style={{
                    backgroundColor: '#2d2d2d',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#ffffff',
                          margin: 0
                        }}>{account.name}</h3>
                        <p style={{
                          color: '#cccccc',
                          fontSize: '14px',
                          margin: '4px 0'
                        }}>{account.bankName}</p>
                        <p style={{
                          color: '#cccccc',
                          fontSize: '14px',
                          margin: 0
                        }}>****{account.accountNumber?.slice(-4)}</p>
                      </div>
                      <span style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        borderRadius: '4px',
                        backgroundColor: account.accountType === 'Checking' ? '#007bff' :
                                        account.accountType === 'Savings' ? '#28a745' : '#6f42c1',
                        color: '#ffffff'
                      }}>
                        {account.accountType}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#28a745'
                    }}>
                      {formatBWP(account.balance || 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#ffc107',
              marginBottom: '16px'
            }}>Bank Transactions</h2>
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
                      }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr style={{ borderBottom: '1px solid #404040' }}>
                        <td colSpan="4" style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#cccccc'
                        }}>
                          <i className="fas fa-inbox" style={{
                            fontSize: '40px',
                            marginBottom: '16px',
                            opacity: 0.5
                          }}></i>
                          <p>No transactions found</p>
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => (
                        <tr key={transaction.id} style={{
                          borderBottom: '1px solid #404040',
                          transition: 'background-color 0.2s'
                        }}
                          onMouseOver={(e) => e.target.closest('tr').style.backgroundColor = '#333'}
                          onMouseOut={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '16px 24px', color: '#cccccc' }}>{transaction.date}</td>
                          <td style={{ padding: '16px 24px', color: '#cccccc' }}>{transaction.description}</td>
                          <td style={{
                            padding: '16px 24px',
                            fontSize: '14px',
                            color: transaction.amount > 0 ? '#28a745' : '#dc3545',
                            fontWeight: '500'
                          }}>
                            {transaction.amount > 0 ? '+' : ''}{formatBWP(transaction.amount)}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              backgroundColor: transaction.status === 'cleared' ? '#28a745' : '#ffc107',
                              color: '#1a1a1a',
                              fontWeight: '500'
                            }}>
                              {transaction.status}
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
      </div>
    </>
  );
};

// Banking Module - Fixed
export default Banking;
