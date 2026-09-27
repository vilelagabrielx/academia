import { Pool } from 'pg';
import crypto from 'crypto';

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

// Students CRUD
export async function getStudents(search = '') {
  let sql = `
    SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.is_staff, u.date_joined,
           p.whatsapp, p.photo_base64, p.gym_id, p.age, p.height, p.goal, p.blood_type, p.training_days, p.current_weight,
           (SELECT COUNT(*) FROM manager_routine r WHERE r.user_id = u.id) as routine_count,
           (SELECT b.amount FROM gym_billing b WHERE b.user_id = u.id ORDER BY b.due_date DESC LIMIT 1) as latest_billing_amount,
           (SELECT b.status FROM gym_billing b WHERE b.user_id = u.id ORDER BY b.due_date DESC LIMIT 1) as latest_billing_status,
           (SELECT b.due_date FROM gym_billing b WHERE b.user_id = u.id ORDER BY b.due_date DESC LIMIT 1) as latest_billing_due_date,
           (SELECT b.amount FROM gym_billing b WHERE b.user_id = u.id AND b.status = 'paid' ORDER BY b.paid_date DESC LIMIT 1) as last_paid_amount,
           (SELECT b.paid_date FROM gym_billing b WHERE b.user_id = u.id AND b.status = 'paid' ORDER BY b.paid_date DESC LIMIT 1) as last_paid_date
    FROM auth_user u
    LEFT JOIN core_userprofile p ON p.user_id = u.id
    WHERE u.is_staff = false AND u.is_superuser = false
  `;
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.username ILIKE $1 OR u.email ILIKE $1 OR p.whatsapp ILIKE $1)`;
  }
  sql += ` ORDER BY u.date_joined DESC`;
  const res = await query(sql, params);
  return res.rows;
}

export async function createStudent({
  first_name,
  last_name = '',
  username = '',
  email = '',
  password = '',
  whatsapp = '',
  photo_base64 = '',
  age = null,
  height = null,
  current_weight = null,
  blood_type = '',
  goal = '',
  training_days = '',
  initial_amount = null,
  due_date = null,
}) {
  const cleanFirstName = (first_name || 'Aluno').trim();
  let finalUsername = (username || cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')).trim();
  if (!finalUsername) finalUsername = `aluno_${Date.now().toString().slice(-4)}`;

  // Ensure unique username
  const checkUser = await query(`SELECT id FROM auth_user WHERE username = $1`, [finalUsername]);
  if (checkUser.rows.length > 0) {
    finalUsername = `${finalUsername}_${Math.floor(100 + Math.random() * 900)}`;
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
     (user_id, is_temporary, workout_reminder_active, workout_reminder, workout_duration, notification_language_id, weight_unit, num_days_weight_reminder, can_add_user, trophies_enabled, time_zone, whatsapp, photo_base64, age, height, current_weight, blood_type, goal, training_days)
     VALUES ($1, false, false, 14, 12, 2, 'kg', 0, false, true, '', $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      userId,
      whatsapp || '',
      photo_base64 || '',
      age ? parseInt(age, 10) : null,
      height ? parseInt(height, 10) : null,
      current_weight ? parseFloat(current_weight) : null,
      blood_type || '',
      goal || '',
      training_days || '',
    ]
  );

  // Create initial billing if provided
  if (initial_amount && due_date) {
    await query(
      `INSERT INTO gym_billing (user_id, amount, due_date, payment_method, status, notes)
       VALUES ($1, $2, $3, 'Pix', 'pending', 'Mensalidade Inicial')`,
      [userId, parseFloat(initial_amount), due_date]
    );
  }

  return userRes.rows[0];
}

export async function updateStudent(id, {
  first_name,
  last_name,
  email,
  whatsapp,
  photo_base64,
  password,
  age,
  height,
  current_weight,
  blood_type,
  goal,
  training_days,
}) {
  let sql = `UPDATE auth_user SET first_name = $1, last_name = $2, email = $3`;
  const params = [first_name || '', last_name || '', email || ''];
  
  if (password) {
    params.push(hashDjangoPassword(password));
    sql += `, password = $${params.length}`;
  }
  
  params.push(id);
  sql += ` WHERE id = $${params.length}`;
  await query(sql, params);

  await query(
    `UPDATE core_userprofile 
     SET whatsapp = $1, 
         photo_base64 = COALESCE(NULLIF($2, ''), photo_base64),
         age = $3,
         height = $4,
         current_weight = $5,
         blood_type = $6,
         goal = $7,
         training_days = $8
     WHERE user_id = $9`,
    [
      whatsapp || '',
      photo_base64 || '',
      age ? parseInt(age, 10) : null,
      height ? parseInt(height, 10) : null,
      current_weight ? parseFloat(current_weight) : null,
      blood_type || '',
      goal || '',
      training_days || '',
      id,
    ]
  );

  return { id };
}

export async function deleteStudent(id) {
  await query(`DELETE FROM gym_billing WHERE user_id = $1`, [id]);
  await query(`DELETE FROM core_userprofile WHERE user_id = $1`, [id]);
  await query(`DELETE FROM manager_workoutlog WHERE user_id = $1`, [id]);
  await query(`DELETE FROM manager_workoutsession WHERE user_id = $1`, [id]);
  await query(`DELETE FROM manager_routine WHERE user_id = $1`, [id]);
  await query(`DELETE FROM auth_user WHERE id = $1`, [id]);
  return true;
}

// Exercises
export async function getExercises(search = '', categoryId = null) {
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
}

export async function createExercise({ name, description, category_id }) {
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

export async function getBillingSummary() {
  await query(
    `UPDATE gym_billing SET status = 'overdue' WHERE due_date < CURRENT_DATE AND status = 'pending'`
  );
  await query(
    `UPDATE gym_billing SET status = 'overdue' WHERE remind_at < CURRENT_DATE AND status = 'charged'`
  );

  const res = await query(`
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
      COALESCE(SUM(CASE WHEN status = 'charged' THEN amount ELSE 0 END), 0) as total_charged,
      COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as total_overdue,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as count_paid,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as count_pending,
      COUNT(CASE WHEN status = 'charged' THEN 1 END) as count_charged,
      COUNT(CASE WHEN status = 'overdue' THEN 1 END) as count_overdue
    FROM gym_billing
  `);
  return res.rows[0];
}

export async function getBillings({ status, user_id, search } = {}) {
  await query(
    `UPDATE gym_billing SET status = 'overdue' WHERE due_date < CURRENT_DATE AND status = 'pending'`
  );
  await query(
    `UPDATE gym_billing SET status = 'overdue' WHERE remind_at < CURRENT_DATE AND status = 'charged'`
  );

  let sql = `
    SELECT b.*, u.username, u.first_name, u.last_name, u.email, p.whatsapp, p.photo_base64
    FROM gym_billing b
    JOIN auth_user u ON u.id = b.user_id
    LEFT JOIN core_userprofile p ON p.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

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

export async function createBilling({ user_id, amount, due_date, payment_method = 'Pix', notes = '' }) {
  const status = new Date(due_date) < new Date(new Date().setHours(0,0,0,0)) ? 'overdue' : 'pending';
  const res = await query(
    `INSERT INTO gym_billing (user_id, amount, due_date, payment_method, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, parseFloat(amount), due_date, payment_method, status, notes]
  );
  return res.rows[0];
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

export async function updateBillingStatus(id, { status, paid_date, receipt_generated, notes, proof_base64, proof_filename }) {
  let sql = `UPDATE gym_billing SET status = $1`;
  const params = [status];

  if (status === 'paid') {
    params.push(paid_date || new Date());
    sql += `, paid_date = $${params.length}`;
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
