import { initDbSchema, query } from '../src/lib/db.js';

async function main() {
  console.log('Executando initDbSchema()...');
  await initDbSchema();
  console.log('initDbSchema concluído com sucesso!');

  const res = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name = 'gym_quick_notes'
  `);
  console.log('Verificação da tabela gym_quick_notes:', res.rows);
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro ao executar no banco:', err);
  process.exit(1);
});
