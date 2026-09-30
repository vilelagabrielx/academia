import { query } from '../src/lib/db.js';

async function enableRlsOnAllTables() {
  console.log('1. Buscando todas as tabelas do schema public...');
  const tablesRes = await query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  const tables = tablesRes.rows.map((t) => t.tablename);
  console.log(`Encontradas ${tables.length} tabelas.`);

  console.log('\n2. Habilitando RLS (Row Level Security) em TODAS as tabelas...');
  for (const table of tables) {
    try {
      await query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`  ✓ RLS habilitado na tabela: ${table}`);
    } catch (err) {
      console.error(`  ✕ Erro ao habilitar RLS na tabela ${table}:`, err.message);
    }
  }

  console.log('\n3. Criando políticas de segurança (Access Control Policies)...');

  // List of tables and their appropriate security policy configurations
  const readOnlyPublicTables = [
    'exercises_exercise', 'exercises_exercisecategory', 'exercises_equipment', 
    'exercises_muscle', 'exercises_translation', 'exercises_alias', 
    'exercises_exercisecomment', 'exercises_exerciseimage', 'exercises_exercisevideo',
    'core_language', 'core_license', 'core_repetitionunit', 'core_weightunit'
  ];

  for (const table of readOnlyPublicTables) {
    if (!tables.includes(table)) continue;
    try {
      await query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = 'allow_select_${table}'
          ) THEN
            CREATE POLICY "allow_select_${table}" ON "${table}" FOR SELECT TO authenticated USING (true);
          END IF;
        END $$;
      `);
      console.log(`  ✓ Política SELECT (read-only) criada para: ${table}`);
    } catch (err) {
      console.error(`  ✕ Erro na política da tabela ${table}:`, err.message);
    }
  }

  // Application & Gym Module Tables: Allow authenticated full access
  const appDataTables = [
    'gym_quick_notes', 'gym_billing', 'gym_expenses', 'gym_expense_recurrences',
    'gym_medidas_historico', 'gym_metas_historico', 'core_userprofile', 'auth_user',
    'manager_routine', 'manager_day', 'manager_slot', 'manager_slotentry',
    'manager_setsconfig', 'manager_repetitionsconfig', 'manager_weightconfig',
    'manager_restconfig', 'manager_workoutsession', 'manager_workoutlog',
    'nutrition_nutritionplan', 'nutrition_meal', 'nutrition_mealitem', 'nutrition_logitem'
  ];

  for (const table of appDataTables) {
    if (!tables.includes(table)) continue;
    try {
      await query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = 'allow_authenticated_all_${table}'
          ) THEN
            CREATE POLICY "allow_authenticated_all_${table}" ON "${table}" FOR ALL TO authenticated USING (true) WITH CHECK (true);
          END IF;
        END $$;
      `);
      console.log(`  ✓ Política completa (TO authenticated) criada para: ${table}`);
    } catch (err) {
      console.error(`  ✕ Erro na política da tabela ${table}:`, err.message);
    }
  }

  console.log('\n4. Verificando resultado final...');
  const verifyRes = await query(`
    SELECT 
      t.tablename, 
      t.rowsecurity,
      COUNT(p.policyname) as total_policies
    FROM pg_tables t
    LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
    WHERE t.schemaname = 'public'
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename
  `);

  console.log('\n--- RESUMO DE SEGURANÇA (RLS & POLICIES) ---');
  let enabledCount = 0;
  verifyRes.rows.forEach((r) => {
    if (r.rowsecurity) enabledCount++;
    console.log(`- ${r.tablename.padEnd(35)} RLS: ${r.rowsecurity ? '✅ ATIVO' : '❌ INATIVO'} | Políticas: ${r.total_policies}`);
  });

  console.log(`\nConcluído! ${enabledCount} de ${tables.length} tabelas estão com RLS HABILITADO.`);
  process.exit(0);
}

enableRlsOnAllTables().catch((err) => {
  console.error('Erro geral ao configurar RLS:', err);
  process.exit(1);
});
