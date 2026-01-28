const express = require('express');
const passport = require('passport');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('./dataStore.js');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authMiddleware = require('./middleware/authMiddleware.js');

const app = express();
app.use(express.json());
app.use(passport.initialize());
const path = require('node:path');

// Configure Google Strategy (requires env vars)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback'
  }, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const db = readDB();
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;
    let user = db.users.find(u => u.googleId === profile.id || (email && u.email === email));
    if (!user) {
      user = { id: uuidv4(), name: profile.displayName || '', email: email || '', googleId: profile.id };
      db.users.push(user);
      writeDB(db);
    } else if (!user.googleId) {
      user.googleId = profile.id; // link accounts
      writeDB(db);
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
  }));
} else {
  console.warn('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set — Google OAuth disabled')
}

const authRoutes = require('./routes/auth.js');
const inventoryRoutes = require('./routes/inventory.js');
const quotesRoutes = require('./routes/quotes.js');
const invoicesRoutes = require('./routes/invoices.js');
const uploadsRoutes = require('./routes/uploads.js');
const categoriesRoutes = require('./routes/categories.js');
const customersRoutes = require('./routes/customers.js');
const chartOfAccountsRoutes = require('./routes/chart-of-accounts.js');
const expensesRoutes = require('./routes/expenses.js');
const reportsRoutes = require('./routes/reports.js');
const employeesRoutes = require('./routes/employees.js');
const payrollRoutes = require('./routes/payroll.js');
const bankingRoutes = require('./routes/banking.js');

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/chart-of-accounts', chartOfAccountsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/banking', bankingRoutes);
const usersRoutes = require('./routes/users.js');
const shopsRoutes = require('./routes/shops.js');

app.use('/api/users', usersRoutes);
app.use('/api/shops', shopsRoutes);

// Serve static public files (including uploaded images)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.json({ message: 'Variation Builders API - server running' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
