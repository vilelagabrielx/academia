import { query, getMonthDateRange } from '../src/lib/db.js';

async function testSingleQuerySummary() {
  console.log('--- TESTING SINGLE QUERY WITH IN-MEMORY SUMMARY CALCULATION ---');
  const month_year = '2026-09';
  const dateRange = getMonthDateRange(month_year);

  // Warmup connection
  await query('SELECT 1;');

  const t0 = performance.now();
  
  // Single query
  const res = await query(`
    SELECT 
      b.id, b.user_id, b.amount, b.due_date, b.payment_method,
      CASE 
        WHEN (b.status = 'pending' AND b.due_date < CURRENT_DATE) THEN 'overdue'
        WHEN (b.status = 'charged' AND b.remind_at < CURRENT_DATE) THEN 'overdue'
        ELSE b.status
      END AS status,
      b.notes, b.receipt_generated, b.paid_date, b.created_at,
      b.is_recurring, b.recurrence_id, b.cancel_reason, b.remind_at,
      u.username, u.first_name, u.last_name, u.email, p.whatsapp, p.photo_base64
    FROM gym_billing b
    JOIN auth_user u ON u.id = b.user_id AND u.is_active = true
    LEFT JOIN core_userprofile p ON p.user_id = u.id
    WHERE b.due_date >= $1 AND b.due_date <= $2
    ORDER BY b.due_date ASC, b.id DESC
  `, [dateRange.startDate, dateRange.endDate]);

  const billings = res.rows;

  // In-memory summary calculation (0ms CPU time)
  let total_paid = 0;
  let total_pending = 0;
  let total_charged = 0;
  let total_overdue = 0;
  let count_paid = 0;
  let count_pending = 0;
  let count_charged = 0;
  let count_overdue = 0;

  for (const b of billings) {
    const amt = parseFloat(b.amount || 0);
    const s = String(b.status || '').toLowerCase();

    if (s === 'paid') {
      total_paid += amt;
      count_paid++;
    } else if (s === 'pending') {
      total_pending += amt;
      count_pending++;
    } else if (s === 'charged') {
      total_charged += amt;
      count_charged++;
    } else if (s === 'overdue' || s === 'atrasado') {
      total_overdue += amt;
      count_overdue++;
    }
  }

  const summary = {
    total_paid,
    total_pending,
    total_charged,
    total_overdue,
    total_receber: total_pending + total_charged + total_overdue,
    total_geral: total_paid + total_pending + total_charged + total_overdue,
    count_paid,
    count_pending,
    count_charged,
    count_overdue,
    count_total: billings.length
  };

  const t1 = performance.now();

  console.log(`Single-query + In-memory summary total execution time: ${(t1 - t0).toFixed(2)} ms`);
  console.log('Billings count:', billings.length);
  console.log('Calculated Summary:', summary);

  process.exit(0);
}

testSingleQuerySummary().catch(err => {
  console.error(err);
  process.exit(1);
});
