import { query } from '../src/lib/db.js';

async function testSequentialGetStudents() {
  console.log('--- TESTING SEQUENTIAL GETSTUDENTS ---');

  await query('SELECT 1;'); // Warmup connection

  const tStart = performance.now();

  const studentsRes = await query(`
    SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.is_staff, u.date_joined,
           p.whatsapp, p.instagram, p.photo_base64, p.gym_id, p.age, p.height, p.goal, p.blood_type, p.training_days, p.current_weight,
           COALESCE(p.enrollment_status, 'active') as enrollment_status, p.membership_expires_at,
           p.fase_shape, p.nivel_treino, p.frequencia_semanal, p.divisao_treino,
           p.objetivo_principal, p.objetivos_secundarios, p.pontos_fracos, p.lesoes_restricoes,
           p.altura, p.observacoes_treinador,
           p.peso_meta, p.bf_meta, p.braco_meta, p.antebraco_meta, p.ombro_meta, p.peitoral_meta,
           p.cintura_meta, p.abdomen_meta, p.dorsal_meta, p.coxa_meta, p.gluteo_meta, p.panturrilha_meta, p.pescoco_meta,
           p.restricoes_articulares, p.condicoes_cardio_metabolicas, p.cirurgias_reabilitacao, p.status_atestado,
           (CASE WHEN p.atestado_file_base64 IS NOT NULL AND p.atestado_file_base64 != '' THEN true ELSE false END) as has_atestado_file,
           p.medicamentos_uso_continuo, p.dor_cronica_nivel, p.dor_cronica_regiao, p.horas_sono_media, p.qualidade_sono_estresse,
           p.recursos_ergogenicos, p.contato_emergencia_nome, p.contato_emergencia_parentesco, p.contato_emergencia_telefone,
           p.birth_date, p.data_nascimento, p.prazo_meta, p.dia_vencimento_recorrente,
           (SELECT COUNT(*) FROM manager_routine r WHERE r.user_id = u.id) as routine_count
    FROM auth_user u
    LEFT JOIN core_userprofile p ON p.user_id = u.id
    WHERE u.is_staff = false AND u.is_superuser = false
    ORDER BY u.date_joined DESC
  `);
  const students = studentsRes.rows;
  if (students.length === 0) return console.log('No students found');

  const studentIds = students.map((s) => s.id);

  const evalsRes = await query(`
    SELECT * FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY aluno_id ORDER BY data_registro DESC, id DESC) as rn
      FROM gym_medidas_historico
      WHERE aluno_id = ANY($1::int[])
    ) t WHERE rn <= 2
  `, [studentIds]);

  const billingsRes = await query(`
    SELECT id, user_id, amount, due_date, status, payment_method, notes, paid_date
    FROM gym_billing 
    WHERE user_id = ANY($1::int[]) AND status != 'cancelled' 
    ORDER BY due_date DESC, id DESC
  `, [studentIds]);

  const tEnd = performance.now();

  console.log(`Sequential getStudents total execution time: ${(tEnd - tStart).toFixed(2)} ms`);

  process.exit(0);
}

testSequentialGetStudents().catch(err => {
  console.error(err);
  process.exit(1);
});
