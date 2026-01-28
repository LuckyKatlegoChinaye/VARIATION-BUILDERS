require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Try to load routes if Prisma is ready
let routesLoaded = false;
try {
  const authRoutes = require('./routes/authMock');
  const inventoryRoutes = require('./routes/inventory');
  const productsRoutes = require('./routes/products');
  const payrollRoutes = require('./routes/payroll');
  const bankingRoutes = require('./routes/banking');
  const usersRoutes = require('./routes/users');
  const employeesRoutes = require('./routes/employees');
  const expensesRoutes = require('./routes/expenses');
  const customersRoutes = require('./routes/customers');
  const invoicesRoutes = require('./routes/invoices');
  const quotesRoutes = require('./routes/quotes');
  const shopsRoutes = require('./routes/shops');
  const categoriesRoutes = require('./routes/categories');
  const reportsRoutes = require('./routes/reports');
  const chartOfAccountsRoutes = require('./routes/chart-of-accounts');
  const posRoutes = require('./routes/posRBAC');
  const adminRoutes = require('./routes/admin');
  const adminSettingsRoutes = require('./routes/adminSettings');
  
  app.use('/api/auth', authRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/payroll', payrollRoutes);
  app.use('/api/banking', bankingRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/employees', employeesRoutes);
  app.use('/api/expenses', expensesRoutes);
  app.use('/api/customers', customersRoutes);
  app.use('/api/invoices', invoicesRoutes);
  app.use('/api/quotes', quotesRoutes);
  app.use('/api/shops', shopsRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/chart-of-accounts', chartOfAccountsRoutes);
  app.use('/api', posRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin/settings', adminSettingsRoutes);
  
  routesLoaded = true;
  console.log('✅ Auth routes loaded');
  console.log('✅ Inventory routes loaded');
  console.log('✅ Products routes loaded');
  console.log('✅ Payroll routes loaded');
  console.log('✅ Banking routes loaded');
  console.log('✅ Users/Employees routes loaded');
  console.log('✅ Expenses routes loaded');
  console.log('✅ Customers routes loaded');
  console.log('✅ Invoices routes loaded');
  console.log('✅ Quotes routes loaded');
  console.log('✅ Shops routes loaded');
  console.log('✅ Categories routes loaded');
  console.log('✅ Reports routes loaded');
  console.log('✅ POS/Void/Return routes loaded');
  console.log('✅ Admin routes loaded');
  console.log('✅ Admin Settings routes loaded');
} catch (err) {
  console.log('⚠️  Route loading failed:', err.message);
  console.log(err.stack);
}

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
    message: 'Shop Management System API v1.0',
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/profile',
        'PUT /api/auth/profile',
        'POST /api/auth/change-password'
      ],
      shops: [
        'GET /api/shops',
        'GET /api/shops/:id',
        'POST /api/shops',
        'PUT /api/shops/:id',
        'DELETE /api/shops/:id',
        'GET /api/shops/:id/dashboard'
      ],
      products: [
        'GET /api/products',
        'GET /api/products/:id',
        'POST /api/products',
        'PUT /api/products/:id',
        'DELETE /api/products/:id',
        'GET /api/products/low-stock/:shopId'
      ],
      sales: [
        'GET /api/sales',
        'GET /api/sales/:id',
        'POST /api/sales',
        'POST /api/sales/:id/cancel',
        'GET /api/sales/reports/daily/:shopId'
      ],
      quotations: [
        'GET /api/quotations',
        'GET /api/quotations/:id',
        'POST /api/quotations',
        'PUT /api/quotations/:id',
        'POST /api/quotations/:id/accept',
        'POST /api/quotations/:id/reject'
      ],
      expenses: [
        'GET /api/expenses',
        'GET /api/expenses/:id',
        'POST /api/expenses',
        'PUT /api/expenses/:id',
        'DELETE /api/expenses/:id',
        'GET /api/expenses/summary/:shopId'
      ]
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n✅ Shop Management System API`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\n🎯 Frontend: http://localhost:5173`);
  console.log(`\nTest Credentials:`);
  console.log(`  Admin:    admin@vb.co.bw / 4040@M`);
  console.log(`  Cashier:  cashier1@example.com / cashier123`);
  console.log(`  Customer: customer@example.com / customer123\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Server shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
