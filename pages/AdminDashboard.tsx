import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { MOCK_USERS } from '../constants';
import { Order, OrderStatus, Role, Page } from '../types';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import StatusBadge from '../components/StatusBadge';

const AdminDashboard: React.FC = () => {
    const { orders, updateOrder, setPage, setSelectedOrder } = useAuth();
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL');
    const analysts = MOCK_USERS.filter(u => u.role === Role.Analyst);

    const filteredOrders = useMemo(() => {
        if (filterStatus === 'ALL') return orders;
        return orders.filter(order => order.status === filterStatus);
    }, [orders, filterStatus]);

    const assignAnalyst = (orderId: string, analystId: string) => {
        const analyst = analysts.find(a => a.id === analystId);
        if (!analyst) return;
        
        const orderToUpdate = orders.find(o => o.id === orderId);
        if (!orderToUpdate) return;
        
        updateOrder({ ...orderToUpdate, analyst, status: OrderStatus.InProgress });
    };

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
        setPage(Page.OrderDetail);
    };
    
    const stats = useMemo(() => ({
        total: orders.length,
        awaitingQuote: orders.filter(o => o.status === OrderStatus.AwaitingQuote).length,
        pending: orders.filter(o => o.status === OrderStatus.Pending).length,
        inProgress: orders.filter(o => o.status === OrderStatus.InProgress).length,
        completed: orders.filter(o => o.status === OrderStatus.Completed).length,
    }), [orders]);
    
    const monthlyRevenue = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return orders
            .filter(order => 
                order.status === OrderStatus.Completed &&
                order.createdAt.getMonth() === currentMonth &&
                order.createdAt.getFullYear() === currentYear
            )
            .reduce((sum, order) => sum + order.total, 0);
    }, [orders]);

    const revenueByService = useMemo(() => {
        return orders
            .filter(order => order.status === OrderStatus.Completed)
            // FIX: Explicitly type the accumulator for the reduce function to ensure correct type inference.
            .reduce<Record<string, number>>((acc, order) => {
                const serviceName = order.service.name;
                if (!acc[serviceName]) {
                    acc[serviceName] = 0;
                }
                acc[serviceName] += order.total;
                return acc;
            }, {});
    }, [orders]);

    const statusChartData = useMemo(() => [
        { name: 'Aguard. Orç.', value: stats.awaitingQuote },
        { name: 'Pendentes', value: stats.pending },
        { name: 'Em Análise', value: stats.inProgress },
        { name: 'Concluídos', value: stats.completed },
    ].filter(item => item.value > 0), [stats]);

    const serviceChartData = useMemo(() => {
        const serviceCounts = orders.reduce((acc, order) => {
            const name = order.service.name.split(' ')[0]; // Use first word for brevity
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(serviceCounts).map(([name, count]) => ({
            name,
            Pedidos: count,
        }));
    }, [orders]);

    const STATUS_COLORS = ['#8b5cf6', '#f59e0b', '#3b82f6', '#22c55e']; // Purple, Amber, Blue, Green

    return (
        <div className="bg-slate-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-brand-primary mb-8">Painel Administrativo</h1>
                
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-slate-500">Total</h3><p className="text-3xl font-bold">{stats.total}</p></div>
                    <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-slate-500">Aguard. Orçamento</h3><p className="text-3xl font-bold text-purple-500">{stats.awaitingQuote}</p></div>
                    <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-slate-500">Pendentes</h3><p className="text-3xl font-bold text-yellow-500">{stats.pending}</p></div>
                    <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-slate-500">Em Análise</h3><p className="text-3xl font-bold text-blue-500">{stats.inProgress}</p></div>
                    <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-slate-500">Concluídos</h3><p className="text-3xl font-bold text-green-500">{stats.completed}</p></div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">Distribuição por Status</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    innerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {statusChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                    ))}
                                </Pie>
                                {/* FIX: Changed formatter function parameter type to 'any' to avoid type conflicts with recharts library. */}
                                <Tooltip formatter={(value: any) => [`${value} pedido(s)`]}/>
                                <Legend wrapperStyle={{fontSize: '14px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">Pedidos por Serviço</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={serviceChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12}/>
                                <YAxis allowDecimals={false} width={40}/>
                                <Tooltip />
                                <Legend wrapperStyle={{fontSize: '14px'}}/>
                                <Bar dataKey="Pedidos" fill="#1e3a8a" radius={[4, 4, 0, 0]} /> {/* brand-primary */}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Financial Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">Balanço do Mês (Concluídos)</h3>
                        <p className="text-4xl font-bold text-green-600">
                            {monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">Receita por Serviço (Concluídos)</h3>
                        <div className="space-y-3 pt-2">
                            {Object.keys(revenueByService).length > 0 ? (
                                Object.entries(revenueByService).sort(([, a], [, b]) => b - a).map(([serviceName, total]) => (
                                    <div key={serviceName} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">{serviceName}</span>
                                        <span className="font-bold text-slate-800">
                                            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-sm text-center py-4">Nenhuma receita de pedidos concluídos ainda.</p>
                            )}
                        </div>
                    </div>
                </div>


                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 sm:flex sm:items-center sm:justify-between border-b border-slate-200">
                         <h3 className="text-lg font-semibold text-slate-800 mb-2 sm:mb-0">Todos os Pedidos</h3>
                         <div className="flex items-center gap-2">
                             <label htmlFor="status-filter" className="text-sm font-medium text-slate-600">Filtrar por status:</label>
                             <select id="status-filter" onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'ALL')} className="p-2 border rounded-lg bg-white text-slate-900 text-sm focus:ring-brand-secondary focus:border-brand-secondary">
                                <option value="ALL">Todos</option>
                                <option value={OrderStatus.AwaitingQuote}>Aguard. Orçamento</option>
                                <option value={OrderStatus.Pending}>Pendente</option>
                                <option value={OrderStatus.InProgress}>Em Análise</option>
                                <option value={OrderStatus.Completed}>Concluído</option>
                                <option value={OrderStatus.Canceled}>Cancelado</option>
                            </select>
                         </div>
                    </div>

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
                                    <tr key={order.id} onClick={() => handleOrderClick(order)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.client.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{order.service.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={order.status} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {order.analyst ? order.analyst.name : (() => {
                                                switch (order.status) {
                                                    case OrderStatus.AwaitingQuote:
                                                        return <span className="text-slate-500 italic text-xs">Aguardando orçamento</span>;
                                                    case OrderStatus.Pending:
                                                        return <span className="text-slate-500 italic text-xs">Aguardando pagamento</span>;
                                                    case OrderStatus.InProgress:
                                                        return (
                                                            <select 
                                                                onChange={(e) => assignAnalyst(order.id, e.target.value)} 
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-xs p-1 border rounded bg-white text-slate-900 focus:ring-brand-secondary focus:border-brand-secondary" 
                                                                defaultValue=""
                                                            >
                                                                <option value="" disabled>Atribuir...</option>
                                                                {analysts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                            </select>
                                                        );
                                                    default:
                                                        return <span className="text-slate-500 italic text-xs">-</span>;
                                                }
                                            })()}
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