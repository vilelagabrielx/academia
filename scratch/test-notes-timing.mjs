import { query } from '../src/lib/db.js';

async function benchmark() {
  console.time('Total getQuickNotes execution');

  console.time('1. SELECT notes query');
  const res = await query(`
    SELECT 
      n.id, n.category, n.student_id, n.billing_id, n.expense_id, n.title, n.content, n.color, n.is_pinned, n.created_at, n.updated_at,
      u.username, u.first_name, u.last_name, u.email, p.whatsapp, p.photo_base64,
      b.amount as billing_amount, b.due_date as billing_due_date, b.status as billing_status,
      e.description as expense_description, e.amount as expense_amount, e.status as expense_status
    FROM gym_quick_notes n
    LEFT JOIN auth_user u ON u.id = n.student_id
    LEFT JOIN core_userprofile p ON p.user_id = u.id
    LEFT JOIN gym_billing b ON b.id = n.billing_id
    LEFT JOIN gym_expenses e ON e.id = n.expense_id
    ORDER BY n.is_pinned DESC, n.created_at DESC, n.id DESC
    LIMIT 20 OFFSET 0
  `);
  console.timeEnd('1. SELECT notes query');
  console.timeEnd('Total getQuickNotes execution');

  console.log(`Fetched ${res.rows.length} rows.`);
  process.exit(0);
}

benchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});
