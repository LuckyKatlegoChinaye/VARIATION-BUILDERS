import React from 'react';
import { Link } from 'react-router-dom';

const BusinessManagement = () => {
  const businessModules = [
    {
      title: 'Financial Reports',
      description: 'Comprehensive financial statements and business analytics',
      link: '/reports',
      icon: 'fas fa-chart-line',
      color: '#0ea5e9',
      features: ['Profit & Loss', 'Balance Sheet', 'Cash Flow', 'Custom Reports']
    },
    {
      title: 'Customer Management',
      description: 'Complete customer database and relationship management',
      link: '/customers',
      icon: 'fas fa-users',
      color: '#10b981',
      features: ['Customer Database', 'Contact Management', 'Billing', 'Payment Terms']
    },
    {
      title: 'Invoicing & Quotations',
      description: 'Professional invoice creation and quotation management',
      link: '/quotes',
      icon: 'fas fa-file-invoice-dollar',
      color: '#ffc107',
      features: ['Invoice Creation', 'Quotations', 'Payment Tracking', 'Due Management']
    },
    {
      title: 'Inventory Management',
      description: 'Real-time inventory tracking and stock control',
      link: '/inventory',
      icon: 'fas fa-boxes',
      color: '#a855f7',
      features: ['Stock Tracking', 'Low Stock Alerts', 'Inventory Reports', 'Products']
    },
    {
      title: 'Expense Tracking',
      description: 'Business expense recording and categorization',
      link: '/expenses',
      icon: 'fas fa-money-bill-wave',
      color: '#ef4444',
      features: ['Expense Categories', 'Receipts', 'Tax Tracking', 'Reports']
    },
    {
      title: 'Employee Management',
      description: 'Employee database and organizational management',
      link: '/employees',
      icon: 'fas fa-user-tie',
      color: '#06b6d4',
      features: ['Employee Database', 'Positions', 'Contacts', 'Emergency Info']
    },
    {
      title: 'Payroll Processing',
      description: 'Automated payroll calculations and tax processing',
      link: '/payroll',
      icon: 'fas fa-calculator',
      color: '#14b8a6',
      features: ['Payroll Calculator', 'Tax Calculations', 'Direct Deposit', 'History']
    },
    {
      title: 'System Administration',
      description: 'User management and system configuration',
      link: '/system-admin',
      icon: 'fas fa-cogs',
      color: '#6366f1',
      features: ['User Management', 'Categories', 'Settings', 'Data Management']
    }
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #ffc107 100%)',
        color: '#fff',
        padding: '50px 20px',
        textAlign: 'center',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '700',
            marginBottom: '15px',
            letterSpacing: '-0.5px'
          }}>
            <i className="fas fa-briefcase" style={{ marginRight: '15px' }}></i>
            Business Management Suite
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            lineHeight: '1.6',
            marginBottom: '0'
          }}>
            Enterprise-grade accounting and business management platform designed for modern businesses. Manage finances, customers, inventory, and operations in one centralized hub.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '50px'
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', color: '#ffc107', marginBottom: '8px', fontWeight: '700' }}>
              BWP 0.00
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Monthly Revenue
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
              Current month
            </div>
          </div>

          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', color: '#10b981', marginBottom: '8px', fontWeight: '700' }}>
              0
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Active Customers
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
              Total registered
            </div>
          </div>

          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', color: '#0ea5e9', marginBottom: '8px', fontWeight: '700' }}>
              0
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Pending Invoices
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
              Awaiting payment
            </div>
          </div>

          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', color: '#a855f7', marginBottom: '8px', fontWeight: '700' }}>
              0
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Team Members
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
              Active employees
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            Management Modules
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '0',
            margin: '0'
          }}>
            Access all your business management tools organized by function
          </p>
        </div>

        {/* Business Modules Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '50px'
        }}>
          {businessModules.map((module, index) => (
            <Link key={index} to={module.link} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '28px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.transform = 'translateY(-6px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                {/* Icon */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: `${module.color}15`,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <i style={{
                    fontSize: '28px',
                    color: module.color
                  }} className={module.icon}></i>
                </div>

                {/* Title & Description */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1a1a1a',
                  marginBottom: '8px',
                  margin: '0 0 8px 0'
                }}>
                  {module.title}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  marginBottom: '16px',
                  margin: '0 0 16px 0',
                  flex: 1
                }}>
                  {module.description}
                </p>

                {/* Features */}
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {module.features.map((feature, idx) => (
                    <li key={idx} style={{
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      margin: '0 0 6px 0'
                    }}>
                      <i style={{
                        color: module.color,
                        marginRight: '8px',
                        fontSize: '11px',
                        width: '16px'
                      }} className="fas fa-check"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button style={{
                  background: module.color,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginTop: 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}>
                  <i className="fas fa-arrow-right" style={{ marginRight: '6px' }}></i>
                  Open Module
                </button>
              </div>
            </Link>
          ))}
        </div>

        {/* Business Overview Section */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '24px',
            margin: '0 0 24px 0'
          }}>
            <i className="fas fa-chart-pie" style={{ marginRight: '10px', color: '#ffc107' }}></i>
            Business Overview
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                Cash Flow Status
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-check-circle"></i>
                Healthy
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                Outstanding Receivables
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0ea5e9'
              }}>
                BWP 0.00
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                Monthly Expenses
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#ef4444'
              }}>
                BWP 0.00
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div style={{
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              gap: '12px'
            }}>
              <i style={{
                fontSize: '20px',
                color: '#78350f',
                flexShrink: 0
              }} className="fas fa-lightbulb"></i>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#78350f',
                  marginBottom: '4px',
                  fontSize: '14px'
                }}>
                  Pro Tip
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#92400e',
                  marginBottom: '0',
                  margin: '0',
                  lineHeight: '1.5'
                }}>
                  Regularly review your financial reports and cash flow status to maintain a healthy business. Use the financial dashboard to track key metrics and make informed decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessManagement;