module.exports = (req, res, next) => {
    if (!req.user || req.user.role !== 'SuperAdmin' || req.user.id !== 1) {
      return res.status(403).json({ message: "Accès strictement réservé au SuperAdmin principal." });
    }
    next();
  };
  