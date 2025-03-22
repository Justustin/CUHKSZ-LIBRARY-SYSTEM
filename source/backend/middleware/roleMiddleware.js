// backend/middleware/roleMiddleware.js

const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
      if (req.user.role !== requiredRole) {
          return res.status(403).json({ msg: 'Access denied: insufficient permissions.' });
      }
      next();
  };
};

module.exports = roleMiddleware;
