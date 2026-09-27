import { createStudent } from '../src/lib/db.js';

async function testStudentCreation() {
  console.log('=== TESTE DE CADASTRO DE ALUNO NO MODO BALCÃO ===');
  try {
    const testData = {
      first_name: 'Xuxu',
      last_name: 'Beleza',
      whatsapp: '5511999999999',
      instagram: '@usuario',
      create_first_billing: true,
      billing_amount: '150.00',
      billing_due_date: new Date().toISOString().split('T')[0]
    };

    const result = await createStudent(testData);
    console.log('✓ Aluno cadastrado com sucesso:', result);
  } catch (err) {
    console.error('❌ Erro ao cadastrar aluno:', err);
    process.exit(1);
  }
}

testStudentCreation();
