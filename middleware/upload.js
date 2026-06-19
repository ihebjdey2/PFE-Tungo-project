const multer = require('multer');
const path = require('path');

// Configuration de multer pour stocker les fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Répertoire de stockage
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nom unique pour éviter les conflits
  },
});

// Accept all file types
const fileFilter = (req, file, cb) => {
    cb(null, true); 
  };
  
  
/*
// Filtrer les types de fichiers (ex : images seulement)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers .jpeg, .jpg et .png sont autorisés'), false);
  } 
};
*/



// Créer l'instance multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limite de taille : 2 Mo
  fileFilter: fileFilter,
});

module.exports = upload;
