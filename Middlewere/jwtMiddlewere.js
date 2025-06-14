const jwt = require('jsonwebtoken');
const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (req.url.includes('/login') || (req.url.includes('/create-user') && !token) || req.url.includes('/verify')) {
    next();
    return;
  }
  if (!token) {
    return res.status(401).json({ status: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    return res.status(401).json({ status: false, message: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
