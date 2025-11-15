import React from 'react';
import { useAuth } from '../App';
import { Order, OrderStatus, Page } from '../types';
import StatusBadge from '../components/StatusBadge';

const ClientDashboard: React.FC = () => {
    const { user, setPage, orders, setSelectedOrder } = useAuth();
    const clientOrders = orders.filter(order => order.client.id === user?.id);

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
        setPage(Page.OrderDetail);
    };

    return (
        <div className="bg-slate-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-brand-primary">Meus Pedidos</h1>
                    <button
                        onClick={() => setPage(Page.Order)}
                        className="bg-brand-accent text-white font-bold py-2 px-5 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Contratar Novo Serviço
                    </button>
                </div>
                
                {clientOrders.length > 0 ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pedido</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Serviço</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Última Atualização</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {clientOrders.map(order => (
                                        <tr key={order.id} onClick={() => handleOrderClick(order)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.service.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.createdAt.toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.updatedAt.toLocaleDateString('pt-BR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                     <div className="text-center py-16 bg-white rounded-lg shadow">
                        <h2 className="text-xl font-medium text-slate-700">Nenhum pedido encontrado.</h2>
                        <p className="text-slate-500 mt-2">Clique no botão acima para contratar um novo serviço.</p>
                         <button
                            onClick={() => setPage(Page.Order)}
                            className="mt-6 bg-brand-accent text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Contratar Serviço
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientDashboard;