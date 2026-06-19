// check-horaires.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkHoraires() {
  try {
    console.log('🔍 Vérification du contenu des "horaires"...\n');

    // 1. Chercher les documents qui mentionnent "horaire"
    const horairesDocs = await pool.query(`
      SELECT content 
      FROM documents 
      WHERE content ILIKE '%horaire%' 
      LIMIT 10
    `);

    console.log(`📊 Nombre de documents contenant "horaire": ${horairesDocs.rows.length}\n`);

    if (horairesDocs.rows.length > 0) {
      console.log('📄 Contenu complet des documents "horaires":\n');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      horairesDocs.rows.forEach((doc, i) => {
        console.log(`Document ${i + 1}:`);
        console.log(doc.content);
        console.log('\n═══════════════════════════════════════════════════════════\n');
      });
    } else {
      console.log('⚠️ Aucun document ne contient le mot "horaire"\n');
    }

    // 2. Vérifier les types de documents
    console.log('📋 Échantillon de tous types de documents:\n');
    
    const sampleDocs = await pool.query(`
      SELECT content 
      FROM documents 
      LIMIT 20
    `);

    sampleDocs.rows.forEach((doc, i) => {
      console.log(`${i + 1}. ${doc.content}\n`);
    });

    // 3. Chercher des mots-clés liés aux horaires
    console.log('\n🔎 Recherche de mots-clés liés au temps:\n');
    
    const keywords = ['heure', 'départ', 'arrivée', 'h00', 'h30', 'matin', 'soir'];
    
    for (const keyword of keywords) {
      const count = await pool.query(`
        SELECT COUNT(*) as count
        FROM documents 
        WHERE content ILIKE $1
      `, [`%${keyword}%`]);
      
      console.log(`   "${keyword}": ${count.rows[0].count} documents`);
    }

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await pool.end();
  }
}

checkHoraires();