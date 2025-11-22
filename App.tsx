
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

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [page, setPage] = useState<Page>(Page.Landing);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [lastRegisteredEmail, setLastRegisteredEmail] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Carregar usuário e pedidos ao iniciar
    useEffect(() => {
        const loadData = async () => {
            try {
                const currentUser = await AuthService.getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                }
            } catch (error) {
                console.log("Nenhum usuário logado.");
            }
        };
        loadData();
    }, []);

    // Recarregar pedidos SOMENTE se o usuário estiver logado
    useEffect(() => {
        const loadOrders = async () => {
            if (!user) return; // <--- CORREÇÃO CRÍTICA: Impede busca sem login
            
            try {
                const fetchedOrders = await OrderService.getOrders();
                setOrders(fetchedOrders);
            } catch (error) {
                console.error("Erro ao carregar pedidos:", error);
            }
        };
        loadOrders();
    }, [user]); 

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);
    
    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);
    
    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const login = useCallback(async (email: string, role: Role): Promise<boolean> => {
        try {
            const loggedUser = await AuthService.login(email, role);
            if (loggedUser) {
                if (!loggedUser.isVerified) {
                    addNotification('Seu e-mail ainda não foi confirmado.', 'error');
                    setLastRegisteredEmail(email);
                    setPage(Page.EmailConfirmation);
                    return false;
                }
                setUser(loggedUser);
                setPage(Page.Dashboard);
                addNotification(`Bem-vindo(a) de volta, ${loggedUser.name.split(' ')[0]}!`, 'success');
                return true;
            }
            return false;
        } catch (error: any) {
            addNotification(error.message || 'Falha no login', 'error');
            return false;
        }
    }, [addNotification]);
    
    const registerUser = useCallback(async (name: string, email: string, cpf: string, birthDate: string, address: string, phone: string) => {
        try {
            await AuthService.register({ name, email, cpf, birthDate, address, phone });
            setLastRegisteredEmail(email);
            setPage(Page.EmailConfirmation);
            addNotification('Cadastro realizado com sucesso! Confirme seu e-mail.', 'success');
        } catch (error: any) {
             addNotification(error.message || 'Erro ao cadastrar', 'error');
        }
    }, [addNotification]);

    const verifyUser = useCallback(async (email: string) => {
        await AuthService.verifyEmail(email);
        addNotification('E-mail confirmado com sucesso! Você já pode fazer login.', 'success');
    }, [addNotification]);
    
    const updateUserProfile = useCallback(async (data: Partial<User>) => {
        if (user) {
            try {
                const updatedUser = await AuthService.updateProfile(user.id, data);
                setUser(updatedUser);
            } catch (error) {
                addNotification("Erro ao atualizar perfil", "error");
            }
        }
    }, [user, addNotification]);

    const logout = useCallback(async () => {
        localStorage.removeItem('edari_token');
        localStorage.removeItem('edari_user_id');
        setUser(null);
        setOrders([]); // Limpa pedidos ao sair
        setPage(Page.Landing);
        setSelectedOrder(null);
        addNotification("Você saiu com segurança.", 'info');
    }, [addNotification]);

    const loginWithGoogle = useCallback(async (googleToken: string) => {
        try {
            const loggedUser = await AuthService.socialLogin('google', googleToken);
            setUser(loggedUser);
            setPage(Page.Dashboard);
            addNotification(`Login com Google sucesso!`, 'success');
        } catch (error) {
            addNotification("Login com Google falhou.", 'error');
        }
    }, [addNotification]);
    
    const loginWithApple = useCallback(async (appleToken: string) => {
        try {
            const loggedUser = await AuthService.socialLogin('apple', appleToken);
            setUser(loggedUser);
            setPage(Page.Dashboard);
            addNotification(`Login com Apple sucesso!`, 'success');
        } catch (error) {
            addNotification("Login com Apple falhou.", 'error');
        }
    }, [addNotification]);

    const updateOrder = useCallback(async (orderData: Order) => {
        try {
            // Atualiza no backend simulado
            const updated = await OrderService.updateOrder(orderData);
            // Atualiza estado local
            setOrders(prevOrders => prevOrders.map(o => o.id === updated.id ? updated : o));
            
            if (selectedOrder?.id === updated.id) {
                setSelectedOrder(updated);
            }
        } catch (e) {
            console.error(e);
        }
    }, [selectedOrder]);

    const addOrder = useCallback(async (newOrderData: Omit<Order, 'id'>) => {
        try {
            const createdOrder = await OrderService.createOrder(newOrderData);
            setOrders(prevOrders => [createdOrder, ...prevOrders]);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const renderPage = () => {
        const isProtectedRoute = page === Page.Dashboard || page === Page.Order || page === Page.OrderDetail;
        if (isProtectedRoute && !user) {
            return <LoginPage />;
        }
        
        switch (page) {
            case Page.Landing: return <LandingPage />;
            case Page.Login: return <LoginPage />;
            case Page.StaffLogin: return <StaffLoginPage />;
            case Page.Signup: return <SignupPage />;
            case Page.EmailConfirmation: return <EmailConfirmationPage />;
            case Page.Order: return <OrderFlow />;
            case Page.OrderDetail: return <OrderDetailPage />;
            case Page.Dashboard:
                switch (user!.role) {
                    case Role.Admin: return <AdminDashboard />;
                    case Role.Analyst: return <AnalystDashboard />;
                    case Role.Client: return <ClientDashboard />;
                }
                break;
            default:
                return <LandingPage />;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, registerUser, verifyUser, logout, page, setPage, loginWithGoogle, loginWithApple, orders, selectedOrder, setSelectedOrder, updateOrder, addOrder, lastRegisteredEmail, addNotification, updateUserProfile }}>
            <div className="bg-brand-light min-h-screen flex flex-col font-sans text-slate-800">
                <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
                <Header />
                <main className="flex-grow">
                    {renderPage()}
                </main>
                <Footer />
            </div>
        </AuthContext.Provider>
    );
};

export default App;
