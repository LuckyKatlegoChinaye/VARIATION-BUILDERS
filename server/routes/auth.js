const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../dataStore');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const db = readDB();
  if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'User exists' });

  const hash = await bcrypt.hash(password, 8);
  const user = { id: uuidv4(), name: name || '', email, passwordHash: hash, role: 'user' };
  db.users.push(user);
  writeDB(db);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role.toUpperCase() }, JWT_SECRET);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role.toUpperCase() }, JWT_SECRET);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

// Create or promote user to admin (requires admin secret)
router.post('/create-admin', async (req, res) => {
  const { email, password, adminSecret } = req.body;
  
  // Security: Check admin secret key
  if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  
  try {
    const db = readDB();
    
    // Check if user exists
    let user = db.users.find(u => u.email === email);
    
    if (!user) {
      const hash = await bcrypt.hash(password, 8);
      user = { 
        id: uuidv4(), 
        name: email.split('@')[0] || 'Admin User', 
        email, 
        passwordHash: hash,
        role: 'admin'
      };
      db.users.push(user);
    } else {
      // Make existing user admin
      user.role = 'admin';
    }
    
    writeDB(db);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role.toUpperCase() }, JWT_SECRET);
    res.json({ message: 'Admin user created/updated successfully', user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Google OAuth routes (only when Google is configured)
const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
if (googleEnabled) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/?error=google' }), (req, res) => {
    // successful auth, issue JWT and redirect to client with token
    const token = jwt.sign({ id: req.user.id, email: req.user.email, role: (req.user.role || 'user').toUpperCase() }, JWT_SECRET);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    // Redirect with token as query param (for development). Frontend should read and store.
    res.redirect(`${clientUrl}/?token=${token}`);
  });
} else {
  router.get('/google', (_req, res) => res.status(501).json({ error: 'Google OAuth not configured on server' }));
  router.get('/google/callback', (_req, res) => res.status(501).json({ error: 'Google OAuth not configured on server' }));
}

module.exports = router;
