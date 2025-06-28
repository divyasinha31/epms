// server.js - Custom JSON Server with authentication
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Secret key for JWT (use environment variable in production)
const JWT_SECRET = 'your-secret-key-here';
const REFRESH_SECRET = 'your-refresh-secret-key-here';

// Enable CORS
server.use(cors());
server.use(middlewares);
server.use(jsonServer.bodyParser);

console.log('Testing module imports...');
try {
  const jsonServer = require('json-server');
  console.log('json-server loaded');
  
  const jwt = require('jsonwebtoken');
  console.log('jsonwebtoken loaded');
  
  const cors = require('cors');
  console.log('cors loaded');
  
  console.log('All modules loaded successfully!');
  
} catch (error) {
  console.error('Module loading failed:', error.message);
}

// Helper function to generate tokens
function generateTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  
  return { token, refreshToken };
}

// Helper function to verify token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Auth middleware
function authMiddleware(req, res, next) {
  // Skip auth for login and refresh endpoints
  if (req.path === '/auth/login' || req.path === '/auth/refresh') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

// Apply auth middleware to API routes
server.use('/api', authMiddleware);

// Login endpoint
server.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const db = router.db;
  const user = db.get('users').find({ email }).value();
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // For demo purposes, we'll accept any password that matches these patterns
  const validPasswords = ['admin123', 'manager123', 'developer123'];
  
  if (!validPasswords.includes(password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return res.status(401).json({ message: 'Account is deactivated' });
  }

  const tokens = generateTokens(user);
  
  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    user: userWithoutPassword,
    token: tokens.token,
    refreshToken: tokens.refreshToken
  });
});

// Refresh token endpoint
server.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const db = router.db;
    const user = db.get('users').find({ id: decoded.id }).value();
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user);
    
    res.json({
      token: tokens.token,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Custom routes for better API structure
server.use('/api', router);

// Rewrite routes to add /api prefix
server.use(jsonServer.rewriter({
  '/api/*': '/$1'
}));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  console.log('-------------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('Admin: admin@epms.com / admin123');
  console.log('PM: pm@epms.com / manager123');
  console.log('Dev: dev@epms.com / developer123');
});