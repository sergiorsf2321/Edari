import React from 'react';
import { OrderStatus } from '../types';

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
    const statusInfo = {
        [OrderStatus.AwaitingQuote]: { text: 'Aguard. Orçamento', color: 'bg-purple-100 text-purple-800' },
        [OrderStatus.Pending]: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
        [OrderStatus.InProgress]: { text: 'Em Análise', color: 'bg-blue-100 text-blue-800' },
        [OrderStatus.Completed]: { text: 'Concluído', color: 'bg-green-100 text-green-800' },
        [OrderStatus.Canceled]: { text: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };
    const info = statusInfo[status] || { text: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.color}`}>{info.text}</span>;
};

export default StatusBadge;