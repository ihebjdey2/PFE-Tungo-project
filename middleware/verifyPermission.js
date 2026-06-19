const permissions = require('../config/permissions');

module.exports = (requiredPermission) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!permissions[userRole]?.includes(requiredPermission)) {
      return res.status(403).json({ message: "Permission refusée pour cette action." });
    }

    next();
  };
};
