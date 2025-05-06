const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Vérification du header Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès non autorisé. Token manquant ou invalide.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Vérification et décodage du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded; // Ajouter les informations utilisateur (id, rôle) à la requête
    next();
  } catch (err) {
    console.error('Erreur lors de la vérification du token :', err);
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};
