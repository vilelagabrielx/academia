import { query } from '../src/lib/db.js';

async function inspectRls() {
  const tablesRes = await query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  console.log('--- TABELAS E STATUS DO RLS ---');
  tablesRes.rows.forEach(t => {
    console.log(`- ${t.tablename.padEnd(30)} RLS Ativo: ${t.rowsecurity}`);
  });

  const policiesRes = await query(`
    SELECT policyname, tablename, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `);

  console.log('\n--- POLÍTICAS RLS EXISTENTES ---');
  if (policiesRes.rows.length === 0) {
    console.log('Nenhuma política RLS encontrada.');
  } else {
    policiesRes.rows.forEach(p => {
      console.log(`- [${p.tablename}] Policy: ${p.policyname} | CMD: ${p.cmd} | Roles: ${p.roles}`);
    });
  }

  process.exit(0);
}

inspectRls().catch(err => {
  console.error(err);
  process.exit(1);
});
