import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SERVICES = [
  { id: 'qualified_search', name: 'Pesquisa Registral de Matrículas', basePrice: 49.90 },
  { id: 'digital_certificate', name: 'Certidão Digital', basePrice: 349.90 },
  { id: 'pre_analysis', name: 'Pré-Conferência Documental', basePrice: null },
  { id: 'registry_intermediation', name: 'Protocolo Registral', basePrice: 150.00 },
  { id: 'doc_preparation', name: 'Preparação Documental', basePrice: null },
  { id: 'technical_report', name: 'Relatório de Conformidade de Matrícula', basePrice: 199.90 },
  { id: 'devolutionary_note_analysis', name: 'Análises de Notas Devolutivas', basePrice: null },
];

async function main() {
  console.log('🌱 Iniciando seed...');

  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: { name: service.name, basePrice: service.basePrice },
      create: service,
    });
    console.log(`  ✅ Serviço: ${service.name}`);
  }

  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'edari.docs@gmail.com' },
    update: { passwordHash },
    create: {
      email: 'edari.docs@gmail.com',
      name: 'Super Admin',
      role: 'ADMIN',
      passwordHash,
      isVerified: true,
      phone: '85996231572',
      cpf: '068.263.473-50',
      address: 'Sede Edari',
      birthDate: '23/01/1996'
    },
  });
  console.log(`  ✅ Admin: ${admin.email} (senha: admin123)`);

  const analyst = await prisma.user.upsert({
    where: { email: 'analista@edari.com.br' },
    update: { passwordHash },
    create: {
      email: 'analista@edari.com.br',
      name: 'Bruno Analista',
      role: 'ANALYST',
      passwordHash,
      isVerified: true,
      phone: '11999998888',
    },
  });
  console.log(`  ✅ Analista: ${analyst.email} (senha: admin123)`);

  const client = await prisma.user.upsert({
    where: { email: 'cliente@teste.com' },
    update: { passwordHash },
    create: {
      email: 'cliente@teste.com',
      name: 'Ana Cliente',
      role: 'CLIENT',
      passwordHash,
      isVerified: true,
      phone: '11988887777',
      cpf: '123.456.789-00',
      address: 'Rua Teste, 123',
      birthDate: '01/01/1990'
    },
  });
  console.log(`  ✅ Cliente: ${client.email} (senha: admin123)`);

  console.log('\n🎉 Seed finalizado com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('   Admin:    edari.docs@gmail.com / admin123');
  console.log('   Analista: analista@edari.com.br / admin123');
  console.log('   Cliente:  cliente@teste.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
