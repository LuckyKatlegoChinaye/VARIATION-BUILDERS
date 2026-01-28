const { verifyToken } = require('../utils/jwt');

/**
 * Authentication middleware - Verify JWT token
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided' 
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        message: 'Invalid or expired token' 
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Authentication failed',
      error: error.message 
    });
  }
};

/**
 * Role-based access control middleware
 * Usage: roleMiddleware(['ADMIN', 'CASHIER'])
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    // Normalize role to uppercase for comparison
    const userRole = req.user.role?.toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
    
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        requiredRole: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Shop access middleware - Verify user has access to the shop
 * Ensures cashiers can only access their assigned shop
 */
const shopAccessMiddleware = (req, res, next) => {
  const shopId = req.params.shopId || req.body.shopId;
  
  if (!shopId) {
    return res.status(400).json({ 
      message: 'Shop ID is required' 
    });
  }

  // ADMIN can access all shops
  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  // CASHIER can only access their assigned shop
  if (req.user.role === 'CASHIER') {
    if (req.user.shopId !== shopId) {
      return res.status(403).json({ 
        message: 'You do not have access to this shop' 
      });
    }
  }

  // CUSTOMER cannot access shop operations
  if (req.user.role === 'CUSTOMER') {
    return res.status(403).json({ 
      message: 'Customers do not have access to shop operations' 
    });
  }

  next();
};

/**
 * Permission middleware - Check specific permissions
 */
const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    const rolePermissions = {
      ADMIN: [
        'manage_shops',
        'manage_products',
        'manage_users',
        'view_reports',
        'manage_quotations',
        'manage_expenses',
      ],
      CASHIER: [
        'process_sales',
        'view_inventory',
        'manage_quotations',
      ],
      CUSTOMER: [
        'view_products',
        'request_quotation',
      ],
    };

    const userPermissions = rolePermissions[req.user.role] || [];

    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({ 
        message: 'You do not have permission to perform this action',
        requiredPermission 
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  shopAccessMiddleware,
  permissionMiddleware,
};
