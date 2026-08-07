export const requireRole = (roles) => {
  return (req, res, next) => {
    // In a real app, you'd extract and verify a JWT here.
    // For this prototype, we'll extract headers passed by the client.
    const userRole = req.headers['x-user-role']?.toUpperCase();
    
    if (!userRole) {
      return res.status(401).json({ message: "Unauthorized - No role provided" });
    }

    if (userRole === 'OWNER') {
      return next(); // Owner always has full access
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: `Forbidden - Requires one of roles: ${roles.join(', ')}` });
    }

    next();
  };
};
