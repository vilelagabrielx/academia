import { query } from '../src/lib/db.js';

async function verifyIndexes() {
  const res = await query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'gym_quick_notes'
  `);
  
  console.log('Índices existentes na tabela gym_quick_notes:');
  res.rows.forEach((r) => {
    console.log(`- ${r.indexname}: ${r.indexdef}`);
  });
  
  process.exit(0);
}

verifyIndexes().catch((err) => {
  console.error(err);
  process.exit(1);
});
