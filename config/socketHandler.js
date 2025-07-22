// socketHandler.js
const ChauffeurPosition = require('../models/ChauffeurPosition');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('📡 Chauffeur connecté via WebSocket');

    socket.on('position', async ({ chauffeur_id, latitude, longitude }) => {
      if (!chauffeur_id || !latitude || !longitude) return;

      try {
        // ✅ Mettre à jour dans la base
        await ChauffeurPosition.update(
          {
            latitude,
            longitude,
            derniere_mise_a_jour: new Date()
          },
          { where: { chauffeur_id } }
        );

        // 📤 Transmettre en temps réel à l'app client (destination)
        io.emit(`chauffeur-position-${chauffeur_id}`, {
          chauffeur_id,
          latitude,
          longitude,
          timestamp: new Date()
        });

        console.log(`✅ Position reçue chauffeur ${chauffeur_id}`);
      } catch (err) {
        console.error('❌ Erreur mise à jour position WebSocket :', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Chauffeur déconnecté du WebSocket');
    });
  });
};
