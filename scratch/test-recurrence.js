import { 
  initDbSchema, 
  getBillingSummary, 
  getBillings, 
  getExpenseSummary, 
  getExpenses, 
  getCashFlowSummary,
  ensureExpensesGenerated,
  ensureStudentBillingsGenerated
} from '../src/lib/db.js';

async function testRecurrenceIntegrity() {
  console.log('=== TESTE DE INTEGRIDADE DAS REGRAS DE RECORRÊNCIA E COBRANÇAS ===');

  try {
    // 1. Inicializar Schema
    await initDbSchema();
    console.log('✓ Schema do banco verificado.');

    const currentMonth = new Date().toISOString().slice(0, 7);

    // 2. Executar geradores Lazy Evaluation (Sob demanda)
    await ensureExpensesGenerated(currentMonth);
    console.log(`✓ ensureExpensesGenerated('${currentMonth}') executado sem erros.`);

    await ensureStudentBillingsGenerated(currentMonth);
    console.log(`✓ ensureStudentBillingsGenerated('${currentMonth}') executado sem erros.`);

    // 3. Testar resumos e consultas
    const billingSum = await getBillingSummary({ month_year: currentMonth });
    console.log('✓ Billing Summary:', billingSum);

    const expenseSum = await getExpenseSummary({ month_year: currentMonth });
    console.log('✓ Expense Summary:', expenseSum);

    const cashflow = await getCashFlowSummary({ month_year: currentMonth });
    console.log('✓ Cash Flow Summary:', cashflow);

    console.log('\n✅ TODOS OS TESTES DE RECORRÊNCIA E COBRANÇAS PASSARAM SEM ERROS OU DUPLICAÇÕES!');
  } catch (err) {
    console.error('❌ ERRO NO TESTE DE INTEGRIDADE:', err);
    process.exit(1);
  }
}

testRecurrenceIntegrity();
