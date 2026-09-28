import { Pool } from 'pg';
import crypto from 'crypto';
import cache from './cache.js';

// Connection pool targeting Supabase DB
const pool = new Pool({
  connectionString: process.env.PS_DATABASE_URI || 'postgresql://postgres.gpsgiwfmvtkwvvxwcpnl:Caraderato%40123@aws-0-us-east-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

export function verifyDjangoPassword(password, encodedHash) {
  if (!encodedHash || !password) return false;
  const parts = encodedHash.split('$');
  if (parts.length !== 4) return false;
  const [algorithm, iterationsStr, salt, hash] = parts;
  if (algorithm !== 'pbkdf2_sha256') return false;

  const iterations = parseInt(iterationsStr, 10);
  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64');
  return derivedKey === hash;
}

export function hashDjangoPassword(password) {
  const salt = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  const iterations = 720000;
  const hash = crypto.pbkdf2Sync(password || '123456', salt, iterations, 32, 'sha256').toString('base64');
  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

// User & Authentication DB operations (Verifica a senha informada, aceitando qualquer formato simples!)
export async function authenticateUser(usernameOrEmail, password) {
  const res = await query(
    `SELECT u.*, p.id as profile_id, p.gym_id, p.whatsapp, p.photo_base64 
     FROM auth_user u 
     LEFT JOIN core_userprofile p ON p.user_id = u.id 
     WHERE (u.username = $1 OR u.email = $1) AND u.is_active = true`,
    [usernameOrEmail]
  );
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
  
  const isValid = verifyDjangoPassword(password, user.password);
  if (!isValid) return null;

  delete user.password;
  return user;
}

// Schema Helper & Safe Monthly Date Generator
let schemaInitPromise = null;

export function initDbSchema() {
  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      try {
        await query(`
          ALTER TABLE gym_billing ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
          ALTER TABLE gym_billing ADD COLUMN IF NOT EXISTS recurrence_id VARCHAR(64);
          ALTER TABLE gym_billing ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
          ALTER TABLE gym_billing ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
          ALTER TABLE gym_expenses ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
          ALTER TABLE gym_expenses ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS fase_shape VARCHAR(50);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS nivel_treino VARCHAR(50);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS frequencia_semanal VARCHAR(50);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS divisao_treino VARCHAR(50);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS objetivo_principal VARCHAR(50);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS objetivos_secundarios TEXT;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS pontos_fracos TEXT;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS lesoes_restricoes TEXT;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS altura NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS observacoes_treinador TEXT;

          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS peso_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS bf_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS braco_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS antebraco_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS ombro_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS peitoral_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS cintura_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS abdomen_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS dorsal_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS coxa_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS gluteo_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS panturrilha_meta NUMERIC(5,2);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS pescoco_meta NUMERIC(5,2);

          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS restricoes_articulares TEXT;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS condicoes_cardio_metabolicas TEXT;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS cirurgias_reabilitacao TEXT;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS status_atestado VARCHAR(50);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS atestado_file_base64 TEXT;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS medicamentos_uso_continuo TEXT;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS dor_cronica_nivel INTEGER DEFAULT 0;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS dor_cronica_regiao VARCHAR(100);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS horas_sono_media NUMERIC(3,1);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS qualidade_sono_estresse VARCHAR(50);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS recursos_ergogenicos TEXT;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS contato_emergencia_nome VARCHAR(150);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS contato_emergencia_parentesco VARCHAR(50);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS contato_emergencia_telefone VARCHAR(50);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS birth_date DATE;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS data_nascimento DATE;
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS prazo_meta VARCHAR(50);
          ALTER TABLE core_userprofile ADD COLUMN IF NOT EXISTS dia_vencimento_recorrente INTEGER DEFAULT 5;

          CREATE TABLE IF NOT EXISTS gym_medidas_historico (
            id SERIAL PRIMARY KEY,
            aluno_id INTEGER NOT NULL,
            data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            registrado_por VARCHAR(150),
            peso NUMERIC(5,2),
            bf_percentual NUMERIC(5,2),
            pescoco NUMERIC(5,2),
            ombro NUMERIC(5,2),
            peitoral_torax NUMERIC(5,2),
            dorsal_largura NUMERIC(5,2),
            dorsal_espessura NUMERIC(5,2),
            cintura NUMERIC(5,2),
            abdomen NUMERIC(5,2),
            quadril NUMERIC(5,2),
            braco_direito NUMERIC(5,2),
            braco_esquerdo NUMERIC(5,2),
            braco_contraido NUMERIC(5,2),
            braco_direito_contraido NUMERIC(5,2),
            braco_esquerdo_contraido NUMERIC(5,2),
            antebraco_direito NUMERIC(5,2),
            antebraco_esquerdo NUMERIC(5,2),
            coxa_direita NUMERIC(5,2),
            coxa_esquerda NUMERIC(5,2),
            gluteo NUMERIC(5,2),
            panturrilha_direita NUMERIC(5,2),
            panturrilha_esquerda NUMERIC(5,2),
            observacoes TEXT,
            resumo_alteracao TEXT
          );

          ALTER TABLE gym_medidas_historico ADD COLUMN IF NOT EXISTS braco_direito_contraido NUMERIC(5,2);
          ALTER TABLE gym_medidas_historico ADD COLUMN IF NOT EXISTS braco_esquerdo_contraido NUMERIC(5,2);

          CREATE TABLE IF NOT EXISTS gym_metas_historico (
            id SERIAL PRIMARY KEY,
            aluno_id INTEGER NOT NULL,
            data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            campo_meta VARCHAR(50),
            valor_anterior NUMERIC(5,2),
            valor_novo NUMERIC(5,2)
          );

          CREATE TABLE IF NOT EXISTS gym_expense_recurrences (
            id VARCHAR(64) PRIMARY KEY,
            description VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            payment_method VARCHAR(50) DEFAULT 'Pix',
            base_amount NUMERIC(10, 2) NOT NULL,
            frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
            due_day INTEGER NOT NULL DEFAULT 5,
            start_date DATE NOT NULL,
            end_date DATE,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS gym_expenses (
            id VARCHAR(64) PRIMARY KEY,
            recurrence_id VARCHAR(64),
            description VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            amount NUMERIC(10, 2) NOT NULL,
            due_date DATE NOT NULL,
            payment_date TIMESTAMP,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            payment_method VARCHAR(50) DEFAULT 'Pix',
            notes TEXT,
            proof_base64 TEXT,
            proof_filename VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_recurrence_per_due_date UNIQUE (recurrence_id, due_date)
          );

          CREATE INDEX IF NOT EXISTS idx_gym_expenses_due_date ON gym_expenses(due_date);
          CREATE INDEX IF NOT EXISTS idx_gym_expenses_status ON gym_expenses(status);
          CREATE INDEX IF NOT EXISTS idx_gym_expenses_category ON gym_expenses(category);
          CREATE INDEX IF NOT EXISTS idx_gym_billing_due_date ON gym_billing(due_date);
          CREATE INDEX IF NOT EXISTS idx_gym_billing_status ON gym_billing(status);
          CREATE INDEX IF NOT EXISTS idx_gym_billing_user_id ON gym_billing(user_id);
          CREATE INDEX IF NOT EXISTS idx_gym_medidas_aluno ON gym_medidas_historico(aluno_id);
          CREATE INDEX IF NOT EXISTS idx_core_userprofile_user ON core_userprofile(user_id);
        `);
      } catch (err) {
        console.error('Error initializing DB schema extensions:', err);
      }
    })();
  }
  return schemaInitPromise;
}

export function getSafeMonthlyDate(baseDateStr, monthOffset) {
  if (!baseDateStr) return new Date().toISOString().split('T')[0];
  const parts = String(baseDateStr).split('T')[0].split('-');
  const baseYear = parseInt(parts[0], 10);
  const baseMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const baseDay = parseInt(parts[2], 10);

  const targetDate = new Date(baseYear, baseMonth + monthOffset, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();

  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const safeDay = Math.min(baseDay, maxDays);

  const safeMonthStr = String(targetMonth + 1).padStart(2, '0');
  const safeDayStr = String(safeDay).padStart(2, '0');

  return `${targetYear}-${safeMonthStr}-${safeDayStr}`;
}

export function getMonthDateRange(month_year) {
  if (!month_year || month_year === 'all') return null;
  const parts = String(month_year).trim().split('-');
  if (parts.length < 2) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month)) return null;
  const lastDay = new Date(year, month, 0).getDate();
  const monthPadded = String(month).padStart(2, '0');
  const startDate = `${parts[0]}-${monthPadded}-01`;
  const endDate = `${parts[0]}-${monthPadded}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

export async function checkExistingBilling(userId, dueDateStr) {
  await initDbSchema();
  const dateStr = String(dueDateStr).split('T')[0];
  const yearMonth = dateStr.slice(0, 7); // 'YYYY-MM'
  
  const res = await query(
    `SELECT b.*, u.first_name, u.last_name, u.username 
     FROM gym_billing b
     JOIN auth_user u ON u.id = b.user_id
     WHERE b.user_id = $1 
       AND b.status != 'cancelled'
       AND TO_CHAR(b.due_date, 'YYYY-MM') = $2
     LIMIT 1`,
    [userId, yearMonth]
  );
  return res.rows[0] || null;
}

// Students CRUD
export async function getStudents(search = '') {
  const cacheKey = `students:search:${search.toLowerCase().trim()}`;
  return cache.getOrFetch(cacheKey, async () => {
    await initDbSchema();

    let sql = `
      SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.is_staff, u.date_joined,
             p.whatsapp, p.instagram, p.photo_base64, p.gym_id, p.age, p.height, p.goal, p.blood_type, p.training_days, p.current_weight,
             COALESCE(p.enrollment_status, 'active') as enrollment_status, p.membership_expires_at,
             p.fase_shape, p.nivel_treino, p.frequencia_semanal, p.divisao_treino,
             p.objetivo_principal, p.objetivos_secundarios, p.pontos_fracos, p.lesoes_restricoes,
             p.altura, p.observacoes_treinador,
             p.peso_meta, p.bf_meta, p.braco_meta, p.antebraco_meta, p.ombro_meta, p.peitoral_meta,
             p.cintura_meta, p.abdomen_meta, p.dorsal_meta, p.coxa_meta, p.gluteo_meta, p.panturrilha_meta, p.pescoco_meta,
             p.restricoes_articulares, p.condicoes_cardio_metabolicas, p.cirurgias_reabilitacao, p.status_atestado, p.atestado_file_base64,
             p.medicamentos_uso_continuo, p.dor_cronica_nivel, p.dor_cronica_regiao, p.horas_sono_media, p.qualidade_sono_estresse,
             p.recursos_ergogenicos, p.contato_emergencia_nome, p.contato_emergencia_parentesco, p.contato_emergencia_telefone,
             p.birth_date, p.data_nascimento, p.prazo_meta, p.dia_vencimento_recorrente,
             (SELECT COUNT(*) FROM manager_routine r WHERE r.user_id = u.id) as routine_count
      FROM auth_user u
      LEFT JOIN core_userprofile p ON p.user_id = u.id
      WHERE u.is_staff = false AND u.is_superuser = false
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.username ILIKE $1 OR u.email ILIKE $1 OR p.whatsapp ILIKE $1 OR p.instagram ILIKE $1)`;
    }
    sql += ` ORDER BY u.date_joined DESC`;

    const studentsRes = await query(sql, params);
    const students = studentsRes.rows;
    if (students.length === 0) return [];

    const studentIds = students.map((s) => s.id);

    const [evalsRes, billingsRes] = await Promise.all([
      query(`
        SELECT * FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY aluno_id ORDER BY data_registro DESC, id DESC) as rn
          FROM gym_medidas_historico
          WHERE aluno_id = ANY($1::int[])
        ) t WHERE rn <= 2
      `, [studentIds]),
      query(`
        SELECT * FROM gym_billing 
        WHERE user_id = ANY($1::int[]) AND status != 'cancelled' 
        ORDER BY due_date DESC, id DESC
      `, [studentIds])
    ]);

    const evalMap = new Map();
    for (const eRow of evalsRes.rows) {
      const arr = evalMap.get(eRow.aluno_id) || [];
      arr.push(eRow);
      evalMap.set(eRow.aluno_id, arr);
    }

    const billingsMap = new Map();
    for (const bRow of billingsRes.rows) {
      const arr = billingsMap.get(bRow.user_id) || [];
      arr.push(bRow);
      billingsMap.set(bRow.user_id, arr);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.slice(0, 7);
    const expiredStudentIds = [];

    for (const s of students) {
      if (s.enrollment_status === 'active' && s.membership_expires_at && s.membership_expires_at < todayStr) {
        s.enrollment_status = 'renewal_needed';
        expiredStudentIds.push(s.id);
      }

      const evals = evalMap.get(s.id) || [];
      s.latest_evaluation = evals[0] || null;
      s.previous_evaluation = evals[1] || null;

      const allBillings = billingsMap.get(s.id) || [];
      const currentMonthBilling = allBillings.find(
        (b) => b.due_date && String(b.due_date).split('T')[0].slice(0, 7) === currentMonthStr
      );

      const latestBilling = allBillings[0] || null;
      s.latest_billing_amount = latestBilling ? latestBilling.amount : null;
      s.latest_billing_status = latestBilling ? latestBilling.status : null;
      s.latest_billing_due_date = latestBilling ? latestBilling.due_date : null;
      s.latest_billing = latestBilling;

      const paidBilling = allBillings.find((b) => b.status === 'paid');
      s.last_paid_amount = paidBilling ? paidBilling.amount : null;
      s.last_paid_date = paidBilling ? paidBilling.paid_date : null;

      if (!currentMonthBilling) {
        s.billing_status = 'sem_cobranca';
        s.billing_status_rank = 1;
        s.current_billing = null;
      } else if (currentMonthBilling.status === 'paid') {
        s.billing_status = 'em_dia';
        s.billing_status_rank = 4;
        s.current_billing = currentMonthBilling;
      } else if (currentMonthBilling.status === 'overdue' || String(currentMonthBilling.due_date).split('T')[0] < todayStr) {
        s.billing_status = 'atrasada';
        s.billing_status_rank = 2;
        s.current_billing = currentMonthBilling;
      } else {
        s.billing_status = 'pendente';
        s.billing_status_rank = 3;
        s.current_billing = currentMonthBilling;
      }
    }

    if (expiredStudentIds.length > 0) {
      query(`UPDATE core_userprofile SET enrollment_status = 'renewal_needed' WHERE user_id = ANY($1::int[])`, [expiredStudentIds]).catch(() => {});
    }

    // Priority Sort
    students.sort((a, b) => {
      if (a.billing_status_rank !== b.billing_status_rank) {
        return a.billing_status_rank - b.billing_status_rank;
      }
      const dateA = a.current_billing?.due_date || a.latest_billing_due_date || a.date_joined || '';
      const dateB = b.current_billing?.due_date || b.latest_billing_due_date || b.date_joined || '';
      return String(dateA).localeCompare(String(dateB));
    });

    return students;
  }, 30);
}

export async function createStudent(data = {}) {
  await initDbSchema();
  const {
    first_name,
    last_name = '',
    username = '',
    email = '',
    password = '',
    whatsapp = '',
    instagram = '',
    photo_base64 = '',
    age = null,
    height = null,
    current_weight = null,
    blood_type = '',
    goal = '',
    training_days = '',
    create_first_billing = false,
    billing_amount = null,
    billing_due_date = null,
    billing_notes = '',
    billing_payment_method = 'Pix',
    is_recurring = false,
    initial_amount = null,
    due_date = null,
  } = data;

  const cleanFirstName = (first_name || 'Aluno').trim();
  const cleanLastName = (last_name || '').trim();

  let baseUsername = username
    ? username.trim().toLowerCase()
    : `${cleanFirstName}_${cleanLastName}`
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_]/g, '')
        .replace(/^_|_$/g, '');

  if (!baseUsername) baseUsername = `aluno_${Date.now().toString().slice(-4)}`;

  let finalUsername = baseUsername;
  let attempts = 0;
  while (attempts < 10) {
    const checkUser = await query(`SELECT id FROM auth_user WHERE username = $1`, [finalUsername]);
    if (checkUser.rows.length === 0) break;
    attempts++;
    finalUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
  }

  const hashedPassword = hashDjangoPassword(password || '123456');
  const now = new Date();
  
  const userRes = await query(
    `INSERT INTO auth_user (username, first_name, last_name, email, password, is_staff, is_active, is_superuser, date_joined)
     VALUES ($1, $2, $3, $4, $5, false, true, false, $6)
     RETURNING id, username, first_name, last_name, email, date_joined`,
    [finalUsername, cleanFirstName, last_name || '', email || '', hashedPassword, now]
  );
  
  const userId = userRes.rows[0].id;

  await query(
    `INSERT INTO core_userprofile 
     (user_id, is_temporary, workout_reminder_active, workout_reminder, workout_duration, notification_language_id, weight_unit, num_days_weight_reminder, can_add_user, trophies_enabled, time_zone, whatsapp, instagram, photo_base64, age, height, current_weight, blood_type, goal, training_days, enrollment_status)
     VALUES ($1, false, false, 14, 12, 2, 'kg', 0, false, true, '', $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')`,
    [
      userId,
      whatsapp || '',
      instagram || '',
      photo_base64 || '',
      age ? parseInt(age, 10) : null,
      height ? parseInt(height, 10) : null,
      current_weight ? parseFloat(current_weight) : null,
      blood_type || '',
      goal || '',
      training_days || '',
    ]
  );

  // Update profile fields & goals if provided
  await updateStudent(userId, data);

  // Check if initial body evaluation provided
  const evalData = data.initial_evaluation;
  if (evalData && (evalData.peso || evalData.bf_percentual || evalData.cintura || evalData.braco_contraido || evalData.ombro || evalData.peitoral_torax || evalData.coxa_direita || evalData.observacoes)) {
    await addBodyEvaluation(userId, evalData, 'Treinador (Cadastro)');
  }

  // Check if first billing creation requested
  const shouldCreateBilling = create_first_billing || Boolean(initial_amount && due_date);
  const amountToUse = billing_amount || initial_amount;
  const dateToUse = billing_due_date || due_date;

  if (shouldCreateBilling && amountToUse && dateToUse) {
    await createBilling({
      user_id: userId,
      amount: amountToUse,
      due_date: dateToUse,
      payment_method: billing_payment_method || 'Pix',
      notes: billing_notes || 'Primeira Mensalidade',
      is_recurring: Boolean(is_recurring || (initial_amount && due_date)),
      force_duplicate: true,
    });
  }

  return userRes.rows[0];
}

export async function updateStudent(id, data = {}) {
  await initDbSchema();

  // 1. Track changed goals
  const profRes = await query(`SELECT * FROM core_userprofile WHERE user_id = $1`, [id]);
  const currentProf = profRes.rows[0] || {};

  const goalFields = [
    'peso_meta', 'bf_meta', 'braco_meta', 'antebraco_meta', 'ombro_meta',
    'peitoral_meta', 'cintura_meta', 'abdomen_meta', 'dorsal_meta', 'coxa_meta',
    'gluteo_meta', 'panturrilha_meta', 'pescoco_meta'
  ];

  for (const field of goalFields) {
    if (data[field] !== undefined) {
      const oldVal = currentProf[field] !== null && currentProf[field] !== undefined ? parseFloat(currentProf[field]) : null;
      const newVal = data[field] !== null && data[field] !== '' ? parseFloat(data[field]) : null;
      if (oldVal !== newVal) {
        await query(
          `INSERT INTO gym_metas_historico (aluno_id, campo_meta, valor_anterior, valor_novo)
           VALUES ($1, $2, $3, $4)`,
          [id, field, oldVal, newVal]
        );
      }
    }
  }

  // Update auth_user table
  let sql = `UPDATE auth_user SET first_name = $1, last_name = $2, email = $3`;
  const params = [data.first_name || '', data.last_name || '', data.email || ''];

  if (data.password) {
    params.push(hashDjangoPassword(data.password));
    sql += `, password = $${params.length}`;
  }

  params.push(id);
  sql += ` WHERE id = $${params.length}`;
  await query(sql, params);

  const parseNum = (val) => (val !== undefined && val !== null && val !== '' ? parseFloat(val) : null);

  // Update core_userprofile table
  const pSql = `
    UPDATE core_userprofile 
    SET whatsapp = COALESCE($1, whatsapp),
        instagram = COALESCE($32, instagram),
        photo_base64 = COALESCE(NULLIF($2, ''), photo_base64),
        age = COALESCE($3, age),
        height = COALESCE($4, height),
        current_weight = COALESCE($5, current_weight),
        blood_type = COALESCE($6, blood_type),
        goal = COALESCE($7, goal),
        training_days = COALESCE($8, training_days),
        fase_shape = COALESCE($9, fase_shape),
        nivel_treino = COALESCE($10, nivel_treino),
        frequencia_semanal = COALESCE($11, frequencia_semanal),
        divisao_treino = COALESCE($12, divisao_treino),
        objetivo_principal = COALESCE($13, objetivo_principal),
        objetivos_secundarios = COALESCE($14, objetivos_secundarios),
        pontos_fracos = COALESCE($15, pontos_fracos),
        lesoes_restricoes = COALESCE($16, lesoes_restricoes),
        altura = COALESCE($17, altura),
        observacoes_treinador = COALESCE($18, observacoes_treinador),
        peso_meta = COALESCE($19, peso_meta),
        bf_meta = COALESCE($20, bf_meta),
        braco_meta = COALESCE($21, braco_meta),
        antebraco_meta = COALESCE($22, antebraco_meta),
        ombro_meta = COALESCE($23, ombro_meta),
        peitoral_meta = COALESCE($24, peitoral_meta),
        cintura_meta = COALESCE($25, cintura_meta),
        abdomen_meta = COALESCE($26, abdomen_meta),
        dorsal_meta = COALESCE($27, dorsal_meta),
        coxa_meta = COALESCE($28, coxa_meta),
        gluteo_meta = COALESCE($29, gluteo_meta),
        panturrilha_meta = COALESCE($30, panturrilha_meta),
        pescoco_meta = COALESCE($31, pescoco_meta),
        restricoes_articulares = COALESCE($34, restricoes_articulares),
        condicoes_cardio_metabolicas = COALESCE($35, condicoes_cardio_metabolicas),
        cirurgias_reabilitacao = COALESCE($36, cirurgias_reabilitacao),
        status_atestado = COALESCE($37, status_atestado),
        atestado_file_base64 = COALESCE(NULLIF($38, ''), atestado_file_base64),
        medicamentos_uso_continuo = COALESCE($39, medicamentos_uso_continuo),
        dor_cronica_nivel = COALESCE($40, dor_cronica_nivel),
        dor_cronica_regiao = COALESCE($41, dor_cronica_regiao),
        horas_sono_media = COALESCE($42, horas_sono_media),
        qualidade_sono_estresse = COALESCE($43, qualidade_sono_estresse),
        recursos_ergogenicos = COALESCE($44, recursos_ergogenicos),
        contato_emergencia_nome = COALESCE($45, contato_emergencia_nome),
        contato_emergencia_parentesco = COALESCE($46, contato_emergencia_parentesco),
        contato_emergencia_telefone = COALESCE($47, contato_emergencia_telefone),
        birth_date = COALESCE($48, birth_date),
        data_nascimento = COALESCE($49, data_nascimento),
        prazo_meta = COALESCE($50, prazo_meta),
        dia_vencimento_recorrente = COALESCE($51, dia_vencimento_recorrente)
    WHERE user_id = $33
  `;

  let computedAge = data.age ? parseInt(data.age, 10) : null;
  const bDateStr = data.birth_date || data.data_nascimento;
  if (bDateStr) {
    const birth = new Date(bDateStr);
    if (!isNaN(birth.getTime())) {
      const today = new Date();
      let ageCalc = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) ageCalc--;
      if (ageCalc >= 0) computedAge = ageCalc;
    }
  }

  await query(pSql, [
    data.whatsapp !== undefined ? data.whatsapp : null,
    data.photo_base64 || '',
    computedAge,
    data.height ? parseInt(data.height, 10) : null,
    parseNum(data.current_weight),
    data.blood_type || null,
    data.goal || data.objetivo_principal || null,
    data.training_days || data.frequencia_semanal || null,
    data.fase_shape || null,
    data.nivel_treino || null,
    data.frequencia_semanal || null,
    data.divisao_treino || null,
    data.objetivo_principal || null,
    data.objetivos_secundarios !== undefined ? data.objetivos_secundarios : null,
    data.pontos_fracos !== undefined ? data.pontos_fracos : null,
    data.lesoes_restricoes !== undefined ? data.lesoes_restricoes : null,
    parseNum(data.altura),
    data.observacoes_treinador !== undefined ? data.observacoes_treinador : null,
    parseNum(data.peso_meta),
    parseNum(data.bf_meta),
    parseNum(data.braco_meta),
    parseNum(data.antebraco_meta),
    parseNum(data.ombro_meta),
    parseNum(data.peitoral_meta),
    parseNum(data.cintura_meta),
    parseNum(data.abdomen_meta),
    parseNum(data.dorsal_meta),
    parseNum(data.coxa_meta),
    parseNum(data.gluteo_meta),
    parseNum(data.panturrilha_meta),
    parseNum(data.pescoco_meta),
    data.instagram !== undefined ? data.instagram : null,
    id,
    data.restricoes_articulares !== undefined ? (typeof data.restricoes_articulares === 'object' ? JSON.stringify(data.restricoes_articulares) : data.restricoes_articulares) : null,
    data.condicoes_cardio_metabolicas !== undefined ? (typeof data.condicoes_cardio_metabolicas === 'object' ? JSON.stringify(data.condicoes_cardio_metabolicas) : data.condicoes_cardio_metabolicas) : null,
    data.cirurgias_reabilitacao !== undefined ? data.cirurgias_reabilitacao : null,
    data.status_atestado || null,
    data.atestado_file_base64 || '',
    data.medicamentos_uso_continuo !== undefined ? data.medicamentos_uso_continuo : null,
    data.dor_cronica_nivel !== undefined && data.dor_cronica_nivel !== '' ? parseInt(data.dor_cronica_nivel, 10) : null,
    data.dor_cronica_regiao !== undefined ? data.dor_cronica_regiao : null,
    parseNum(data.horas_sono_media),
    data.qualidade_sono_estresse || null,
    data.recursos_ergogenicos !== undefined ? data.recursos_ergogenicos : null,
    data.contato_emergencia_nome !== undefined ? data.contato_emergencia_nome : null,
    data.contato_emergencia_parentesco !== undefined ? data.contato_emergencia_parentesco : null,
    data.contato_emergencia_telefone !== undefined ? data.contato_emergencia_telefone : null,
    data.birth_date || data.data_nascimento || null,
    data.data_nascimento || data.birth_date || null,
    data.prazo_meta || null,
    data.dia_vencimento_recorrente ? parseInt(data.dia_vencimento_recorrente, 10) : 5,
  ]);

  return { id };
}

export async function addBodyEvaluation(alunoId, evalData = {}, registeredBy = 'Treinador') {
  await initDbSchema();

  const prevRes = await query(
    `SELECT * FROM gym_medidas_historico WHERE aluno_id = $1 ORDER BY data_registro DESC, id DESC LIMIT 1`,
    [alunoId]
  );
  const prev = prevRes.rows[0] || null;

  const profRes = await query(`SELECT * FROM core_userprofile WHERE user_id = $1`, [alunoId]);
  const profile = profRes.rows[0] || {};
  const faseShape = profile.fase_shape || 'Recomposição';

  const parseNum = (val) => (val !== undefined && val !== null && val !== '' ? parseFloat(val) : null);

  const peso = parseNum(evalData.peso);
  const bf_percentual = parseNum(evalData.bf_percentual);
  const pescoco = parseNum(evalData.pescoco);
  const ombro = parseNum(evalData.ombro);
  const peitoral_torax = parseNum(evalData.peitoral_torax);
  const dorsal_largura = parseNum(evalData.dorsal_largura);
  const dorsal_espessura = parseNum(evalData.dorsal_espessura);
  const cintura = parseNum(evalData.cintura);
  const abdomen = parseNum(evalData.abdomen);
  const quadril = parseNum(evalData.quadril);
  const braco_direito = parseNum(evalData.braco_direito);
  const braco_esquerdo = parseNum(evalData.braco_esquerdo);
  const braco_contraido = parseNum(evalData.braco_contraido || evalData.braco_direito_contraido);
  const braco_direito_contraido = parseNum(evalData.braco_direito_contraido || evalData.braco_contraido);
  const braco_esquerdo_contraido = parseNum(evalData.braco_esquerdo_contraido);
  const antebraco_direito = parseNum(evalData.antebraco_direito);
  const antebraco_esquerdo = parseNum(evalData.antebraco_esquerdo);
  const coxa_direita = parseNum(evalData.coxa_direita);
  const coxa_esquerda = parseNum(evalData.coxa_esquerda);
  const gluteo = parseNum(evalData.gluteo);
  const panturrilha_direita = parseNum(evalData.panturrilha_direita);
  const panturrilha_esquerda = parseNum(evalData.panturrilha_esquerda);
  const observacoes = evalData.observacoes || '';

  let evolucoes = 0;
  let estaveis = 0;
  let regressoes = 0;

  if (prev) {
    const compareMetric = (currVal, prevVal, isReductionPositive = false) => {
      if (currVal === null || prevVal === null || currVal === undefined || prevVal === undefined) return;
      const delta = currVal - prevVal;
      if (Math.abs(delta) < 0.2) {
        estaveis++;
      } else if (isReductionPositive ? delta < 0 : delta > 0) {
        evolucoes++;
      } else {
        regressoes++;
      }
    };

    compareMetric(braco_direito_contraido || braco_contraido, prev.braco_direito_contraido || prev.braco_contraido);
    compareMetric(peitoral_torax, prev.peitoral_torax);
    compareMetric(ombro, prev.ombro);
    compareMetric(dorsal_largura, prev.dorsal_largura);
    compareMetric(coxa_direita, prev.coxa_direita);
    compareMetric(panturrilha_direita, prev.panturrilha_direita);
    compareMetric(gluteo, prev.gluteo);
    compareMetric(cintura, prev.cintura, true);
    compareMetric(abdomen, prev.abdomen, true);
    compareMetric(bf_percentual, prev.bf_percentual, true);

    if (peso !== null && prev.peso !== null) {
      const pDelta = peso - prev.peso;
      if (Math.abs(pDelta) < 0.3) {
        estaveis++;
      } else if (faseShape === 'Bulking' && pDelta > 0) {
        evolucoes++;
      } else if (faseShape === 'Cutting' && pDelta < 0) {
        evolucoes++;
      } else if (faseShape === 'Bulking' && pDelta < 0) {
        regressoes++;
      } else if (faseShape === 'Cutting' && pDelta > 0) {
        regressoes++;
      } else {
        estaveis++;
      }
    }
  }

  const resumo_alteracao = prev
    ? `${evolucoes} evoluções, ${estaveis} estáveis, ${regressoes} regressões`
    : 'Primeira avaliação registrada!';

  const res = await query(
    `INSERT INTO gym_medidas_historico 
     (aluno_id, registrado_por, peso, bf_percentual, pescoco, ombro, peitoral_torax, dorsal_largura, dorsal_espessura,
      cintura, abdomen, quadril, braco_direito, braco_esquerdo, braco_contraido, braco_direito_contraido, braco_esquerdo_contraido,
      antebraco_direito, antebraco_esquerdo, coxa_direita, coxa_esquerda, gluteo, panturrilha_direita, panturrilha_esquerda, observacoes, resumo_alteracao)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
     RETURNING *`,
    [
      alunoId,
      registeredBy,
      peso,
      bf_percentual,
      pescoco,
      ombro,
      peitoral_torax,
      dorsal_largura,
      dorsal_espessura,
      cintura,
      abdomen,
      quadril,
      braco_direito,
      braco_esquerdo,
      braco_contraido,
      braco_direito_contraido,
      braco_esquerdo_contraido,
      antebraco_direito,
      antebraco_esquerdo,
      coxa_direita,
      coxa_esquerda,
      gluteo,
      panturrilha_direita,
      panturrilha_esquerda,
      observacoes,
      resumo_alteracao
    ]
  );

  if (peso !== null) {
    await query(`UPDATE core_userprofile SET current_weight = $1 WHERE user_id = $2`, [peso, alunoId]);
  }

  return {
    evaluation: res.rows[0],
    isFirst: !prev,
    evolucoes,
    estaveis,
    regressoes,
    resumo_alteracao,
  };
}

export async function getStudentCompleteHistory(alunoId) {
  await initDbSchema();

  const evalRes = await query(
    `SELECT * FROM gym_medidas_historico WHERE aluno_id = $1 ORDER BY data_registro DESC, id DESC`,
    [alunoId]
  );

  const prRes = await query(
    `SELECT 
       l.exercise_id, 
       t.name as exercise_name,
       MAX(l.weight) as max_weight,
       MAX(l.repetitions) as max_reps,
       MAX(l.date) as last_date
     FROM manager_workoutlog l
     JOIN exercises_translation t ON t.exercise_id = l.exercise_id AND t.language_id = 2
     WHERE l.user_id = $1 AND l.weight > 0
     GROUP BY l.exercise_id, t.name
     ORDER BY max_weight DESC
     LIMIT 15`,
    [alunoId]
  );

  const logRes = await query(
    `SELECT 
       l.id,
       l.exercise_id,
       t.name as exercise_name,
       l.weight,
       l.repetitions,
       l.date,
       (l.weight * l.repetitions) as volume
     FROM manager_workoutlog l
     JOIN exercises_translation t ON t.exercise_id = l.exercise_id AND t.language_id = 2
     WHERE l.user_id = $1 AND l.weight > 0
     ORDER BY l.date DESC, l.id DESC
     LIMIT 100`,
    [alunoId]
  );

  const metaRes = await query(
    `SELECT * FROM gym_metas_historico WHERE aluno_id = $1 ORDER BY data_alteracao DESC, id DESC`,
    [alunoId]
  );

  return {
    evaluations: evalRes.rows,
    personalRecords: prRes.rows,
    performanceLogs: logRes.rows,
    metaHistory: metaRes.rows,
  };
}

export async function deleteStudent(id) {
  // Complete Cascade Deletion
  await query(`DELETE FROM gym_billing WHERE user_id = $1`, [id]);
  await query(`DELETE FROM gym_medidas_historico WHERE aluno_id = $1`, [id]);
  await query(`DELETE FROM gym_metas_historico WHERE aluno_id = $1`, [id]);
  await query(`DELETE FROM core_userprofile WHERE user_id = $1`, [id]);
  await query(`DELETE FROM manager_workoutlog WHERE user_id = $1`, [id]);
  await query(`DELETE FROM manager_workoutsession WHERE user_id = $1`, [id]);

  // Clean up routines and routine sub-configs
  const routines = await query(`SELECT id FROM manager_routine WHERE user_id = $1`, [id]);
  for (const r of routines.rows) {
    const days = await query(`SELECT id FROM manager_day WHERE routine_id = $1`, [r.id]);
    for (const d of days.rows) {
      const slots = await query(`SELECT id FROM manager_slot WHERE day_id = $1`, [d.id]);
      for (const s of slots.rows) {
        const entries = await query(`SELECT id FROM manager_slotentry WHERE slot_id = $1`, [s.id]);
        for (const e of entries.rows) {
          await query(`DELETE FROM manager_setsconfig WHERE slot_entry_id = $1`, [e.id]);
          await query(`DELETE FROM manager_repetitionsconfig WHERE slot_entry_id = $1`, [e.id]);
          await query(`DELETE FROM manager_weightconfig WHERE slot_entry_id = $1`, [e.id]);
          await query(`DELETE FROM manager_restconfig WHERE slot_entry_id = $1`, [e.id]);
        }
        await query(`DELETE FROM manager_slotentry WHERE slot_id = $1`, [s.id]);
      }
      await query(`DELETE FROM manager_slot WHERE day_id = $1`, [d.id]);
    }
    await query(`DELETE FROM manager_day WHERE routine_id = $1`, [r.id]);
  }
  await query(`DELETE FROM manager_routine WHERE user_id = $1`, [id]);
  await query(`DELETE FROM auth_user WHERE id = $1`, [id]);
  cache.flush();
  return true;
}

// Exercises
export async function getExercises(search = '', categoryId = null) {
  const cacheKey = `exercises:${search.toLowerCase().trim()}:${categoryId || 'all'}`;
  return cache.getOrFetch(cacheKey, async () => {
    let sql = `
      SELECT e.id, t.name, t.description, c.name as category_name, c.id as category_id
      FROM exercises_exercise e
      JOIN exercises_translation t ON t.exercise_id = e.id AND t.language_id = 2
      LEFT JOIN exercises_exercisecategory c ON c.id = e.category_id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (t.name ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
    }
    if (categoryId) {
      params.push(categoryId);
      sql += ` AND e.category_id = $${params.length}`;
    }
    sql += ` ORDER BY t.name ASC LIMIT 200`;
    const res = await query(sql, params);
    return res.rows;
  }, 300);
}

export async function createExercise({ name, description, category_id }) {
  cache.delPrefix('exercises:');
  const now = new Date();
  const uuid = crypto.randomUUID();
  const exRes = await query(
    `INSERT INTO exercises_exercise 
     (license_author, category_id, license_id, uuid, last_update, license_author_url, license_derivative_source_url, license_object_url, license_title, created)
     VALUES ('Admin', $1, 1, $2, $3, '', '', '', 'CC-BY', $3)
     RETURNING id`,
    [category_id || 1, uuid, now]
  );
  const exerciseId = exRes.rows[0].id;

  await query(
    `INSERT INTO exercises_translation 
     (exercise_id, name, description, language_id, license_author, license_id, uuid, last_update, license_author_url, license_derivative_source_url, license_object_url, license_title, created, description_source)
     VALUES ($1, $2, $3, 2, 'Admin', 1, $4, $5, '', '', '', 'CC-BY', $5, '')`,
    [exerciseId, name, description || '', uuid, now]
  );

  return { id: exerciseId, name, description };
}

// Routines & Workouts
export async function getRoutinesForUser(userId) {
  const res = await query(
    `SELECT r.*, 
       (SELECT COUNT(*) FROM manager_day d WHERE d.routine_id = r.id) as day_count
     FROM manager_routine r
     WHERE r.user_id = $1
     ORDER BY r.created DESC`,
    [userId]
  );
  return res.rows;
}

export async function getRoutineFullDetail(routineId) {
  const routineRes = await query(`SELECT * FROM manager_routine WHERE id = $1`, [routineId]);
  if (routineRes.rows.length === 0) return null;
  const routine = routineRes.rows[0];

  const daysRes = await query(`SELECT * FROM manager_day WHERE routine_id = $1 ORDER BY "order" ASC`, [routineId]);
  const days = daysRes.rows;

  for (let day of days) {
    const slotsRes = await query(`SELECT * FROM manager_slot WHERE day_id = $1 ORDER BY "order" ASC`, [day.id]);
    day.slots = slotsRes.rows;

    for (let slot of day.slots) {
      const entriesRes = await query(
        `SELECT se.*, t.name as exercise_name, t.description as exercise_description
         FROM manager_slotentry se
         JOIN exercises_translation t ON t.exercise_id = se.exercise_id AND t.language_id = 2
         WHERE se.slot_id = $1
         ORDER BY se."order" ASC`,
        [slot.id]
      );
      slot.entries = entriesRes.rows;

      for (let entry of slot.entries) {
        const setsConfig = await query(`SELECT * FROM manager_setsconfig WHERE slot_entry_id = $1`, [entry.id]);
        const repsConfig = await query(`SELECT * FROM manager_repetitionsconfig WHERE slot_entry_id = $1`, [entry.id]);
        const weightConfig = await query(`SELECT * FROM manager_weightconfig WHERE slot_entry_id = $1`, [entry.id]);
        const restConfig = await query(`SELECT * FROM manager_restconfig WHERE slot_entry_id = $1`, [entry.id]);

        entry.sets = setsConfig.rows[0]?.value || 3;
        entry.reps = repsConfig.rows[0]?.value || 10;
        entry.weight = weightConfig.rows[0]?.value || 0;
        entry.rest = restConfig.rows[0]?.value || 60;
      }
    }
  }

  routine.days = days;
  return routine;
}

export async function createFullRoutine({ user_id, name, description, days }) {
  const now = new Date();
  const start = now.toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setFullYear(now.getFullYear() + 1);
  const end = endDate.toISOString().split('T')[0];

  const routineRes = await query(
    `INSERT INTO manager_routine 
     (name, description, created, start, "end", user_id, is_public, is_template, fit_in_week)
     VALUES ($1, $2, $3, $4, $5, $6, false, false, false)
     RETURNING id`,
    [name, description || '', now, start, end, user_id]
  );
  const routineId = routineRes.rows[0].id;

  if (days && Array.isArray(days)) {
    for (let dIdx = 0; dIdx < days.length; dIdx++) {
      const dayData = days[dIdx];
      const dayRes = await query(
        `INSERT INTO manager_day (routine_id, name, description, type, is_rest, need_logs_to_advance, "order")
         VALUES ($1, $2, $3, '1', false, false, $4)
         RETURNING id`,
        [routineId, dayData.name || `Dia ${dIdx + 1}`, dayData.description || '', dIdx + 1]
      );
      const dayId = dayRes.rows[0].id;

      if (dayData.exercises && Array.isArray(dayData.exercises)) {
        const slotRes = await query(
          `INSERT INTO manager_slot (day_id, "order", comment)
           VALUES ($1, 1, '')
           RETURNING id`,
          [dayId]
        );
        const slotId = slotRes.rows[0].id;

        for (let eIdx = 0; eIdx < dayData.exercises.length; eIdx++) {
          const ex = dayData.exercises[eIdx];
          const entryRes = await query(
            `INSERT INTO manager_slotentry (slot_id, exercise_id, "order", type, comment)
             VALUES ($1, $2, $3, '1', $4)
             RETURNING id`,
            [slotId, ex.exercise_id, eIdx + 1, ex.comment || '']
          );
          const entryId = entryRes.rows[0].id;

          await query(
            `INSERT INTO manager_setsconfig (slot_entry_id, value, iteration, operation, step, repeat)
             VALUES ($1, $2, 1, 'fixed', '0', true)`,
            [entryId, parseInt(ex.sets || 3, 10)]
          );

          await query(
            `INSERT INTO manager_repetitionsconfig (slot_entry_id, value, iteration, operation, step, repeat)
             VALUES ($1, $2, 1, 'fixed', '0', true)`,
            [entryId, parseFloat(ex.reps || 10)]
          );

          await query(
            `INSERT INTO manager_weightconfig (slot_entry_id, value, iteration, operation, step, repeat)
             VALUES ($1, $2, 1, 'fixed', '0', true)`,
            [entryId, parseFloat(ex.weight || 0)]
          );

          await query(
            `INSERT INTO manager_restconfig (slot_entry_id, value, iteration, operation, step, repeat)
             VALUES ($1, $2, 1, 'fixed', '0', true)`,
            [entryId, parseInt(ex.rest || 60, 10)]
          );
        }
      }
    }
  }

  return { id: routineId };
}

// Workout Session Logging
export async function logWorkoutSession({ user_id, routine_id, day_id, notes, logs }) {
  const now = new Date();
  const sessionId = crypto.randomUUID();

  await query(
    `INSERT INTO manager_workoutsession (id, user_id, routine_id, day_id, datetime_start, datetime_end, notes, impression)
     VALUES ($1, $2, $3, $4, $5, $5, $6, 'good')`,
    [sessionId, user_id, routine_id, day_id, now, notes || '']
  );

  if (logs && Array.isArray(logs)) {
    for (let l of logs) {
      const logId = crypto.randomUUID();
      await query(
        `INSERT INTO manager_workoutlog 
         (id, session_id, user_id, routine_id, slot_entry_id, exercise_id, date, weight, repetitions, weight_target, repetitions_target, rest)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          logId,
          sessionId,
          user_id,
          routine_id,
          l.slot_entry_id || null,
          l.exercise_id,
          now,
          parseFloat(l.weight || 0),
          parseFloat(l.reps || 0),
          parseFloat(l.weight_target || 0),
          parseFloat(l.reps_target || 0),
          parseInt(l.rest || 60, 10),
        ]
      );
    }
  }

  return { sessionId };
}

export async function getStudentWorkoutHistory(user_id) {
  const res = await query(
    `SELECT s.id as session_id, s.datetime_start, s.datetime_end, s.notes,
            r.name as routine_name, d.name as day_name,
            l.exercise_id, t.name as exercise_name, l.weight, l.repetitions, l.weight_target, l.repetitions_target, l.date
     FROM manager_workoutsession s
     LEFT JOIN manager_routine r ON r.id = s.routine_id
     LEFT JOIN manager_day d ON d.id = s.day_id
     LEFT JOIN manager_workoutlog l ON l.session_id = s.id
     LEFT JOIN exercises_translation t ON t.exercise_id = l.exercise_id AND t.language_id = 2
     WHERE s.user_id = $1
     ORDER BY s.datetime_start DESC, l.date ASC`,
    [user_id]
  );
  return res.rows;
}

// ==========================================
// BILLING MODULE (Módulo de Cobranças)
// ==========================================

export async function getBillingSummary({ month_year, search, user_id } = {}) {
  await query(
    `UPDATE gym_billing SET status = 'overdue' WHERE due_date < CURRENT_DATE AND status = 'pending'`
  );
  await query(
    `UPDATE gym_billing SET status = 'overdue' WHERE remind_at < CURRENT_DATE AND status = 'charged'`
  );
  await query(`
    DELETE FROM gym_billing 
    WHERE status != 'paid' 
      AND (
        user_id NOT IN (SELECT id FROM auth_user)
        OR user_id IN (SELECT id FROM auth_user WHERE is_active = false)
        OR user_id IN (SELECT user_id FROM core_userprofile WHERE enrollment_status IN ('cancelled', 'inactive'))
      )
  `);

  let sql = `
    SELECT 
      COALESCE(SUM(CASE WHEN b.status = 'paid' THEN b.amount ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN b.status = 'pending' THEN b.amount ELSE 0 END), 0) as total_pending,
      COALESCE(SUM(CASE WHEN b.status = 'charged' THEN b.amount ELSE 0 END), 0) as total_charged,
      COALESCE(SUM(CASE WHEN b.status = 'overdue' THEN b.amount ELSE 0 END), 0) as total_overdue,
      COALESCE(SUM(CASE WHEN b.status IN ('pending', 'charged', 'overdue') THEN b.amount ELSE 0 END), 0) as total_receber,
      COALESCE(SUM(b.amount), 0) as total_geral,
      COUNT(CASE WHEN b.status = 'paid' THEN 1 END) as count_paid,
      COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as count_pending,
      COUNT(CASE WHEN b.status = 'charged' THEN 1 END) as count_charged,
      COUNT(CASE WHEN b.status = 'overdue' THEN 1 END) as count_overdue,
      COUNT(*) as count_total
    FROM gym_billing b
    JOIN auth_user u ON u.id = b.user_id AND u.is_active = true
    LEFT JOIN core_userprofile p ON p.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  const dateRange = getMonthDateRange(month_year);
  if (dateRange) {
    params.push(dateRange.startDate, dateRange.endDate);
    sql += ` AND b.due_date >= $${params.length - 1} AND b.due_date <= $${params.length}`;
  }

  if (user_id) {
    params.push(user_id);
    sql += ` AND b.user_id = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.username ILIKE $${params.length} OR p.whatsapp ILIKE $${params.length})`;
  }

  const res = await query(sql, params);
  const row = res.rows[0] || {};
  return {
    total_paid: parseFloat(row.total_paid || 0),
    total_pending: parseFloat(row.total_pending || 0),
    total_charged: parseFloat(row.total_charged || 0),
    total_overdue: parseFloat(row.total_overdue || 0),
    total_receber: parseFloat(row.total_receber || 0),
    total_geral: parseFloat(row.total_geral || 0),
    count_paid: parseInt(row.count_paid || 0, 10),
    count_pending: parseInt(row.count_pending || 0, 10),
    count_charged: parseInt(row.count_charged || 0, 10),
    count_overdue: parseInt(row.count_overdue || 0, 10),
    count_total: parseInt(row.count_total || 0, 10),
  };
}

export async function getBillings({ status, user_id, search, month_year } = {}) {
  await query(
    `UPDATE gym_billing SET status = 'overdue' WHERE due_date < CURRENT_DATE AND status = 'pending'`
  );
  await query(
    `UPDATE gym_billing SET status = 'overdue' WHERE remind_at < CURRENT_DATE AND status = 'charged'`
  );
  await query(`
    DELETE FROM gym_billing 
    WHERE status != 'paid' 
      AND (
        user_id NOT IN (SELECT id FROM auth_user)
        OR user_id IN (SELECT id FROM auth_user WHERE is_active = false)
        OR user_id IN (SELECT user_id FROM core_userprofile WHERE enrollment_status IN ('cancelled', 'inactive'))
      )
  `);

  let sql = `
    SELECT b.*, u.username, u.first_name, u.last_name, u.email, p.whatsapp, p.photo_base64
    FROM gym_billing b
    JOIN auth_user u ON u.id = b.user_id AND u.is_active = true
    LEFT JOIN core_userprofile p ON p.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  const dateRange = getMonthDateRange(month_year);
  if (dateRange) {
    params.push(dateRange.startDate, dateRange.endDate);
    sql += ` AND b.due_date >= $${params.length - 1} AND b.due_date <= $${params.length}`;
  }

  if (status) {
    params.push(status);
    sql += ` AND b.status = $${params.length}`;
  }

  if (user_id) {
    params.push(user_id);
    sql += ` AND b.user_id = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.username ILIKE $${params.length} OR p.whatsapp ILIKE $${params.length})`;
  }

  sql += ` ORDER BY b.due_date ASC, b.id DESC`;
  const res = await query(sql, params);
  return res.rows;
}

export async function createBilling({
  user_id,
  amount,
  due_date,
  payment_method = 'Pix',
  notes = '',
  is_recurring = false,
  force_duplicate = false,
}) {
  await initDbSchema();
  const todayStr = new Date().toISOString().split('T')[0];

  if (is_recurring) {
    const recurrenceId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdBillings = [];
    let duplicateFound = null;

    for (let i = 0; i < 12; i++) {
      const currentDueDate = getSafeMonthlyDate(due_date, i);
      
      if (!force_duplicate) {
        const existing = await checkExistingBilling(user_id, currentDueDate);
        if (existing) {
          if (i === 0) {
            duplicateFound = existing;
            break;
          }
          continue; // skip duplicate month in series
        }
      }

      const status = currentDueDate < todayStr ? 'overdue' : 'pending';
      const monthNotes = notes
        ? (notes.includes('/') ? notes : `${notes} (${i + 1}/12)`)
        : `Mensalidade (${i + 1}/12)`;

      const res = await query(
        `INSERT INTO gym_billing (user_id, amount, due_date, payment_method, status, notes, is_recurring, recurrence_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [user_id, parseFloat(amount), currentDueDate, payment_method, status, monthNotes, true, recurrenceId]
      );
      createdBillings.push(res.rows[0]);
    }

    if (duplicateFound && createdBillings.length === 0) {
      return {
        duplicate: true,
        existingBilling: duplicateFound,
        error: `Já existe uma cobrança para este aluno no período (${due_date.slice(0, 7)}).`,
      };
    }

    return {
      success: true,
      is_recurring: true,
      recurrence_id: recurrenceId,
      totalCreated: createdBillings.length,
      billing: createdBillings[0] || null,
      createdBillings,
    };
  } else {
    // Single billing duplicate check
    if (!force_duplicate) {
      const existing = await checkExistingBilling(user_id, due_date);
      if (existing) {
        return {
          duplicate: true,
          existingBilling: existing,
          error: `Já existe uma cobrança para este aluno no período (${due_date.slice(0, 7)}).`,
        };
      }
    }

    const status = due_date < todayStr ? 'overdue' : 'pending';
    const res = await query(
      `INSERT INTO gym_billing (user_id, amount, due_date, payment_method, status, notes, is_recurring)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [user_id, parseFloat(amount), due_date, payment_method, status, notes]
    );
    return { success: true, billing: res.rows[0] };
  }
}

export async function markBillingAsCharged(id, { remind_days = 3, remind_at = null, charge_notes = '' }) {
  const now = new Date();
  let remindDate = remind_at;
  if (!remindDate && remind_days) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(remind_days, 10));
    remindDate = d.toISOString().split('T')[0];
  }

  const res = await query(
    `UPDATE gym_billing 
     SET status = 'charged', charged_at = $1, remind_at = $2, charge_notes = $3
     WHERE id = $4
     RETURNING *`,
    [now, remindDate, charge_notes || '', id]
  );
  return res.rows[0];
}

export async function updateBillingStatus(id, { status, paid_date, receipt_generated, notes, proof_base64, proof_filename, cancel_reason }) {
  let sql = `UPDATE gym_billing SET status = $1`;
  const params = [status];

  if (status === 'paid') {
    params.push(paid_date || new Date());
    sql += `, paid_date = $${params.length}`;
  }

  if (status === 'cancelled') {
    if (!cancel_reason || !cancel_reason.trim()) {
      throw new Error('A justificativa de cancelamento é obrigatória!');
    }
    params.push(cancel_reason.trim());
    sql += `, cancel_reason = $${params.length}`;
    params.push(new Date());
    sql += `, cancelled_at = $${params.length}`;
  }

  if (receipt_generated !== undefined) {
    params.push(receipt_generated);
    sql += `, receipt_generated = $${params.length}`;
  }

  if (notes !== undefined) {
    params.push(notes);
    sql += `, notes = $${params.length}`;
  }

  if (proof_base64 !== undefined) {
    params.push(proof_base64);
    sql += `, proof_base64 = $${params.length}`;
    params.push(proof_filename || 'comprovante.jpg');
    sql += `, proof_filename = $${params.length}`;
  }

  params.push(id);
  sql += ` WHERE id = $${params.length} RETURNING *`;
  const res = await query(sql, params);
  return res.rows[0];
}

export async function updateBillingWithScope(id, { amount, due_date, payment_method, notes, status, scope = 'single' }) {
  await initDbSchema();
  const todayStr = new Date().toISOString().split('T')[0];

  const origRes = await query(`SELECT * FROM gym_billing WHERE id = $1`, [id]);
  if (origRes.rows.length === 0) {
    throw new Error('Cobrança não encontrada');
  }
  const target = origRes.rows[0];

  let affectedBillings = [target];
  if (target.recurrence_id) {
    if (scope === 'all') {
      const recRes = await query(
        `SELECT * FROM gym_billing WHERE recurrence_id = $1 ORDER BY due_date ASC, id ASC`,
        [target.recurrence_id]
      );
      affectedBillings = recRes.rows;
    } else if (scope === 'future') {
      const recRes = await query(
        `SELECT * FROM gym_billing WHERE recurrence_id = $1 AND due_date >= $2 ORDER BY due_date ASC, id ASC`,
        [target.recurrence_id, target.due_date]
      );
      affectedBillings = recRes.rows;
    }
  }

  const dateChanged = due_date && String(due_date).split('T')[0] !== String(target.due_date).split('T')[0];
  const newDay = dateChanged ? parseInt(String(due_date).split('T')[0].split('-')[2], 10) : null;

  const updatedResults = [];

  for (const b of affectedBillings) {
    let bDueDate = String(b.due_date).split('T')[0];

    if (dateChanged) {
      if (scope === 'single') {
        bDueDate = String(due_date).split('T')[0];
      } else {
        const parts = bDueDate.split('-');
        const bYear = parseInt(parts[0], 10);
        const bMonth = parseInt(parts[1], 10) - 1; // 0-indexed
        
        const maxDays = new Date(bYear, bMonth + 1, 0).getDate();
        const safeDay = Math.min(newDay, maxDays);
        const safeMonthStr = String(bMonth + 1).padStart(2, '0');
        const safeDayStr = String(safeDay).padStart(2, '0');
        bDueDate = `${bYear}-${safeMonthStr}-${safeDayStr}`;
      }
    }

    let bStatus = status !== undefined ? status : b.status;
    if (bStatus === 'pending' || bStatus === 'overdue') {
      bStatus = bDueDate < todayStr ? 'overdue' : 'pending';
    }

    const newAmount = amount !== undefined ? parseFloat(amount) : b.amount;
    const newPaymentMethod = payment_method !== undefined ? payment_method : b.payment_method;
    const newNotes = notes !== undefined ? notes : b.notes;

    const res = await query(
      `UPDATE gym_billing 
       SET amount = $1, due_date = $2, payment_method = $3, notes = $4, status = $5
       WHERE id = $6
       RETURNING *`,
      [newAmount, bDueDate, newPaymentMethod, newNotes, bStatus, b.id]
    );

    updatedResults.push(res.rows[0]);
  }

  return {
    success: true,
    totalUpdated: updatedResults.length,
    updatedBillings: updatedResults,
  };
}

export async function uploadBillingProof(id, { proof_base64, proof_filename }) {
  const res = await query(
    `UPDATE gym_billing 
     SET proof_base64 = $1, proof_filename = $2 
     WHERE id = $3 
     RETURNING *`,
    [proof_base64, proof_filename || 'comprovante.jpg', id]
  );
  return res.rows[0];
}

export async function deleteBilling(id) {
  await query(`DELETE FROM gym_billing WHERE id = $1`, [id]);
  return true;
}

export async function getOverdueBillings() {
  await query(
    `UPDATE gym_billing SET status = 'overdue' WHERE due_date < CURRENT_DATE AND status = 'pending'`
  );
  await query(
    `UPDATE gym_billing SET status = 'overdue' WHERE remind_at < CURRENT_DATE AND status = 'charged'`
  );

  const res = await query(`
    SELECT b.*, u.username, u.first_name, u.last_name, u.email, p.whatsapp, p.photo_base64
    FROM gym_billing b
    JOIN auth_user u ON u.id = b.user_id
    LEFT JOIN core_userprofile p ON p.user_id = u.id
    WHERE b.status = 'overdue'
    ORDER BY b.due_date ASC
  `);
  return res.rows;
}

export async function convertToMonthly(id, { generateYear = true, monthsCount = 12 } = {}) {
  const origRes = await query(`SELECT * FROM gym_billing WHERE id = $1`, [id]);
  if (origRes.rows.length === 0) throw new Error('Cobrança não encontrada');
  const orig = origRes.rows[0];

  const todayStr = new Date().toISOString().split('T')[0];
  const count = generateYear ? 12 : 1;

  await query(
    `UPDATE gym_billing SET notes = $1 WHERE id = $2`,
    [`Mensalidade (1/${count})`, id]
  );

  const createdBillings = [orig];
  const startDate = new Date(orig.due_date);
  let lastDueDateStr = orig.due_date;

  if (generateYear) {
    for (let i = 2; i <= 12; i++) {
      const nextDueDate = new Date(startDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + (i - 1));
      const dueDateStr = nextDueDate.toISOString().split('T')[0];
      lastDueDateStr = dueDateStr;
      const status = dueDateStr < todayStr ? 'overdue' : 'pending';

      const newRes = await query(
        `INSERT INTO gym_billing (user_id, amount, due_date, payment_method, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          orig.user_id,
          orig.amount,
          dueDateStr,
          orig.payment_method || 'Pix',
          status,
          `Mensalidade (${i}/12)`,
        ]
      );
      createdBillings.push(newRes.rows[0]);
    }
  }

  await query(
    `UPDATE core_userprofile 
     SET enrollment_status = 'active', membership_expires_at = $1 
     WHERE user_id = $2`,
    [lastDueDateStr, orig.user_id]
  );

  return { convertedId: id, totalCreated: createdBillings.length, createdBillings };
}

export async function cancelStudentEnrollment(studentId) {
  await initDbSchema();
  await query(`UPDATE auth_user SET is_active = false WHERE id = $1`, [studentId]);
  await query(
    `UPDATE core_userprofile SET enrollment_status = 'cancelled' WHERE user_id = $1`,
    [studentId]
  );

  // Delete all non-paid (future/pending/overdue) billings for this student (keep paid ones for history)
  await query(
    `DELETE FROM gym_billing WHERE user_id = $1 AND status != 'paid'`,
    [studentId]
  );

  cache.flush();
  return true;
}

export async function renewStudentEnrollment(studentId, { amount = 60.00, startDate = null } = {}) {
  const baseDate = startDate ? new Date(startDate) : new Date();
  const todayStr = new Date().toISOString().split('T')[0];

  const createdBillings = [];
  let lastDueDateStr = null;

  for (let i = 1; i <= 12; i++) {
    const nextDueDate = new Date(baseDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + (i - 1));
    const dueDateStr = nextDueDate.toISOString().split('T')[0];
    lastDueDateStr = dueDateStr;
    const status = dueDateStr < todayStr ? 'overdue' : 'pending';

    const res = await query(
      `INSERT INTO gym_billing (user_id, amount, due_date, payment_method, status, notes)
       VALUES ($1, $2, $3, 'Pix', $4, $5)
       RETURNING *`,
      [studentId, parseFloat(amount), dueDateStr, status, `Mensalidade Renovada (${i}/12)`]
    );
    createdBillings.push(res.rows[0]);
  }

  // Set student back to active with new 1-year expiration
  await query(
    `UPDATE core_userprofile 
     SET enrollment_status = 'active', membership_expires_at = $1 
     WHERE user_id = $2`,
    [lastDueDateStr, studentId]
  );

  return { studentId, createdBillings, membership_expires_at: lastDueDateStr };
}

// ==========================================
// EXPENSE MODULE & RECURRENCE ENGINE (Motor JIT / Lazy Evaluation)
// ==========================================

const generatedExpenseMonths = new Set();

export async function ensureExpensesGenerated(targetMonthStr) {
  await initDbSchema();
  if (!targetMonthStr || targetMonthStr === 'all') {
    targetMonthStr = new Date().toISOString().slice(0, 7);
  }
  if (generatedExpenseMonths.has(targetMonthStr)) {
    return;
  }
  const parts = targetMonthStr.split('-');
  const yearStr = parts[0];
  const monthStr = parts[1];
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const startOfMonth = `${yearStr}-${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endOfMonth = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  const todayStr = new Date().toISOString().split('T')[0];

  const res = await query(`
    SELECT * FROM gym_expense_recurrences
    WHERE status = 'ACTIVE'
      AND start_date <= $1
      AND (end_date IS NULL OR end_date >= $2)
  `, [endOfMonth, startOfMonth]);

  for (const rule of res.rows) {
    const safeDay = Math.min(rule.due_day || 5, lastDay);
    const dueDateStr = `${yearStr}-${monthStr}-${String(safeDay).padStart(2, '0')}`;
    const initialStatus = dueDateStr < todayStr ? 'OVERDUE' : 'PENDING';
    const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await query(`
      INSERT INTO gym_expenses (id, recurrence_id, description, category, amount, due_date, status, payment_method, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (recurrence_id, due_date) DO NOTHING
    `, [
      expenseId,
      rule.id,
      rule.description,
      rule.category,
      parseFloat(rule.base_amount),
      dueDateStr,
      initialStatus,
      rule.payment_method || 'Pix',
      rule.notes || `Despesa Recorrente (${monthStr}/${yearStr})`
    ]);
  }
  generatedExpenseMonths.add(targetMonthStr);
}

const generatedBillingMonths = new Set();

export async function ensureStudentBillingsGenerated(targetMonthStr) {
  await initDbSchema();
  if (!targetMonthStr || targetMonthStr === 'all') {
    targetMonthStr = new Date().toISOString().slice(0, 7);
  }
  if (generatedBillingMonths.has(targetMonthStr)) {
    return;
  }
  const parts = targetMonthStr.split('-');
  const yearStr = parts[0];
  const monthStr = parts[1];
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const lastDay = new Date(year, month, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const studentsRes = await query(`
    SELECT u.id as user_id, p.dia_vencimento_recorrente, u.date_joined
    FROM auth_user u
    JOIN core_userprofile p ON p.user_id = u.id
    WHERE p.enrollment_status = 'active'
      AND u.is_staff = false 
      AND u.is_superuser = false
  `);

  for (const s of studentsRes.rows) {
    const joinedMonthStr = s.date_joined ? new Date(s.date_joined).toISOString().slice(0, 7) : '2000-01';
    if (targetMonthStr < joinedMonthStr) {
      // Não gera cobranças retroativas para meses anteriores à data de cadastro do aluno
      continue;
    }

    const existing = await query(`
      SELECT id FROM gym_billing 
      WHERE user_id = $1 AND due_date >= $2 AND due_date <= $3
      LIMIT 1
    `, [s.user_id, `${targetMonthStr}-01`, `${targetMonthStr}-${String(lastDay).padStart(2, '0')}`]);

    if (existing.rows.length === 0) {
      const dueDay = s.dia_vencimento_recorrente || 5;
      const safeDay = Math.min(dueDay, lastDay);
      const dueDateStr = `${yearStr}-${monthStr}-${String(safeDay).padStart(2, '0')}`;
      const status = dueDateStr < todayStr ? 'overdue' : 'pending';

      await query(`
        INSERT INTO gym_billing (user_id, amount, due_date, payment_method, status, notes, is_recurring)
        VALUES ($1, 150.00, $2, 'Pix', $3, $4, true)
      `, [s.user_id, dueDateStr, status, `Mensalidade Recorrente (${monthStr}/${yearStr})`]);
    }
  }
  generatedBillingMonths.add(targetMonthStr);
}

export async function getExpenseSummary({ month_year, search, category } = {}) {
  await ensureExpensesGenerated(month_year);

  let sql = `
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as total_pending,
      COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN amount ELSE 0 END), 0) as total_overdue,
      COALESCE(SUM(CASE WHEN status IN ('PENDING', 'OVERDUE') THEN amount ELSE 0 END), 0) as total_a_pagar,
      COALESCE(SUM(amount), 0) as total_geral,
      COUNT(CASE WHEN status = 'PAID' THEN 1 END) as count_paid,
      COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as count_pending,
      COUNT(CASE WHEN status = 'OVERDUE' THEN 1 END) as count_overdue,
      COUNT(*) as count_total
    FROM gym_expenses
    WHERE 1=1
  `;
  const params = [];

  const dateRange = getMonthDateRange(month_year);
  if (dateRange) {
    params.push(dateRange.startDate, dateRange.endDate);
    sql += ` AND due_date >= $${params.length - 1} AND due_date <= $${params.length}`;
  }

  if (category) {
    params.push(category);
    sql += ` AND category = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (description ILIKE $${params.length} OR category ILIKE $${params.length} OR notes ILIKE $${params.length})`;
  }

  const res = await query(sql, params);
  const row = res.rows[0] || {};

  // Find top category
  let topCatSql = `
    SELECT category, SUM(amount) as sum_cat
    FROM gym_expenses
    WHERE 1=1
  `;
  const topCatParams = [];
  if (dateRange) {
    topCatParams.push(dateRange.startDate, dateRange.endDate);
    topCatSql += ` AND due_date >= $${topCatParams.length - 1} AND due_date <= $${topCatParams.length}`;
  }
  topCatSql += ` GROUP BY category ORDER BY sum_cat DESC LIMIT 1`;
  const topCatRes = await query(topCatSql, topCatParams);
  const topCategory = topCatRes.rows[0] ? topCatRes.rows[0].category : 'Nenhuma';
  const topCategorySum = topCatRes.rows[0] ? parseFloat(topCatRes.rows[0].sum_cat) : 0;

  return {
    total_paid: parseFloat(row.total_paid || 0),
    total_pending: parseFloat(row.total_pending || 0),
    total_overdue: parseFloat(row.total_overdue || 0),
    total_a_pagar: parseFloat(row.total_a_pagar || 0),
    total_geral: parseFloat(row.total_geral || 0),
    count_paid: parseInt(row.count_paid || 0, 10),
    count_pending: parseInt(row.count_pending || 0, 10),
    count_overdue: parseInt(row.count_overdue || 0, 10),
    count_total: parseInt(row.count_total || 0, 10),
    top_category: topCategory,
    top_category_sum: topCategorySum,
  };
}

export async function getExpenses({ month_year, status, category, search } = {}) {
  await ensureExpensesGenerated(month_year);

  await query(`UPDATE gym_expenses SET status = 'OVERDUE' WHERE due_date < CURRENT_DATE AND status = 'PENDING'`);

  let sql = `SELECT * FROM gym_expenses WHERE 1=1`;
  const params = [];

  const dateRange = getMonthDateRange(month_year);
  if (dateRange) {
    params.push(dateRange.startDate, dateRange.endDate);
    sql += ` AND due_date >= $${params.length - 1} AND due_date <= $${params.length}`;
  }

  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }

  if (category) {
    params.push(category);
    sql += ` AND category = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (description ILIKE $${params.length} OR category ILIKE $${params.length} OR notes ILIKE $${params.length})`;
  }

  sql += ` ORDER BY due_date ASC, id DESC`;
  const res = await query(sql, params);
  return res.rows;
}

export async function createExpense({
  description,
  category,
  amount,
  due_date,
  payment_method = 'Pix',
  status = 'PENDING',
  notes = '',
  proof_base64 = null,
  proof_filename = null,
  is_recurring = false,
  frequency = 'MONTHLY',
  due_day = null,
  end_date = null
}) {
  await initDbSchema();
  const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const todayStr = new Date().toISOString().split('T')[0];
  const dateObj = new Date(due_date);
  const computedDueDay = due_day ? parseInt(due_day, 10) : dateObj.getDate();

  let recurrenceId = null;

  if (is_recurring) {
    recurrenceId = `rec_exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(`
      INSERT INTO gym_expense_recurrences (id, description, category, payment_method, base_amount, frequency, due_day, start_date, end_date, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', $10)
    `, [
      recurrenceId,
      description,
      category,
      payment_method,
      parseFloat(amount),
      frequency,
      computedDueDay,
      due_date,
      end_date || null,
      notes
    ]);
  }

  const initialStatus = status === 'PAID' ? 'PAID' : (due_date < todayStr ? 'OVERDUE' : 'PENDING');
  const paymentDate = status === 'PAID' ? new Date() : null;

  const res = await query(`
    INSERT INTO gym_expenses (id, recurrence_id, description, category, amount, due_date, payment_date, status, payment_method, notes, proof_base64, proof_filename)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    id,
    recurrenceId,
    description,
    category,
    parseFloat(amount),
    due_date,
    paymentDate,
    initialStatus,
    payment_method,
    notes,
    proof_base64 || null,
    proof_filename || null
  ]);

  return { success: true, expense: res.rows[0], recurrenceId };
}

export async function updateExpense(id, { description, category, amount, due_date, payment_method, notes, status, cancel_reason, scope = 'single' }) {
  await initDbSchema();
  const origRes = await query(`SELECT * FROM gym_expenses WHERE id = $1`, [id]);
  if (origRes.rows.length === 0) throw new Error('Despesa não encontrada');
  const target = origRes.rows[0];

  const newDesc = description !== undefined ? description : target.description;
  const newCat = category !== undefined ? category : target.category;
  const newAmount = amount !== undefined ? parseFloat(amount) : target.amount;
  const newDueDate = due_date !== undefined ? due_date : target.due_date;
  const newPaymentMethod = payment_method !== undefined ? payment_method : target.payment_method;
  const newNotes = notes !== undefined ? notes : target.notes;
  const newStatus = status !== undefined ? status : target.status;

  if (newStatus === 'CANCELLED') {
    if (!cancel_reason || !cancel_reason.trim()) {
      throw new Error('A justificativa de cancelamento é obrigatória!');
    }
    const now = new Date();
    const res = await query(`
      UPDATE gym_expenses
      SET status = 'CANCELLED', cancel_reason = $1, cancelled_at = $2, notes = COALESCE($3, notes)
      WHERE id = $4
      RETURNING *
    `, [cancel_reason.trim(), now, newNotes, id]);
    cache.flush();
    return { success: true, expense: res.rows[0] };
  }

  const res = await query(`
    UPDATE gym_expenses
    SET description = $1, category = $2, amount = $3, due_date = $4, payment_method = $5, notes = $6, status = $7
    WHERE id = $8
    RETURNING *
  `, [newDesc, newCat, newAmount, newDueDate, newPaymentMethod, newNotes, newStatus, id]);

  if (target.recurrence_id && (scope === 'future' || scope === 'all')) {
    const dueDay = new Date(newDueDate).getDate();
    await query(`
      UPDATE gym_expense_recurrences
      SET description = $1, category = $2, base_amount = $3, payment_method = $4, due_day = $5
      WHERE id = $6
    `, [newDesc, newCat, newAmount, newPaymentMethod, dueDay, target.recurrence_id]);
  }

  return { success: true, expense: res.rows[0] };
}

export async function markExpenseAsPaid(id, { payment_date = null, proof_base64 = null, proof_filename = null, notes = null } = {}) {
  const pDate = payment_date ? new Date(payment_date) : new Date();
  const res = await query(`
    UPDATE gym_expenses
    SET status = 'PAID', payment_date = $1, proof_base64 = COALESCE($2, proof_base64), proof_filename = COALESCE($3, proof_filename), notes = COALESCE($4, notes)
    WHERE id = $5
    RETURNING *
  `, [pDate, proof_base64, proof_filename, notes, id]);
  return res.rows[0];
}

export async function deleteExpense(id, { delete_recurrence = false } = {}) {
  const origRes = await query(`SELECT recurrence_id FROM gym_expenses WHERE id = $1`, [id]);
  const recurrenceId = origRes.rows[0]?.recurrence_id;

  if (delete_recurrence && recurrenceId) {
    await query(`UPDATE gym_expense_recurrences SET status = 'CANCELLED' WHERE id = $1`, [recurrenceId]);
    await query(`DELETE FROM gym_expenses WHERE recurrence_id = $1 AND status = 'PENDING'`, [recurrenceId]);
  } else {
    await query(`DELETE FROM gym_expenses WHERE id = $1`, [id]);
  }

  return true;
}

export async function getMonthlyProfitHistory(monthsCount = 6) {
  await initDbSchema();
  const now = new Date();
  const startDateObj = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);
  const endDateObj = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startMonthStr = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-01`;
  const endMonthStr = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    await ensureExpensesGenerated(monthKey);
    await ensureStudentBillingsGenerated(monthKey);
  }

  const [revRes, expRes] = await Promise.all([
    query(`
      SELECT 
        TO_CHAR(due_date, 'YYYY-MM') as month_key,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as receitas_pago,
        COALESCE(SUM(amount), 0) as receitas_total
      FROM gym_billing
      WHERE due_date >= $1 AND due_date <= $2
      GROUP BY TO_CHAR(due_date, 'YYYY-MM')
    `, [startMonthStr, endMonthStr]),
    query(`
      SELECT 
        TO_CHAR(due_date, 'YYYY-MM') as month_key,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as despesas_pago,
        COALESCE(SUM(amount), 0) as despesas_total
      FROM gym_expenses
      WHERE due_date >= $1 AND due_date <= $2
      GROUP BY TO_CHAR(due_date, 'YYYY-MM')
    `, [startMonthStr, endMonthStr])
  ]);

  const revMap = new Map();
  for (const row of revRes.rows) {
    revMap.set(row.month_key, {
      receitasPago: parseFloat(row.receitas_pago || 0),
      receitasTotal: parseFloat(row.receitas_total || 0)
    });
  }

  const expMap = new Map();
  for (const row of expRes.rows) {
    expMap.set(row.month_key, {
      despesasPago: parseFloat(row.despesas_pago || 0),
      despesasTotal: parseFloat(row.despesas_total || 0)
    });
  }

  const history = [];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearStr = d.getFullYear();
    const monthKey = `${yearStr}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${yearStr.toString().slice(-2)}`;

    const rev = revMap.get(monthKey) || { receitasPago: 0, receitasTotal: 0 };
    const exp = expMap.get(monthKey) || { despesasPago: 0, despesasTotal: 0 };

    const lucroPago = rev.receitasPago - exp.despesasPago;
    const lucroProjetado = rev.receitasTotal - exp.despesasTotal;

    history.push({
      month_key: monthKey,
      label,
      receitas_pago: rev.receitasPago,
      despesas_pago: exp.despesasPago,
      lucro_pago: lucroPago,
      receitas_total: rev.receitasTotal,
      despesas_total: exp.despesasTotal,
      lucro_projetado: lucroProjetado,
    });
  }

  return history;
}

export async function getCashFlowSummary({ month_year } = {}) {
  const cacheKey = `cashflow:summary:${month_year || 'current'}`;
  return cache.getOrFetch(cacheKey, async () => {
    const targetMonth = month_year && month_year !== 'all' ? month_year : new Date().toISOString().slice(0, 7);
    await ensureExpensesGenerated(targetMonth);
    await ensureStudentBillingsGenerated(targetMonth);

    const dateRange = getMonthDateRange(targetMonth);
    const dateParams = dateRange ? [dateRange.startDate, dateRange.endDate] : [`${targetMonth}-01`, `${targetMonth}-31`];

    const [revRes, expRes, fixedRes, history] = await Promise.all([
      query(`
        SELECT COALESCE(SUM(amount), 0) as total_receitas, COUNT(*) as count_receitas
        FROM gym_billing
        WHERE status = 'paid' AND due_date >= $1 AND due_date <= $2
      `, dateParams),
      query(`
        SELECT COALESCE(SUM(amount), 0) as total_despesas, COUNT(*) as count_despesas
        FROM gym_expenses
        WHERE status = 'PAID' AND due_date >= $1 AND due_date <= $2
      `, dateParams),
      query(`
        SELECT COALESCE(SUM(base_amount), 0) as total_custo_fixo
        FROM gym_expense_recurrences
        WHERE status = 'ACTIVE'
      `),
      getMonthlyProfitHistory(6)
    ]);

    const receitas = parseFloat(revRes.rows[0]?.total_receitas || 0);
    const despesas = parseFloat(expRes.rows[0]?.total_despesas || 0);
    const custoFixo = parseFloat(fixedRes.rows[0]?.total_custo_fixo || 0);
    const lucroLiquido = receitas - despesas;
    
    const mensalidadeMedia = 150;
    const alunosPontoEquilibrio = custoFixo > 0 ? Math.ceil(custoFixo / mensalidadeMedia) : 0;

    return {
      receitas,
      despesas,
      lucro_liquido: lucroLiquido,
      custo_fixo: custoFixo,
      alunos_ponto_equilibrio: alunosPontoEquilibrio,
      mensalidade_media: mensalidadeMedia,
      history
    };
  }, 30);
}

