import React, { useState, useMemo } from 'react';
import { MOCK_ORDERS, MOCK_USERS } from '../constants';
import { Order, OrderStatus, Role } from '../types';

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

const AdminDashboard: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL');
    const analysts = MOCK_USERS.filter(u => u.role === Role.Analyst);

    const filteredOrders = useMemo(() => {
        if (filterStatus === 'ALL') return orders;
        return orders.filter(order => order.status === filterStatus);
    }, [orders, filterStatus]);

    const assignAnalyst = (orderId: string, analystId: string) => {
        const analyst = analysts.find(a => a.id === analystId);
        if (!analyst) return;

        setOrders(prevOrders => prevOrders.map(order =>
            order.id === orderId ? { ...order, analyst, status: OrderStatus.InProgress } : order
        ));
    };

    const stats = useMemo(() => ({
        total: orders.length,
        pending: orders.filter(o => o.status === OrderStatus.Pending).length,
        inProgress: orders.filter(o => o.status === OrderStatus.InProgress).length,
        completed: orders.filter(o => o.status === OrderStatus.Completed).length,
    }), [orders]);

    return (
        <div className="bg-slate-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-brand-primary mb-8">Painel Administrativo</h1>
                
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-slate-500">Total de Pedidos</h3><p className="text-3xl font-bold">{stats.total}</p></div>
                    <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-slate-500">Pendentes</h3><p className="text-3xl font-bold text-yellow-500">{stats.pending}</p></div>
                    <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-slate-500">Em Análise</h3><p className="text-3xl font-bold text-blue-500">{stats.inProgress}</p></div>
                    <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-slate-500">Concluídos</h3><p className="text-3xl font-bold text-green-500">{stats.completed}</p></div>
                </div>

                {/* Filters */}
                <div className="mb-4">
                    <select onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'ALL')} className="p-2 border rounded-lg">
                        <option value="ALL">Todos os Status</option>
                        <option value={OrderStatus.Pending}>Pendente</option>
                        <option value={OrderStatus.InProgress}>Em Análise</option>
                        <option value={OrderStatus.Completed}>Concluído</option>
                        <option value={OrderStatus.Canceled}>Cancelado</option>
                    </select>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pedido</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Serviço</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Analista</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.client.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.service.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={order.status} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {order.analyst ? order.analyst.name : (
                                                <select onChange={(e) => assignAnalyst(order.id, e.target.value)} className="text-xs p-1 border rounded" defaultValue="">
                                                    <option value="" disabled>Atribuir...</option>
                                                    {analysts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;