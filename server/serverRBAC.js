require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('./routes/authNewRBAC');
const shopsRoutes = require('./routes/shopsRBAC');
const productsRoutes = require('./routes/productsRBAC');
const salesRoutes = require('./routes/salesRBAC');
const quotationsRoutes = require('./routes/quotationsRBAC');
const expensesRoutes = require('./routes/expensesRBAC');
const payrollRoutes = require('./routes/payroll');
const bankingRoutes = require('./routes/banking');
const usersRoutes = require('./routes/users');
const employeesRoutes = require('./routes/employees');
const customersRoutes = require('./routes/customers');
const invoicesRoutes = require('./routes/invoices');
const quotesRoutes = require('./routes/quotes');
const categoriesRoutes = require('./routes/categories');
const reportsRoutes = require('./routes/reports');
const inventoryRoutes = require('./routes/inventory');
const chartOfAccountsRoutes = require('./routes/chart-of-accounts');

// Initialize Express and Prisma
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/chart-of-accounts', chartOfAccountsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Shop Management System API is running',
    timestamp: new Date()
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: process.env.APP_NAME || 'Shop Management System',
    version: process.env.APP_VERSION || '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        getProfile: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/update-profile',
        changePassword: 'POST /api/auth/change-password'
      },
      shops: {
        getAll: 'GET /api/shops',
        getOne: 'GET /api/shops/:id',
        create: 'POST /api/shops',
        update: 'PUT /api/shops/:id',
        delete: 'DELETE /api/shops/:id',
        assignCashier: 'POST /api/shops/:id/assign-cashier',
        getDashboard: 'GET /api/shops/:id/dashboard'
      },
      products: {
        getAll: 'GET /api/products',
        getOne: 'GET /api/products/:id',
        create: 'POST /api/products',
        update: 'PUT /api/products/:id',
        delete: 'DELETE /api/products/:id',
        updateInventory: 'PUT /api/products/:id/inventory',
        getLowStock: 'GET /api/products/inventory/low-stock/:shopId'
      },
      sales: {
        getAll: 'GET /api/sales',
        getOne: 'GET /api/sales/:id',
        create: 'POST /api/sales',
        cancel: 'PUT /api/sales/:id/cancel',
        getDailyReport: 'GET /api/sales/reports/daily/:shopId'
      },
      quotations: {
        getAll: 'GET /api/quotations',
        getOne: 'GET /api/quotations/:id',
        create: 'POST /api/quotations',
        update: 'PUT /api/quotations/:id',
        accept: 'PUT /api/quotations/:id/accept',
        reject: 'PUT /api/quotations/:id/reject'
      },
      expenses: {
        getAll: 'GET /api/expenses',
        getOne: 'GET /api/expenses/:id',
        create: 'POST /api/expenses',
        update: 'PUT /api/expenses/:id',
        delete: 'DELETE /api/expenses/:id',
        getSummary: 'GET /api/expenses/reports/summary/:shopId'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path
  });
});

// Start server
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connection successful');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║     Shop Management System API Server                          ║
║     ${new Date().toLocaleString()}
║     Server: http://localhost:${PORT}                             ║
║     Health: http://localhost:${PORT}/api/health                  ║
║     Docs: http://localhost:${PORT}/api/docs                      ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

module.exports = app;
