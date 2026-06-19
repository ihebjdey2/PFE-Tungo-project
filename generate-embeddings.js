// generate-embeddings.js
require('dotenv').config();
const { Pool } = require('pg');
const fetch = global.fetch || require('node-fetch');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Config
const HF_TOKEN = process.env.HF_TOKEN;
const EMBED_MODEL = process.env.EMBED_MODEL || 'intfloat/e5-small-v2'; // modèle HF
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4', 10);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '2', 10);

if (!HF_TOKEN) {
  console.error('⚠️ HF_TOKEN manquant dans .env');
  process.exit(1);
}

// --- Fonction pour appeler HF et récupérer l'embedding ---
async function fetchEmbedding(text) {
  const url = `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(EMBED_MODEL)}/pipeline/feature-extraction`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  const raw = await res.json();

  if (raw.error) throw new Error(`HF embedding error: ${raw.error}`);

  // Normalisation
  if (Array.isArray(raw) && typeof raw[0] === 'number') return raw;
  if (Array.isArray(raw) && Array.isArray(raw[0]) && typeof raw[0][0] === 'number') return raw[0];

  throw new Error('Format embedding inattendu: ' + JSON.stringify(raw).slice(0, 500));
}


// --- Fonction pour récupérer les documents à traiter ---
async function fetchDocuments(client, limit) {
  const result = await client.query(
    `SELECT id, content FROM documents WHERE embedding IS NULL OR embedding = '[0]'::vector LIMIT $1`,
    [limit]
  );
  return result.rows;
}

// --- Fonction pour mettre à jour l'embedding ---
async function updateEmbedding(client, id, embedding) {
  const vectorLiteral = `[${embedding.join(',')}]`;
  await client.query('UPDATE documents SET embedding = $1::vector WHERE id = $2', [vectorLiteral, id]);
}

// --- Traitement d'un batch ---
async function processBatch(rows) {
  let i = 0;

  async function worker(row) {
    const { id, content } = row;
    try {
      const safeText = (content || '').substring(0, 8000); // sécurité
      let embedding;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          embedding = await fetchEmbedding(safeText);
          break;
        } catch (err) {
          console.warn(`Tentative ${attempt} échouée id=${id}: ${err.message}`);
          if (attempt === MAX_RETRIES) throw err;
          await new Promise(r => setTimeout(r, 500 * attempt));
        }
      }

      await updateEmbedding(pool, id, embedding);
      console.log(`OK id=${id} dim=${embedding.length}`);
    } catch (err) {
      console.error(`Erreur embedding id=${id}: ${err.message}`);
    }
  }

  const workers = Array(CONCURRENCY).fill(null).map(async () => {
    while (i < rows.length) {
      const row = rows[i++];
      await worker(row);
    }
  });

  await Promise.all(workers);
}

// --- Génération embeddings complète ---
async function generateEmbeddings() {
  console.log('Début génération embeddings...');
  const client = await pool.connect();

  try {
    while (true) {
      const rows = await fetchDocuments(client, BATCH_SIZE);
      if (!rows.length) break;

      console.log(`Traitement batch de ${rows.length} documents...`);
      await processBatch(rows);
    }

    console.log('✅ Tous les embeddings ont été générés.');
  } catch (err) {
    console.error('Erreur globale:', err.message || err);
  } finally {
    try { client.release(); } catch {}
    await pool.end();
  }
}

// Lancement
generateEmbeddings().catch(err => {
  console.error('Erreur critique:', err);
  process.exit(1);
});
