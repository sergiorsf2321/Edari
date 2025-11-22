import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../App';
import { AuthService } from '../services/authService';
import { Order, OrderStatus, Role, Page, User } from '../types';
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
    const { orders, updateOrder, setPage, setSelectedOrder, addNotification } = useAuth();
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    
    // BLINDAGEM 1: Inicialização com Cast Explícito
    const [analysts, setAnalysts] = useState<User[]>([] as User[]);
    const [isLoadingAnalysts, setIsLoadingAnalysts] = useState(false);

    useEffect(() => {
        const fetchAnalysts = async () => {
            setIsLoadingAnalysts(true);
            try {
                const data = await AuthService.getUsersByRole(Role.Analyst);
                if (Array.isArray(data)) {
                    setAnalysts(data);
                }
            } catch (error) {
                console.error("Erro ao buscar analistas", error);
            } finally {
                setIsLoadingAnalysts(false);
            }
        };
        fetchAnalysts();
    }, []);

    const filteredOrders = useMemo(() => {
        let tempOrders = orders;

        if (filterStatus !== 'ALL') {
            tempOrders = tempOrders.filter(order => order.status === filterStatus);
        }

        if (searchTerm.trim() !== '') {
            tempOrders = tempOrders.filter(order =>
                order.id.toLowerCase().includes(searchTerm.trim().toLowerCase())
            );
        }

        return tempOrders;
    }, [orders, filterStatus, searchTerm]);

    const assignAnalyst = (orderId: string, analystId: string) => {
        // BLINDAGEM 2: Tipagem na busca
        const analyst = analysts.find((a: User) => a.id === analystId);
        if (!analyst) return;
        
        const orderToUpdate = orders.find(o => o.id === orderId);
        if (!orderToUpdate) return;
        
        updateOrder({ ...orderToUpdate, analyst, status: OrderStatus.InProgress });
        addNotification(`Analista ${analyst.name} atribuído ao pedido ${orderId}.`, 'success');
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
                order.paymentConfirmedAt &&
                order.paymentConfirmedAt.getMonth() === currentMonth &&
                order.paymentConfirmedAt.getFullYear() === currentYear
            )
            .reduce((sum, order) => sum + order.total, 0);
    }, [orders]);

    const revenueByService = useMemo(() => {
        return orders
            .filter(order => order.status === OrderStatus.Completed)
            .reduce((acc, order) => {
                const serviceName = order.service.name;
                if (!acc[serviceName]) {
                    acc[serviceName] = 0;
                }
                if (typeof order.total === 'number') {
                    acc[serviceName] += order.total;
                }
                return acc;
            }, {} as Record<string, number>);
    }, [orders]);

    const statusChartData = useMemo(() => [
        { name: 'Aguard. Orç.', value: stats.awaitingQuote },
        { name: 'Pendentes', value: stats.pending },
        { name: 'Em Análise', value: stats.inProgress },
        { name: 'Concluídos', value: stats.completed },
    ].filter(item => item.value > 0), [stats]);

    const serviceChartData = useMemo(() => {
        const serviceCounts = orders.reduce((acc, order) => {
            const name = order.service.name.split(' ')[0];
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(serviceCounts).map(([name, count]) => ({
            name,
            Pedidos: count,
        }));
    }, [orders]);

    const STATUS_COLORS = ['#8b5cf6', '#f59e0b', '#3b82f6', '#22c55e']; 

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
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {statusChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `${value} pedido(s)`}/>
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
                                <Bar dataKey="Pedidos" fill="#1e3a8a" radius={[4, 4, 0, 0]} /> 
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
                                Object.entries(revenueByService).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([serviceName, total]) => (
                                    <div key={serviceName} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">{serviceName}</span>
                                        <span className="font-bold text-slate-800">
                                            {(total as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200">
                         <h3 className="text-lg font-semibold text-slate-800 shrink-0">Todos os Pedidos</h3>
                         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Pesquisar por ID do Pedido"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-3 py-2 border rounded-lg bg-white text-slate-900 text-sm focus:ring-brand-secondary focus:border-brand-secondary w-full sm:w-56"
                            />
                             <div className="flex items-center gap-2 w-full sm:w-auto">
                                 <label htmlFor="status-filter" className="text-sm font-medium text-slate-600 shrink-0">Filtrar:</label>
                                 <select id="status-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'ALL')} className="p-2 border rounded-lg bg-white text-slate-900 text-sm focus:ring-brand-secondary focus:border-brand-secondary w-full">
                                    <option value="ALL">Todos os Status</option>
                                    <option value={OrderStatus.AwaitingQuote}>Aguard. Orçamento</option>
                                    <option value={OrderStatus.Pending}>Pendente</option>
                                    <option value={OrderStatus.InProgress}>Em Análise</option>
                                    <option value={OrderStatus.Completed}>Concluído</option>
                                    <option value={OrderStatus.Canceled}>Cancelado</option>
                                </select>
                             </div>
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
                                                        return isLoadingAnalysts ? (
                                                            <span className="text-xs text-slate-400">Carregando...</span>
                                                        ) : (
                                                            <select 
                                                                onChange={(e) => assignAnalyst(order.id, e.target.value)} 
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-xs p-1 border rounded bg-white text-slate-900 focus:ring-brand-secondary focus:border-brand-secondary" 
                                                                defaultValue=""
                                                            >
                                                                <option value="" disabled>Atribuir...</option>
                                                                {/* BLINDAGEM 3: Tipagem explícita (a: User) dentro do MAP */}
                                                                {analysts.map((a: User) => (
                                                                    <option key={a.id} value={a.id}>{a.name}</option>
                                                                ))}
                                                            </select>
                                                        );
                                                    case OrderStatus.InProgress:
                                                        if (order.analyst) {
                                                            return order.analyst.name;
                                                        }
                                                        return (
                                                            <select 
                                                                onChange={(e) => assignAnalyst(order.id, e.target.value)} 
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-xs p-1 border rounded bg-white text-slate-900 focus:ring-brand-secondary focus:border-brand-secondary" 
                                                                defaultValue=""
                                                            >
                                                                <option value="" disabled>Atribuir...</option>
                                                                {/* BLINDAGEM 3: Tipagem explícita (a: User) dentro do MAP */}
                                                                {analysts.map((a: User) => (
                                                                    <option key={a.id} value={a.id}>{a.name}</option>
                                                                ))}
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
                        {filteredOrders.length === 0 && (
                             <div className="text-center py-16">
                                <h2 className="text-xl font-medium text-slate-700">Nenhum pedido encontrado.</h2>
                                <p className="text-slate-500 mt-2">Tente ajustar os filtros ou o termo de busca.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;