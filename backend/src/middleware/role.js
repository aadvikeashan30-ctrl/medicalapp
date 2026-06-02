// Role-based authorization. Use after auth middleware.
// Usage: router.delete('/:id', auth, requireRole('admin', 'doctor'), handler)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { requireRole };
