import React from 'react';
import { useAuth } from '../App';
import { MOCK_ORDERS } from '../constants';
import { Order, OrderStatus } from '../types';

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
    const statusInfo = {
        [OrderStatus.Pending]: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
        [OrderStatus.InProgress]: { text: 'Em Análise', color: 'bg-blue-100 text-blue-800' },
        [OrderStatus.Completed]: { text: 'Concluído', color: 'bg-green-100 text-green-800' },
        [OrderStatus.Canceled]: { text: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };
    const info = statusInfo[status] || { text: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.color}`}>{info.text}</span>;
};

const AnalystDashboard: React.FC = () => {
    const { user } = useAuth();
    const assignedOrders = MOCK_ORDERS.filter(order => order.analyst?.id === user?.id);
    
    return (
        <div className="bg-slate-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-brand-primary mb-8">Pedidos Atribuídos</h1>
                
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pedido</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Serviço</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prazo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {assignedOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.client.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.service.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{new Date(order.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button className="text-brand-secondary hover:text-brand-primary">Analisar</button>
                                            <button className="text-slate-600 hover:text-slate-900">Comentários</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                 {assignedOrders.length === 0 && (
                     <div className="text-center py-16 bg-white rounded-lg shadow">
                        <h2 className="text-xl font-medium text-slate-700">Nenhum pedido atribuído a você no momento.</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalystDashboard;