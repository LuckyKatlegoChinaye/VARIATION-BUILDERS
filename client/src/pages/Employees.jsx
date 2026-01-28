import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatBWP } from '../utils/currency.js';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    hireDate: '',
    position: '',
    department: '',
    salary: '',
    hourlyRate: '',
    payType: 'salary',
    taxId: '',
    bankAccount: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchEmployees();
        setShowForm(false);
        setEditingEmployee(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error saving employee');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      address: employee.address || '',
      hireDate: employee.hireDate,
      position: employee.position || '',
      department: employee.department || '',
      salary: employee.salary || '',
      hourlyRate: employee.hourlyRate || '',
      payType: employee.payType || 'salary',
      taxId: employee.taxId || '',
      bankAccount: employee.bankAccount || '',
      emergencyContact: employee.emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchEmployees();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error deleting employee');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      hireDate: '',
      position: '',
      department: '',
      salary: '',
      hourlyRate: '',
      payType: 'salary',
      taxId: '',
      bankAccount: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    });
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', marginBottom: '20px', color: '#ffc107' }}></i>
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1a1a1a',
        color: '#ffc107',
        padding: '20px',
        borderBottom: '3px solid #ffc107'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              margin: 0,
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-users" style={{ marginRight: '15px' }}></i>
              Employee Management
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '16px' }}>
              Manage your employee database and payroll information
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link
              to="/admin"
              style={{
                backgroundColor: '#333',
                color: '#ffc107',
                padding: '10px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
              Back to Admin
            </Link>
            <button
              onClick={() => setShowForm(true)}
              style={{
                backgroundColor: '#ffc107',
                color: '#1a1a1a',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
              Add Employee
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #ffc107'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <i className="fas fa-users" style={{
                fontSize: '24px',
                color: '#ffc107',
                marginRight: '15px'
              }}></i>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 5px 0'
                }}>
                  Total Employees
                </h3>
                <p style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  margin: 0
                }}>
                  {employees.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #28a745'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <i className="fas fa-user-check" style={{
                fontSize: '24px',
                color: '#28a745',
                marginRight: '15px'
              }}></i>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 5px 0'
                }}>
                  Active
                </h3>
                <p style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  margin: 0
                }}>
                  {employees.filter(emp => emp.status !== 'inactive').length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #17a2b8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <i className="fas fa-building" style={{
                fontSize: '24px',
                color: '#17a2b8',
                marginRight: '15px'
              }}></i>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 5px 0'
                }}>
                  Departments
                </h3>
                <p style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  margin: 0
                }}>
                  {new Set(employees.map(emp => emp.department).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: 0,
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-list" style={{ marginRight: '10px', color: '#ffc107' }}></i>
              Employee Directory
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#666',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    Employee
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#666',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    Position
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#666',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    Department
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#666',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    Pay Rate
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#666',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '15px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#666',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '16px'
                    }}>
                      <i className="fas fa-users" style={{
                        fontSize: '48px',
                        marginBottom: '20px',
                        opacity: 0.5,
                        color: '#ffc107'
                      }}></i>
                      <p>No employees found. <button
                        onClick={() => setShowForm(true)}
                        style={{
                          color: '#ffc107',
                          textDecoration: 'underline',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >Add your first employee</button></p>
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} style={{
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.closest('tr').style.backgroundColor = '#f8f9fa'}
                    onMouseOut={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#ffc107',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#1a1a1a',
                            fontWeight: 'bold',
                            marginRight: '12px',
                            fontSize: '16px'
                          }}>
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                          </div>
                          <div>
                            <div style={{
                              fontWeight: '600',
                              color: '#1a1a1a',
                              fontSize: '14px'
                            }}>
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div style={{
                              color: '#666',
                              fontSize: '12px'
                            }}>
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px', color: '#666' }}>
                        {employee.position || '-'}
                      </td>
                      <td style={{ padding: '15px', color: '#666' }}>
                        {employee.department || '-'}
                      </td>
                      <td style={{ padding: '15px', fontWeight: '600', color: '#1a1a1a' }}>
                        {employee.payType === 'salary'
                          ? `${formatBWP(employee.salary || 0)}/year`
                          : `${formatBWP(employee.hourlyRate || 0)}/hour`
                        }
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: employee.status === 'active' ? '#d4edda' : '#f8d7da',
                          color: employee.status === 'active' ? '#155724' : '#721c24'
                        }}>
                          {employee.status || 'active'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(employee)}
                            style={{
                              backgroundColor: '#ffc107',
                              color: '#1a1a1a',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            <i className="fas fa-trash"></i>
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

        {/* Employee Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <i className="fas fa-user-plus" style={{ marginRight: '10px', color: '#ffc107' }}></i>
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingEmployee(null); resetForm(); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                {/* Personal Information */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="fas fa-id-card" style={{ marginRight: '8px', color: '#ffc107' }}></i>
                    Personal Information
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '15px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '5px'
                    }}>
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>

                {/* Employment Information */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="fas fa-briefcase" style={{ marginRight: '8px', color: '#ffc107' }}></i>
                    Employment Information
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '15px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Hire Date *
                      </label>
                      <input
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Position
                      </label>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Pay Type
                      </label>
                      <select
                        value={formData.payType}
                        onChange={(e) => setFormData({...formData, payType: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="salary">Salary</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>
                    {formData.payType === 'salary' ? (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1a1a1a',
                          marginBottom: '5px'
                        }}>
                          Annual Salary
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.salary}
                          onChange={(e) => setFormData({...formData, salary: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    ) : (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1a1a1a',
                          marginBottom: '5px'
                        }}>
                          Hourly Rate
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#ffc107' }}></i>
                    Additional Information
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '15px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Tax ID
                      </label>
                      <input
                        type="text"
                        value={formData.taxId}
                        onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Bank Account
                      </label>
                      <input
                        type="text"
                        value={formData.bankAccount}
                        onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="fas fa-phone" style={{ marginRight: '8px', color: '#ffc107' }}></i>
                    Emergency Contact
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: {...formData.emergencyContact, name: e.target.value}
                        })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContact.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: {...formData.emergencyContact, phone: e.target.value}
                        })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '5px'
                      }}>
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact.relationship}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: {...formData.emergencyContact, relationship: e.target.value}
                        })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '15px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingEmployee(null); resetForm(); }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#f8f9fa',
                      color: '#666',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#ffc107',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    {editingEmployee ? 'Update Employee' : 'Add Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;