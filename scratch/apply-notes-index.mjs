import { query } from '../src/lib/db.js';

async function applyIndexes() {
  console.log('Criando índices de alta performance para gym_quick_notes...');
  
  await query(`
    CREATE INDEX IF NOT EXISTS idx_gym_quick_notes_order 
    ON gym_quick_notes (is_pinned DESC, created_at DESC, id DESC);

    CREATE INDEX IF NOT EXISTS idx_gym_quick_notes_cat_order 
    ON gym_quick_notes (category, is_pinned DESC, created_at DESC, id DESC);
  `);
  
  console.log('Índices aplicados com sucesso!');
  process.exit(0);
}

applyIndexes().catch((err) => {
  console.error(err);
  process.exit(1);
});
