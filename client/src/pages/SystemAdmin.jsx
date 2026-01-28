import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatBWP } from '../utils/currency.js';

const SystemAdmin = () => {
  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [systemSettings, setSystemSettings] = useState({});
  
  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    status: 'active'
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'folder'
  });

  const token = localStorage.getItem('token');

  // Fetch all data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      const [usersRes, categoriesRes] = await Promise.all([
        fetch('/api/users', { headers }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/categories', { headers }).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      setUsers(usersRes.data || []);
      setCategories(categoriesRes.data || []);
      
      // Calculate system stats
      calculateStats();
      
      // Load system settings from localStorage
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        setSystemSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    setSystemStats({
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      totalCategories: categories.length,
      systemUptime: '99.9%',
      lastBackup: new Date().toLocaleDateString()
    });
  };

  // User Management Functions
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, userForm, { headers });
      } else {
        await axios.post('/api/users', userForm, { headers });
      }
      fetchData();
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'employee', status: 'active' });
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/users/${userId}`, { headers });
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setShowUserForm(true);
  };

  // Category Management Functions
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory.id}`, categoryForm, { headers });
      } else {
        await axios.post('/api/categories', categoryForm, { headers });
      }
      fetchData();
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', icon: 'folder' });
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/categories/${categoryId}`, { headers });
      fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description,
      icon: category.icon
    });
    setShowCategoryForm(true);
  };

  // Settings Management
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
    alert('System settings saved successfully');
    setShowSettingsForm(false);
  };

  // Data Management Functions
  const handleExportData = () => {
    const dataToExport = {
      users,
      categories,
      exportDate: new Date().toISOString()
    };
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2)));
    element.setAttribute('download', 'system_backup.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.users) setUsers(data.users);
        if (data.categories) setCategories(data.categories);
        alert('Data imported successfully');
        fetchData();
      } catch (error) {
        alert('Error importing data');
      }
    };
    reader.readAsText(file);
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
          <p style={{ fontSize: '18px', fontWeight: '500' }}>Loading System Administration...</p>
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
      {/* Main Container */}
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
                <i className="fas fa-cog" style={{
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
                }}>System Administration</h1>
                <p style={{
                  fontSize: '13px',
                  color: '#b0b0b0',
                  margin: '4px 0 0 0'
                }}>Manage users, categories, settings, and system configuration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          padding: '0 24px',
          position: 'sticky',
          top: '80px',
          zIndex: 9
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            gap: '0'
          }}>
            {[
              { id: 'overview', label: 'Business Overview', icon: 'chart-line' },
              { id: 'users', label: 'User Management', icon: 'users' },
              { id: 'categories', label: 'Categories', icon: 'folder' },
              { id: 'settings', label: 'Settings', icon: 'sliders-h' },
              { id: 'data', label: 'Data Management', icon: 'database' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 20px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? '#ffc107' : 'transparent',
                  color: activeTab === tab.id ? '#1a1a1a' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  borderBottom: activeTab === tab.id ? '3px solid #ffc107' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className={`fas fa-${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '32px 24px'
        }}>
          {/* Business Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '24px'
              }}>Business Overview</h2>
              
              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
              }}>
                {[
                  { label: 'Total Users', value: systemStats.totalUsers || 0, icon: 'users', color: '#007bff' },
                  { label: 'Active Users', value: systemStats.activeUsers || 0, icon: 'user-check', color: '#28a745' },
                  { label: 'Admin Users', value: systemStats.adminUsers || 0, icon: 'shield-alt', color: '#ffc107' },
                  { label: 'Total Categories', value: systemStats.totalCategories || 0, icon: 'folder', color: '#6f42c1' },
                  { label: 'System Uptime', value: systemStats.systemUptime || '99.9%', icon: 'heartbeat', color: '#dc3545' },
                  { label: 'Last Backup', value: systemStats.lastBackup || 'Never', icon: 'save', color: '#17a2b8' }
                ].map((stat, idx) => (
                  <div key={idx} style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                    onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: stat.color,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}>
                        <i className={`fas fa-${stat.icon}`} style={{ fontSize: '24px' }}></i>
                      </div>
                      <div>
                        <p style={{
                          margin: 0,
                          fontSize: '12px',
                          color: '#999',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>{stat.label}</p>
                        <p style={{
                          margin: '4px 0 0 0',
                          fontSize: '28px',
                          fontWeight: '700',
                          color: '#1a1a1a'
                        }}>{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: 0
                }}>User Management</h2>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setUserForm({ name: '', email: '', password: '', role: 'employee', status: 'active' });
                    setShowUserForm(true);
                  }}
                  style={{
                    backgroundColor: '#ffc107',
                    color: '#1a1a1a',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#ffb300'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#ffc107'}
                >
                  <i className="fas fa-plus-circle"></i>
                  Add User
                </button>
              </div>

              {/* User Form Modal */}
              {showUserForm && (
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}>{editingUser ? 'Edit User' : 'Add New User'}</h3>
                  <form onSubmit={handleAddUser}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Name</label>
                        <input
                          type="text"
                          value={userForm.name}
                          onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
                        <input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                          required
                        />
                      </div>
                      {!editingUser && (
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Default Password *</label>
                          <input
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            placeholder="Enter default password"
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                            required
                          />
                          <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>User can change after login</small>
                        </div>
                      )}
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Role</label>
                        <select
                          value={userForm.role}
                          onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="admin">Admin - Full System Access</option>
                          <option value="cashier">Cashier - POS & Sales</option>
                          <option value="manager">Manager - Business Operations</option>
                          <option value="employee">Employee - Staff Member</option>
                          <option value="customer">Customer - Regular User</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Status</label>
                        <select
                          value={userForm.status}
                          onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          <option>active</option>
                          <option>inactive</option>
                          <option>suspended</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="submit"
                        style={{
                          backgroundColor: '#28a745',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {editingUser ? 'Update' : 'Create'} User
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUserForm(false)}
                        style={{
                          backgroundColor: '#6c757d',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Users Table */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        {['Name', 'Email', 'Role', 'Status', 'Actions'].map(header => (
                          <th key={header} style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#666',
                            textTransform: 'uppercase',
                            borderBottom: '1px solid #e0e0e0'
                          }}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} style={{
                          borderBottom: '1px solid #e0e0e0',
                          transition: 'background-color 0.2s'
                        }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '16px', color: '#1a1a1a' }}>{user.name}</td>
                          <td style={{ padding: '16px', color: '#666' }}>{user.email}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: user.role === 'admin' ? '#ffc107' : '#e9ecef',
                              color: user.role === 'admin' ? '#1a1a1a' : '#666',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>{user.role}</span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: user.status === 'active' ? '#d4edda' : '#f8d7da',
                              color: user.status === 'active' ? '#155724' : '#721c24',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>{user.status}</span>
                          </td>
                          <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleEditUser(user)}
                              style={{
                                backgroundColor: '#007bff',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              style={{
                                backgroundColor: '#dc3545',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: 0
                }}>Categories</h2>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '', icon: 'folder' });
                    setShowCategoryForm(true);
                  }}
                  style={{
                    backgroundColor: '#ffc107',
                    color: '#1a1a1a',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#ffb300'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#ffc107'}
                >
                  <i className="fas fa-plus-circle"></i>
                  Add Category
                </button>
              </div>

              {/* Category Form Modal */}
              {showCategoryForm && (
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
                  <form onSubmit={handleAddCategory}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Category Name</label>
                        <input
                          type="text"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Icon</label>
                        <input
                          type="text"
                          value={categoryForm.icon}
                          onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                          placeholder="e.g., folder, box, cube"
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                      <textarea
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px',
                          minHeight: '80px',
                          fontFamily: 'inherit'
                        }}
                      ></textarea>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="submit"
                        style={{
                          backgroundColor: '#28a745',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {editingCategory ? 'Update' : 'Create'} Category
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCategoryForm(false)}
                        style={{
                          backgroundColor: '#6c757d',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Categories Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {categories.map(category => (
                  <div key={category.id} style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                    onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#ffc107',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1a1a1a'
                      }}>
                        <i className={`fas fa-${category.icon || 'folder'}`}></i>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{category.name}</h4>
                    </div>
                    <p style={{
                      margin: '0 0 16px 0',
                      color: '#666',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>{category.description}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditCategory(category)}
                        style={{
                          flex: 1,
                          backgroundColor: '#007bff',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        style={{
                          flex: 1,
                          backgroundColor: '#dc3545',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '24px'
              }}>System Settings</h2>

              {/* Settings Form */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <form onSubmit={handleSaveSettings}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company Name</label>
                    <input
                      type="text"
                      value={systemSettings.companyName || ''}
                      onChange={(e) => setSystemSettings({ ...systemSettings, companyName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>System Email</label>
                    <input
                      type="email"
                      value={systemSettings.systemEmail || ''}
                      onChange={(e) => setSystemSettings({ ...systemSettings, systemEmail: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Phone Number</label>
                    <input
                      type="tel"
                      value={systemSettings.phoneNumber || ''}
                      onChange={(e) => setSystemSettings({ ...systemSettings, phoneNumber: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Address</label>
                    <textarea
                      value={systemSettings.address || ''}
                      onChange={(e) => setSystemSettings({ ...systemSettings, address: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        minHeight: '80px',
                        fontFamily: 'inherit'
                      }}
                    ></textarea>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={systemSettings.maintenanceMode || false}
                        onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                      />
                      <span style={{ fontWeight: '500' }}>Maintenance Mode</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="submit"
                      style={{
                        backgroundColor: '#28a745',
                        color: '#ffffff',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Save Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '24px'
              }}>Data Management</h2>

              {/* Data Management Actions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {/* Export Data */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '24px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: '#28a745',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: '16px'
                  }}>
                    <i className="fas fa-download"></i>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Export Data</h3>
                  <p style={{ color: '#666', marginBottom: '16px' }}>Download system data as JSON backup file</p>
                  <button
                    onClick={handleExportData}
                    style={{
                      width: '100%',
                      backgroundColor: '#28a745',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Export Now
                  </button>
                </div>

                {/* Import Data */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '24px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: '#007bff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: '16px'
                  }}>
                    <i className="fas fa-upload"></i>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Import Data</h3>
                  <p style={{ color: '#666', marginBottom: '16px' }}>Upload previously exported JSON backup file</p>
                  <label style={{
                    width: '100%',
                    display: 'block',
                    backgroundColor: '#007bff',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      style={{ display: 'none' }}
                    />
                    Import Now
                  </label>
                </div>

                {/* Clear Cache */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '24px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: '#ffc107',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1a1a1a',
                    marginBottom: '16px'
                  }}>
                    <i className="fas fa-trash-alt"></i>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Clear Cache</h3>
                  <p style={{ color: '#666', marginBottom: '16px' }}>Clear system cache to free up memory</p>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      alert('Cache cleared successfully');
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#ffc107',
                      color: '#1a1a1a',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SystemAdmin;
