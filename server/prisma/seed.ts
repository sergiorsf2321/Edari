const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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
  console.log('Iniciando seed...');

  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {},
      create: service,
    });
  }

  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@edari.com.br' },
    update: {},
    create: {
      email: 'admin@edari.com.br',
      name: 'Super Admin',
      role: 'ADMIN',
      passwordHash,
      isVerified: true,
      phone: '5511999999999'
    },
  });

  console.log('Seed finalizado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });