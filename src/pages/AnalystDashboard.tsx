import React from 'react';
import { useAuth } from '../App';
import { Order, OrderStatus, Page } from '../types';
import StatusBadge from '../components/StatusBadge';

const AnalystDashboard: React.FC = () => {
    const { user, orders, setPage, setSelectedOrder } = useAuth();
    const assignedOrders = orders.filter(order => order.analyst?.id === user?.id);
    
    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
        setPage(Page.OrderDetail);
    };

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
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {assignedOrders.map(order => (
                                    <tr key={order.id} onClick={() => handleOrderClick(order)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.client.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.service.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{new Date(order.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <StatusBadge status={order.status} />
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