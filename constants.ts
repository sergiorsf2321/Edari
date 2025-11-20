import { Service, ServiceId, User, Role, Order, OrderStatus } from './types';

export const SERVICES: Service[] = [
  {
    id: ServiceId.QualifiedSearch,
    name: 'Pesquisa Registral de Matrículas',
    description: 'Localizamos e solicitamos matrículas de imóveis buscando por CPF/CNPJ nos cartórios.',
    price: 49.90,
    duration: 'Até 6 dias úteis',
    features: [
      'Busca por CPF ou CNPJ',
      'Retorna até 10 matrículas por pesquisa',
      'Identificação de vínculo (proprietário, credor, etc.)',
      'Relatório simplificado com os achados',
    ]
  },
  {
    id: ServiceId.DigitalCertificate,
    name: 'Certidão Digital',
    description: 'Obtenção de certidões oficiais com validade jurídica.',
    price: 169.90,
    duration: 'Até 6 dias úteis',
    features: [
      'Documento oficial com validade jurídica',
      'Assinatura eletrônica do cartório',
      'Válida por 30 dias para transações',
      'Entregue digitalmente em seu painel',
    ]
  },
  {
    id: ServiceId.PreAnalysis,
    name: 'Pré-Conferência Documental',
    description: 'Conferimos sua documentação contra os requisitos de registro, apontando pendências de formato e informações faltantes para o cartório competente.',
    price: null,
    duration: 'Personalizado',
    features: [
      'Análise de contratos, escrituras, plantas, etc.',
      'Conferência Detalhada',
      'Indicação de próximos passos para a regularização',
    ]
  },
  {
    id: ServiceId.RegistryIntermediation,
    name: 'Apoio ao Protocolo Registral',
    description: 'Realizamos o protocolo e acompanhamento do seu processo de forma digital na plataforma. Os custos de cartório (emolumentos) serão repassados de forma transparente dentro da plataforma.',
    price: 150,
    duration: 'Personalizado',
    features: [
      'Protocolo digital via ONR',
      'A documentação precisa ser toda nato-digital',
      'Acompanhamento proativo do processo',
      'Comunicação de exigências e pendências',
      'Repasse transparente de custos cartorários',
    ]
  },
  {
    id: ServiceId.DocPreparation,
    name: 'Preparação Documental',
    description: 'Elaboração e formatação final de requerimentos específicos, memoriais e documentação para averbações na matrícula do imóvel.',
    price: null,
    duration: 'Personalizado',
    features: [
      'Elaboração de requerimentos específicos',
      'Formatação e digitação de memoriais descritivos',
      'Documentação para averbações diversas',
    ]
  },
  {
    id: ServiceId.TechnicalReport,
    name: 'Relatório de Conformidade de Matrícula',
    description: 'Analisamos a matrícula e entregamos um relatório detalhado de conformidade, indicando as pendências administrativas e documentais para a adequação.',
    price: 199.90,
    duration: 'Até 4 dias úteis',
    features: [
      'Análise técnica da matrícula',
      'Identificação de pendências registrais',
      'Relatório com orientações claras',
      'Indicação dos próximos passos para regularização',
    ]
  },
  {
    id: ServiceId.DevolutionaryNoteAnalysis,
    name: 'Análises de Notas Devolutivas',
    description: 'Analisamos a nota devolutiva e fornecemos um relatório de requisitos para o cumprimento das exigências formais do cartório.',
    price: null,
    duration: 'Personalizado',
    features: [
      'Análise técnica da nota devolutiva',
      'Relatório de Requisitos',
      'Orientações para cumprimento das exigências',
    ]
  },
];

export const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'Ana Cliente', email: 'ana@cliente.com', role: Role.Client, isVerified: true },
    { id: 'user-2', name: 'Bruno Analista', email: 'bruno@analista.com', role: Role.Analyst, isVerified: true },
    { id: 'user-3', name: 'Carlos Admin', email: 'carlos@admin.com', role: Role.Admin, isVerified: true },
    { id: 'user-4', name: 'Fernanda Analista', email: 'fernanda@analista.com', role: Role.Analyst, isVerified: true },
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
        total: 49.90,
        createdAt: new Date('2023-10-26T10:00:00Z'),
        updatedAt: new Date('2023-10-27T10:00:00Z'),
        paymentConfirmedAt: new Date('2023-10-26T10:05:00Z'),
        description: 'Gostaria de uma análise completa da matrícula do meu apartamento. Tenho urgência pois estou em processo de venda. A documentação parece estar ok, mas quero ter certeza antes de assinar o contrato de compra e venda.',
        messages: [
            { id: 'msg-1', sender: MOCK_USERS[0], content: 'Olá, acabei de enviar a matrícula para análise.', createdAt: new Date('2023-10-26T10:05:00Z') },
            { id: 'msg-2', sender: MOCK_USERS[1], content: 'Recebido, Ana. Iniciarei a análise e te mantenho informada por aqui.', createdAt: new Date('2023-10-26T11:00:00Z') },
        ],
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
        total: 169.90,
        createdAt: new Date('2023-10-20T10:00:00Z'),
        updatedAt: new Date('2023-10-25T15:00:00Z'),
        paymentConfirmedAt: new Date('2023-10-20T10:05:00Z'),
        report: { name: 'relatorio_final.pdf', size: 1024 * 300, type: 'application/pdf' },
        description: 'Preciso de ajuda para regularizar a averbação da construção da minha casa. Os documentos anexados são o contrato de compra do terreno e a planta aprovada pela prefeitura.',
        messages: [
            { id: 'msg-3', sender: MOCK_USERS[3], content: 'Olá Ana, análise concluída. O relatório final está disponível para download.', createdAt: new Date('2023-10-25T14:55:00Z'), attachment: { name: 'relatorio_final.pdf', size: 1024 * 300, type: 'application/pdf' } },
        ],
    },
    {
        id: 'ORD-003',
        client: { id: 'user-5', name: 'Outro Cliente', email: 'outro@cliente.com', role: Role.Client, isVerified: true },
        service: SERVICES[2],
        status: OrderStatus.Pending,
        isUrgent: false,
        propertyType: 'Terreno',
        documents: [{ name: 'documento_posse.docx', size: 1024 * 150, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }],
        total: 0,
        createdAt: new Date('2023-10-28T11:00:00Z'),
        updatedAt: new Date('2023-10-28T11:00:00Z'),
        description: 'Quero uma análise rápida sobre este terreno. Estou pensando em comprar, mas só tenho um documento de posse antigo, é possível?',
        messages: [],
    },
];