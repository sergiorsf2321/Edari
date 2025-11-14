import { Service, ServiceId, User, Role, Order, OrderStatus } from './types';

export const SERVICES: Service[] = [
  {
    id: ServiceId.Exam,
    name: 'Exame Documental Completo',
    description: 'Análise detalhada de toda documentação imobiliária.',
    price: 450,
    duration: '3-5 dias úteis',
    features: [
        'Análise de matrícula',
        'Verificação de certidões',
        'Checagem de ônus e gravames',
        'Relatório técnico detalhado'
      ]
  },
  {
    id: ServiceId.Adaptation,
    name: 'Adequação Registral',
    description: 'Regularização e atualização de registros imobiliários.',
    price: 890,
    duration: '7-10 dias úteis',
    features: [
        'Correção de divergências',
        'Atualização cadastral',
        'Protocolo em cartório',
        'Acompanhamento do processo'
      ]
  },
  {
    id: ServiceId.Express,
    name: 'Diagnóstico Express',
    description: 'Análise rápida para identificar irregularidades.',
    price: 280,
    duration: '24-48 horas',
    features: [
        'Análise preliminar',
        'Identificação de pendências',
        'Relatório simplificado',
        'Recomendações de ação'
      ]
  },
  {
    id: ServiceId.Consulting,
    name: 'Consultoria Patrimonial',
    description: 'Gestão completa de carteira de imóveis.',
    price: null,
    duration: 'Personalizado',
    features: [
        'Análise de portfólio',
        'Gestão de documentação',
        'Acompanhamento mensal',
        'Relatórios gerenciais'
      ]
  },
];

export const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'Ana Cliente', email: 'ana@cliente.com', role: Role.Client },
    { id: 'user-2', name: 'Bruno Analista', email: 'bruno@analista.com', role: Role.Analyst },
    { id: 'user-3', name: 'Carlos Admin', email: 'carlos@admin.com', role: Role.Admin },
    { id: 'user-4', name: 'Fernanda Analista', email: 'fernanda@analista.com', role: Role.Analyst },
];

export const MOCK_ORDERS: Order[] = [
    {
        id: 'ORD-001',
        client: MOCK_USERS[0],
        service: SERVICES[0],
        analyst: MOCK_USERS[1],
        status: OrderStatus.InProgress,
        isUrgent: true,
        propertyType: 'Apartamento',
        documents: [{ name: 'matricula.pdf', size: 1024 * 500, type: 'application/pdf' }],
        total: 450 * 1.5,
        createdAt: new Date('2023-10-26T10:00:00Z'),
        updatedAt: new Date('2023-10-27T10:00:00Z'),
    },
    {
        id: 'ORD-002',
        client: MOCK_USERS[0],
        service: SERVICES[1],
        analyst: MOCK_USERS[3],
        status: OrderStatus.Completed,
        isUrgent: false,
        propertyType: 'Casa',
        documents: [{ name: 'contrato.pdf', size: 1024 * 800, type: 'application/pdf' }, { name: 'planta.jpg', size: 1024 * 1200, type: 'image/jpeg' }],
        total: 890,
        createdAt: new Date('2023-10-20T10:00:00Z'),
        updatedAt: new Date('2023-10-25T15:00:00Z'),
        report: { name: 'relatorio_final.pdf', size: 1024 * 300, type: 'application/pdf' }
    },
    {
        id: 'ORD-003',
        client: { id: 'user-5', name: 'Outro Cliente', email: 'outro@cliente.com', role: Role.Client },
        service: SERVICES[2],
        status: OrderStatus.Pending,
        isUrgent: false,
        propertyType: 'Terreno',
        documents: [],
        total: 280,
        createdAt: new Date('2023-10-28T11:00:00Z'),
        updatedAt: new Date('2023-10-28T11:00:00Z'),
    },
];