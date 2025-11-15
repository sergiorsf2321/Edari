import { Service, ServiceId, User, Role, Order, OrderStatus } from './types';

export const SERVICES: Service[] = [
  {
    id: ServiceId.QualifiedSearch,
    name: 'Pesquisa Qualificada',
    description: 'Localiza imóveis de pessoas físicas ou jurídicas em base compartilhada pelos Cartórios de Registro de Imóveis.',
    price: 150,
    duration: 'Até 5 dias úteis',
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
    description: 'Certidão oficial digital, assinada eletronicamente, com validade de 30 dias e emitida pelo cartório competente.',
    price: 80,
    duration: 'Até 5 dias úteis',
    features: [
      'Documento oficial com validade jurídica',
      'Assinatura eletrônica do cartório',
      'Válida por 30 dias para transações',
      'Entregue digitalmente em seu painel',
    ]
  },
  {
    id: ServiceId.PreAnalysis,
    name: 'Pré-Análise e Intermediação Registral',
    description: 'Analisamos previamente toda a documentação, identificamos pendências e orientamos como resolvê-las. Quando estiver tudo adequado, realizamos o protocolo no cartório.',
    price: null,
    duration: 'Personalizado',
    features: [
      'Análise de contratos, escrituras, plantas, etc.',
      'Diagnóstico de pendências registrais',
      'Orientação técnica para regularização',
      'Serviço de protocolo e intermediação',
    ]
  },
  {
    id: ServiceId.DocPreparation,
    name: 'Preparação Documental',
    description: 'Elaboramos requerimentos, plantas, memoriais descritivos e demais documentos necessários para averbações.',
    price: null,
    duration: 'Personalizado',
    features: [
      'Elaboração de requerimentos específicos',
      'Criação de plantas e memoriais descritivos',
      'Documentação para averbações diversas',
      'Comunicação direta com especialistas',
    ]
  },
  {
    id: ServiceId.ITBIRequest,
    name: 'Emissão de ITBI',
    description: 'Realizamos a emissão do ITBI nas Secretarias de Finanças para permitir a formalização de contratos ou escrituras.',
    price: 120,
    duration: '2-3 dias úteis',
    features: [
      'Cálculo e emissão da guia de ITBI',
      'Comunicação com a Secretaria de Finanças',
      'Agilidade para sua transação imobiliária',
      'Evita erros e burocracia',
    ]
  },
  {
    id: ServiceId.TechnicalReport,
    name: 'Parecer Técnico de Matrícula',
    description: 'Relatório preciso e técnico que vai indicar quais requisitos legais são necessários para regularizar no seu imóvel.',
    price: 99,
    duration: 'Até 3 dias úteis',
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
    description: 'Receba um relatório bem detalhado que explica se essa pendência procede ou não e como você poderá solucioná-la.',
    price: null,
    duration: 'Personalizado',
    features: [
      'Análise técnica da nota devolutiva',
      'Relatório com parecer fundamentado',
      'Orientações para cumprimento das exigências',
      'Estratégia para recurso, se aplicável',
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
        total: 150,
        createdAt: new Date('2023-10-26T10:00:00Z'),
        updatedAt: new Date('2023-10-27T10:00:00Z'),
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
        total: 80,
        createdAt: new Date('2023-10-20T10:00:00Z'),
        updatedAt: new Date('2023-10-25T15:00:00Z'),
        report: { name: 'relatorio_final.pdf', size: 1024 * 300, type: 'application/pdf' },
        description: 'Preciso de ajuda para regularizar a averbação da construção da minha casa. Os documentos anexados são o contrato de compra do terreno e a planta aprovada pela prefeitura.',
        messages: [
            { id: 'msg-3', sender: MOCK_USERS[3], content: 'Olá Ana, análise concluída. O relatório final está disponível para download.', createdAt: new Date('2023-10-25T14:55:00Z'), attachment: { name: 'relatorio_final.pdf', size: 1024 * 300, type: 'application/pdf' } },
        ],
    },
    {
        id: 'ORD-003',
        client: { id: 'user-5', name: 'Outro Cliente', email: 'outro@cliente.com', role: Role.Client },
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