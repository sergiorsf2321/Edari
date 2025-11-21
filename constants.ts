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
    price: 349.90,
    duration: 'Até 6 dias úteis',
    features: [
      'Documento oficial com validade jurídica',
      'Assinatura eletrônica do cartório',
      'Casamento, nascimento ou matrícula de imóvel',
      'Entregue digitalmente em seu painel',
    ]
  },
  {
    id: ServiceId.PreAnalysis,
    name: 'Pré-Conferência Documental',
    description: 'Conferimos sua documentação contra os requisitos de registro, apontando pendências de formato e informações faltantes para o cartório competente.',
    price: null, // Sob Orçamento
    duration: 'Personalizado',
    features: [
      'Análise de contratos, escrituras, plantas, etc.',
      'Conferência Detalhada',
      'Indicação de próximos passos para a regularização',
    ]
  },
  {
    id: ServiceId.RegistryIntermediation,
    name: 'Protocolo Registral',
    description: 'Realizamos o protocolo e acompanhamento do seu processo de forma digital na plataforma ONR. Os custos de cartório (emolumentos) serão repassados de forma transparente dentro da plataforma.',
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
    price: null, // Sob Orçamento
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
    price: null, // Sob Orçamento
    duration: 'Personalizado',
    features: [
      'Análise técnica da nota devolutiva',
      'Relatório de Requisitos',
      'Orientações para cumprimento das exigências',
    ]
  },
];
