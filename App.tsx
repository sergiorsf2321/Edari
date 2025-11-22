import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import { User, Role, Page, AuthContextType, Order, Notification } from './types';
import { AuthService } from './services/authService';
import { OrderService } from './services/orderService';

import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OrderFlow from './pages/OrderFlow';
import ClientDashboard from './pages/ClientDashboard';
import AnalystDashboard from './pages/AnalystDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StaffLoginPage from './pages/StaffLoginPage';
import OrderDetailPage from './pages/OrderDetailPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import NotificationContainer from './components/NotificationContainer';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Context de Autenticação
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Componente de Loading Global
const GlobalLoading: React.FC = () => (
  <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
    <div className="text-center">
      <LoadingSpinner size="lg" color="text-brand-primary" />
      <p className="mt-4 text-slate-600 font-medium">Carregando EDARI...</p>
    </div>
  </div>
);

// Fallback personalizado para erros
const ErrorFallback: React.FC<{ onReset?: () => void }> = ({ onReset }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Erro ao carregar página</h2>
      <p className="text-slate-600 mb-4">Tente recarregar a página ou voltar para o início.</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onReset}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary"
        >
          Tentar Novamente
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
        >
          Página Inicial
        </button>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [page, setPage] = useState<Page>(Page.Landing);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [lastRegisteredEmail, setLastRegisteredEmail] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Handler global de erros
    const handleGlobalError = useCallback((error: Error) => {
        console.error('Global Error Captured:', error);
        setGlobalError(error.message);
    }, []);

    // Inicialização da aplicação
    useEffect(() => {
        const initAuth = async () => {
            setIsAuthLoading(true);
            try {
                const currentUser = await AuthService.getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                    
                    // Carregar pedidos em background
                    OrderService.getOrders()
                        .then(setOrders)
                        .catch(err => {
                            console.error("Erro ao carregar pedidos:", err);
                            addNotification('Erro ao carregar pedidos. Tente recarregar a página.', 'error');
                        });
                    
                    if (page === Page.Landing) {
                        setPage(Page.Dashboard);
                    }
                }
            } catch (error) {
                console.log("Sessão expirada ou inválida.");
            } finally {
                setIsAuthLoading(false);
            }
        };

        initAuth();
    }, [page]);

    // Carregar pedidos quando usuário mudar
    useEffect(() => {
        if (user) {
            OrderService.getOrders()
                .then(setOrders)
                .catch(err => {
                    console.error("Erro ao carregar pedidos:", err);
                    addNotification('Erro ao carregar seus pedidos.', 'error');
                });
        } else {
            setOrders([]);
        }
    }, [user]);

    // Scroll para topo ao mudar de página
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);

    // Sistema de notificações
    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now() + Math.random();
        const notification: Notification = { id, message, type };
        
        setNotifications(prev => [...prev, notification]);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);
    
    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Sistema de autenticação
    const login = useCallback(async (email: string, password: string, role?: Role): Promise<boolean> => {
        try {
            const { user: loggedUser } = await AuthService.login(email, password, role);
            
            if (loggedUser) {
                setUser(loggedUser);
                setPage(Page.Dashboard);
                addNotification(`Bem-vindo(a), ${loggedUser.name.split(' ')[0]}!`, 'success');
                return true;
            }
            return false;
        } catch (error: any) {
            const message = error.message || 'Falha no login. Verifique suas credenciais.';
            addNotification(message, 'error');
            return false;
        }
    }, [addNotification]);
    
    const registerUser = useCallback(async (
        name: string, 
        email: string, 
        cpf: string, 
        birthDate: string, 
        address: string, 
        phone: string, 
        password: string
    ) => {
        try {
            await AuthService.register({ name, email, cpf, birthDate, address, phone, password });
            setLastRegisteredEmail(email);
            setPage(Page.Login);
            addNotification('Cadastro realizado com sucesso! Faça login.', 'success');
        } catch (error: any) {
             addNotification(error.message || 'Erro ao cadastrar. Tente novamente.', 'error');
        }
    }, [addNotification]);

    const verifyUser = useCallback(async (email: string) => {
        try {
            await AuthService.verifyEmail(email);
            addNotification('E-mail confirmado com sucesso!', 'success');
        } catch (error: any) {
            addNotification(error.message || 'Erro ao confirmar e-mail.', 'error');
        }
    }, [addNotification]);
    
    const updateUserProfile = useCallback(async (data: Partial<User>) => {
        if (user) {
            try {
                const updatedUser = await AuthService.updateProfile(user.id, data);
                setUser(updatedUser);
                addNotification('Perfil atualizado com sucesso!', 'success');
            } catch (error: any) {
                addNotification(error.message || "Erro ao atualizar perfil", "error");
            }
        }
    }, [user, addNotification]);

    const logout = useCallback(async () => {
        try {
            AuthService.logout();
            setUser(null);
            setOrders([]); 
            setPage(Page.Landing);
            setSelectedOrder(null);
            addNotification("Você saiu com segurança.", 'info');
        } catch (error) {
            addNotification("Erro ao fazer logout.", 'error');
        }
    }, [addNotification]);

    const loginWithGoogle = useCallback(async (googleToken: string) => {
        try {
            const loggedUser = await AuthService.socialLogin('google', googleToken);
            setUser(loggedUser);
            setPage(Page.Dashboard);
            addNotification(`Login com Google realizado com sucesso!`, 'success');
        } catch (error: any) {
            addNotification(error.message || "Login com Google falhou.", 'error');
        }
    }, [addNotification]);

    // Sistema de pedidos
    const updateOrder = useCallback(async (orderData: Order) => {
        try {
            const updated = await OrderService.updateOrder(orderData);
            setOrders(prevOrders => prevOrders.map(o => o.id === updated.id ? updated : o));
            if (selectedOrder?.id === updated.id) {
                setSelectedOrder(updated);
            }
        } catch (error: any) {
            console.error("Erro ao atualizar pedido:", error);
            addNotification(error.message || "Erro ao atualizar pedido.", "error");
        }
    }, [selectedOrder, addNotification]);

    const addOrder = useCallback(async (newOrderData: Omit<Order, 'id'>) => {
        try {
            const createdOrder = await OrderService.createOrder(newOrderData);
            setOrders(prevOrders => [createdOrder, ...prevOrders]);
        } catch (error: any) {
            console.error("Erro ao criar pedido:", error);
            addNotification(error.message || "Erro ao criar pedido.", "error");
        }
    }, [addNotification]);

    // Renderização de páginas com Error Boundary individual
    const renderPage = () => {
        const isProtectedRoute = page === Page.Dashboard || page === Page.Order || page === Page.OrderDetail;
        
        if (isProtectedRoute && !user) {
            return <LoginPage />;
        }
        
        // Error Boundary individual para cada página
        const renderWithErrorBoundary = (component: React.ReactNode, pageName: string) => (
            <ErrorBoundary 
                fallback={<ErrorFallback onReset={() => window.location.reload()} />}
            >
                {component}
            </ErrorBoundary>
        );

        switch (page) {
            case Page.Landing: 
                return renderWithErrorBoundary(<LandingPage />, 'Página Inicial');
            
            case Page.Login: 
                return renderWithErrorBoundary(<LoginPage />, 'Login');
            
            case Page.StaffLogin: 
                return renderWithErrorBoundary(<StaffLoginPage />, 'Login de Staff');
            
            case Page.Signup: 
                return renderWithErrorBoundary(<SignupPage />, 'Cadastro');
            
            case Page.EmailConfirmation: 
                return renderWithErrorBoundary(<EmailConfirmationPage />, 'Confirmação de Email');
            
            case Page.Order: 
                return renderWithErrorBoundary(<OrderFlow />, 'Novo Pedido');
            
            case Page.OrderDetail: 
                return renderWithErrorBoundary(<OrderDetailPage />, 'Detalhes do Pedido');
            
            case Page.Dashboard:
                switch (user!.role) {
                    case Role.Admin: 
                        return renderWithErrorBoundary(<AdminDashboard />, 'Painel Admin');
                    case Role.Analyst: 
                        return renderWithErrorBoundary(<AnalystDashboard />, 'Painel Analista');
                    case Role.Client: 
                        return renderWithErrorBoundary(<ClientDashboard />, 'Painel Cliente');
                    default:
                        return renderWithErrorBoundary(<LandingPage />, 'Página Inicial');
                }
            
            default:
                return renderWithErrorBoundary(<LandingPage />, 'Página Inicial');
        }
    };

    // Loading global durante inicialização
    if (isAuthLoading) {
        return <GlobalLoading />;
    }

    // Renderização principal com Error Boundary global
    return (
        <ErrorBoundary>
            <AuthContext.Provider value={{ 
                user, 
                login, 
                registerUser, 
                verifyUser, 
                logout, 
                page, 
                setPage, 
                loginWithGoogle, 
                orders, 
                selectedOrder, 
                setSelectedOrder, 
                updateOrder, 
                addOrder, 
                lastRegisteredEmail, 
                addNotification, 
                updateUserProfile 
            }}>
                <div className="bg-brand-light min-h-screen flex flex-col font-sans text-slate-800">
                    {/* Sistema de Notificações */}
                    <NotificationContainer 
                        notifications={notifications} 
                        removeNotification={removeNotification} 
                    />
                    
                    {/* Header */}
                    <ErrorBoundary
                        fallback={
                            <div className="bg-red-50 border-b border-red-200 p-4 text-center">
                                <p className="text-red-700">Erro no cabeçalho. A navegação pode estar limitada.</p>
                            </div>
                        }
                    >
                        <Header />
                    </ErrorBoundary>
                    
                    {/* Conteúdo Principal */}
                    <main className="flex-grow">
                        {renderPage()}
                    </main>
                    
                    {/* Footer */}
                    <ErrorBoundary
                        fallback={
                            <div className="bg-gray-900 text-white p-8 text-center">
                                <p>© {new Date().getFullYear()} EDARI. Todos os direitos reservados.</p>
                            </div>
                        }
                    >
                        <Footer />
                    </ErrorBoundary>
                </div>
                
                {/* Alertas de Erro Global */}
                {globalError && (
                    <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Erro do Sistema</span>
                            <button 
                                onClick={() => setGlobalError(null)}
                                className="text-white hover:text-red-200 ml-4"
                            >
                                ×
                            </button>
                        </div>
                        <p className="text-sm mt-1">{globalError}</p>
                    </div>
                )}
            </AuthContext.Provider>
        </ErrorBoundary>
    );
};

export default App;
