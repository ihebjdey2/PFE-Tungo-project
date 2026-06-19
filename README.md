# reservation-louage-backend

Backend Node.js/Express pour la gestion d'une plateforme de transport et de reservation.

## Installation

```bash
npm install
```

## Configuration

Creer un fichier `.env` a la racine avec au minimum les variables utilisees par l'application:

- `PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `JWT_SECRET_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DATABASE_URL`
- `HF_TOKEN`
- `GOOGLE_API_KEY`
- `GOOGLE_MODEL`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`

## Lancement

```bash
npm run dev
```

ou

```bash
npm start
```

## Notes

- Les fichiers charges par les utilisateurs sont servis depuis `uploads/`.
- Le serveur principal demarre depuis `server.js`.
