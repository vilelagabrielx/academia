import { query } from '../src/lib/db.js';

async function benchmarkBillingsNoBlob() {
  console.log('--- TESTING GET BILLINGS WITHOUT HEAVY PROOF BASE64 BLOB ---');

  // Connection warmup
  await query('SELECT 1;');

  const t0 = performance.now();
  const res = await query(`
    SELECT b.id, b.user_id, b.amount, b.due_date, b.payment_method,
           CASE 
             WHEN (b.status = 'pending' AND b.due_date < CURRENT_DATE) THEN 'overdue'
             WHEN (b.status = 'charged' AND b.remind_at < CURRENT_DATE) THEN 'overdue'
             ELSE b.status
           END AS status,
           b.notes, b.receipt_generated, b.paid_date, b.created_at,
           b.is_recurring, b.recurrence_id, b.cancel_reason, b.remind_at,
           (CASE WHEN b.proof_base64 IS NOT NULL AND b.proof_base64 != '' THEN true ELSE false END) as has_proof,
           b.proof_filename,
           u.username, u.first_name, u.last_name, u.email, p.whatsapp, p.photo_base64
    FROM gym_billing b
    JOIN auth_user u ON u.id = b.user_id AND u.is_active = true
    LEFT JOIN core_userprofile p ON p.user_id = u.id
    WHERE 1=1
    ORDER BY b.due_date ASC, b.id DESC
  `);
  const t1 = performance.now();

  console.log(`Optimized getBillings query execution time: ${(t1 - t0).toFixed(2)} ms (Rows: ${res.rows.length})`);

  process.exit(0);
}

benchmarkBillingsNoBlob().catch(err => {
  console.error(err);
  process.exit(1);
});
