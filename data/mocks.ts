
import { User, Role, Order, OrderStatus } from '../types';
import { SERVICES } from '../constants';

export const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'Ana Cliente', email: 'ana@cliente.com', role: Role.Client, isVerified: true, cpf: '123.456.789-00', birthDate: '01/01/1990', address: 'Rua Exemplo, 123' },
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
        total: 349.90,
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
        client: { id: 'user-5', name: 'Outro Cliente', email: 'outro@cliente.com', role: Role.Client, isVerified: true, cpf: '987.654.321-00', birthDate: '02/02/1990', address: 'Av Teste, 456' },
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
