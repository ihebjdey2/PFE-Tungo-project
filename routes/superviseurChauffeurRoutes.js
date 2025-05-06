const express = require('express');
const superviseurChauffeurController = require('../controllers/superviseurChauffeurController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole');
const router = express.Router();

router.get('/disponibles/:destinationId/:superviseurId', 
  authenticateToken, 
  verifyRole('Superviseur'), 
  superviseurChauffeurController.getChauffeursDisponiblesParDestination
);

router.put('/priorite', 
  authenticateToken, 
  verifyRole('Superviseur'), 
  superviseurChauffeurController.updatePriorite
);
/*
router.put('/reorganiser-priorites', 
  authenticateToken, 
  verifyRole('superviseur'), 
  adminChauffeurController.reorganiserPriorites
);
*/
module.exports = router; 