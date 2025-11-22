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

// Ajuste de tipagem para incluir senha no register/login
interface ExtendedAuthContextType extends AuthContextType {
    login: (email: string, role: Role, password?: string) => Promise<boolean>;
    registerUser: (name: string, email: string, cpf: string, birthDate: string, address: string, phone: string, password?: string) => Promise<void>;
}

const AuthContext = createContext<ExtendedAuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [page, setPage] = useState<Page>(Page.Landing);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [lastRegisteredEmail, setLastRegisteredEmail] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // Carregar usuário (Persistência)
    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = await AuthService.getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                    if (page === Page.Landing) setPage(Page.Dashboard);
                }
            } catch (error) {
                console.log("Sessão inválida.");
            } finally {
                setIsAuthLoading(false);
            }
        };
        initAuth();
    }, []);

    // Carregar pedidos
    useEffect(() => {
        if (user) {
            OrderService.getOrders().then(setOrders).catch(console.error);
        } else {
            setOrders([]);
        }
    }, [user]);

    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const login = useCallback(async (email: string, role: Role, password?: string): Promise<boolean> => {
        try {
            const loggedUser = await AuthService.login(email, role, password);
            if (loggedUser) {
                setUser(loggedUser);
                setPage(Page.Dashboard);
                addNotification(`Bem-vindo(a), ${loggedUser.name.split(' ')[0]}!`, 'success');
                return true;
            }
            return false;
        } catch (error: any) {
            addNotification(error.message || 'Falha no login', 'error');
            return false;
        }
    }, [addNotification]);
    
    const registerUser = useCallback(async (name: string, email: string, cpf: string, birthDate: string, address: string, phone: string, password?: string) => {
        try {
            await AuthService.register({ name, email, cpf, birthDate, address, phone, password });
            setLastRegisteredEmail(email);
            setPage(Page.Login);
            addNotification('Cadastro realizado com sucesso!', 'success');
        } catch (error: any) {
             addNotification(error.message || 'Erro ao cadastrar', 'error');
        }
    }, [addNotification]);

    const verifyUser = useCallback(async (email: string) => {
        await AuthService.verifyEmail(email);
        addNotification('E-mail confirmado!', 'success');
    }, [addNotification]);
    
    const logout = useCallback(async () => {
        localStorage.removeItem('edari_token');
        localStorage.removeItem('edari_user_id');
        setUser(null);
        setPage(Page.Landing);
        addNotification("Você saiu.", 'info');
    }, [addNotification]);
    
    // ... Resto das funções (loginWithGoogle, updateOrder, etc.) permanecem iguais ...
    // Mantive apenas o essencial alterado para brevidade. Copie o resto do arquivo original se necessário,
    // mas certifique-se de usar o AuthContext.Provider com os novos valores abaixo.

    const loginWithGoogle = useCallback(async (token: string) => { /* ... */ }, []);
    const updateOrder = useCallback(async (o: Order) => { /* ... */ }, []);
    const addOrder = useCallback(async (o: any) => { /* ... */ }, []);
    const updateUserProfile = useCallback(async (d: any) => { /* ... */ }, []);

    if (isAuthLoading) return <div className="flex justify-center items-center h-screen">Carregando...</div>;

    const renderPage = () => {
        if ((page === Page.Dashboard || page === Page.Order || page === Page.OrderDetail) && !user) return <LoginPage />;
        
        switch (page) {
            case Page.Landing: return <LandingPage />;
            case Page.Login: return <LoginPage />;
            case Page.StaffLogin: return <StaffLoginPage />;
            case Page.Signup: return <SignupPage />;
            case Page.EmailConfirmation: return <EmailConfirmationPage />;
            case Page.Order: return <OrderFlow />;
            case Page.OrderDetail: return <OrderDetailPage />;
            case Page.Dashboard:
                return user!.role === Role.Admin ? <AdminDashboard /> : 
                       user!.role === Role.Analyst ? <AnalystDashboard /> : 
                       <ClientDashboard />;
            default: return <LandingPage />;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, registerUser, verifyUser, logout, page, setPage, loginWithGoogle, orders, selectedOrder, setSelectedOrder, updateOrder, addOrder, lastRegisteredEmail, addNotification, updateUserProfile }}>
            <div className="bg-brand-light min-h-screen flex flex-col font-sans text-slate-800">
                <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
                <Header />
                <main className="flex-grow">{renderPage()}</main>
                <Footer />
            </div>
        </AuthContext.Provider>
    );
};

export default App;