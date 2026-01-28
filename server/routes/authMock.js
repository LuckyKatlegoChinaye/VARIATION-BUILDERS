const express = require('express');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const router = express.Router();
const { readDB } = require('../dataStore.js');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

// Proper JWT token generation
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
};

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Login endpoint - uses database users
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For demo/mock, allow any password for now to test the system
    // In production, properly verify with bcrypt
    let passwordMatch = false;
    
    // Hardcoded demo credentials
    if (email === 'admin@vb.co.bw' && password === '4040@M') {
      passwordMatch = true;
    } else if (email === 'cashier1@example.com' && password === 'cashier123') {
      passwordMatch = true;
    } else if (user.passwordHash) {
      // Try bcrypt verification for other users
      try {
        passwordMatch = await bcryptjs.compare(password, user.passwordHash);
      } catch (err) {
        passwordMatch = false;
      }
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get profile endpoint
router.get('/profile', verifyToken, (req, res) => {
  try {
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile endpoint
router.put('/profile', verifyToken, (req, res) => {
  try {
    const { name } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password endpoint
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify old password
    let passwordMatch = false;
    if (user.passwordHash) {
      try {
        passwordMatch = await bcryptjs.compare(oldPassword, user.passwordHash);
      } catch (err) {
        // If bcrypt fails, allow for demo purposes
        passwordMatch = true;
      }
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newHash = await bcryptjs.hash(newPassword, 8);
    user.passwordHash = newHash;
    
    writeDB(db);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
