import { getBillingsWithSummary } from '../src/lib/db.js';

async function testCurrentMonthBillings() {
  console.log('--- TESTING BILLINGS FOR CURRENT MONTH VS ALL MONTHS ---');
  const currentMonth = new Date().toISOString().slice(0, 7);

  console.log(`Current month: ${currentMonth}`);

  const allBillingsRes = await getBillingsWithSummary({ month_year: null });
  console.log('\n--- WITHOUT MONTH FILTER (ALL TIME / RECURRING) ---');
  console.log('Total billings found:', allBillingsRes.billings.length);
  console.log('Summary:', allBillingsRes.summary);

  const monthBillingsRes = await getBillingsWithSummary({ month_year: currentMonth });
  console.log(`\n--- WITH CURRENT MONTH FILTER (${currentMonth}) ---`);
  console.log('Total billings found for current month:', monthBillingsRes.billings.length);
  console.log('Summary:', monthBillingsRes.summary);

  process.exit(0);
}

testCurrentMonthBillings().catch(err => {
  console.error(err);
  process.exit(1);
});
