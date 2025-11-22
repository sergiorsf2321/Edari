
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

  // Gera o hash para a senha 'admin123'
  const passwordHash = await bcrypt.hash('$ergi0F1lh0..J0yc3', 10);
  
  // Criação do Admin
  await prisma.user.upsert({
    where: { email: 'edari.docs@gmail.com' },
    update: {},
    create: {
      email: 'edari.docs@gmail.com',
      name: 'Super Admin',
      role: 'ADMIN',
      passwordHash: passwordHash, // Usa o hash correto para a senha 'admin123'
      isVerified: true,
      phone: '85996231572',
      cpf: '068.263.473-50',
      address: 'Sede Edari',
      birthDate: '23/01/1996'
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
