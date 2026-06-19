module.exports = (rolesAutorises) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    if (!rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({
        message: `Accès interdit. Rôle requis : ${rolesAutorises.join(', ')}`
      });
    }

    next();
  };
};
