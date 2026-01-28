const { readDB } = require('../dataStore.js');

function adminMiddleware(req, res, next) {
  // authMiddleware should have already set req.user
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'No token' });
  const db = readDB();
  const found = db.users.find(u => u.id === user.id);
  if (!found) return res.status(401).json({ error: 'Invalid token' });
  if (found.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  req.currentUser = found;
  next();
}

module.exports = adminMiddleware;
