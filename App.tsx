import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import { User, Role, Page, AuthContextType, Order, Notification } from './types';
import { MOCK_USERS, MOCK_ORDERS } from './constants';

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
    const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [lastRegisteredEmail, setLastRegisteredEmail] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

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
        await new Promise(resolve => setTimeout(resolve, 1000));
        const foundUser = MOCK_USERS.find(u => u.email === email && u.role === role);
        if (foundUser) {
            if (!foundUser.isVerified) {
                addNotification('Seu e-mail ainda não foi confirmado.', 'error');
                setLastRegisteredEmail(email);
                setPage(Page.EmailConfirmation);
                return false;
            }
            setUser(foundUser);
            setPage(Page.Dashboard);
            addNotification(`Bem-vindo(a) de volta, ${foundUser.name.split(' ')[0]}!`, 'success');
            return true;
        } else {
            addNotification('Usuário ou perfil inválido!', 'error');
            return false;
        }
    }, [addNotification]);
    
    const registerUser = useCallback(async (name: string, email: string, cpf: string, birthDate: string, address: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const existingUser = MOCK_USERS.find(u => u.email === email);
        if (existingUser) {
            addNotification('Este e-mail já está cadastrado. Por favor, faça login.', 'error');
            setPage(Page.Login);
            return;
        }
        const newUser: User = {
            id: `user-${Date.now()}`,
            name, email, cpf, birthDate, address,
            role: Role.Client,
            isVerified: false,
        };
        MOCK_USERS.push(newUser);
        setLastRegisteredEmail(email);
        setPage(Page.EmailConfirmation);
        addNotification('Cadastro realizado com sucesso! Confirme seu e-mail.', 'success');
    }, [addNotification]);

    const verifyUser = useCallback((email: string) => {
        const userToVerify = MOCK_USERS.find(u => u.email === email);
        if (userToVerify) {
            userToVerify.isVerified = true;
            addNotification('E-mail confirmado com sucesso! Você já pode fazer login.', 'success');
        }
    }, [addNotification]);

    const logout = useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        setUser(null);
        setPage(Page.Landing);
        setSelectedOrder(null);
        addNotification("Você saiu com segurança.", 'info');
    }, [addNotification]);

    const socialLogin = useCallback((userData: { email: string; name: string; picture?: string; }) => {
        const existingUser = MOCK_USERS.find(u => u.email === userData.email && u.role === Role.Client);
        if (existingUser) {
            existingUser.picture = userData.picture;
            existingUser.isVerified = true;
            setUser(existingUser);
        } else {
            const newUser: User = {
                id: `user-${Date.now()}`,
                name: userData.name,
                email: userData.email,
                role: Role.Client,
                picture: userData.picture,
                isVerified: true,
            };
            MOCK_USERS.push(newUser);
            setUser(newUser);
        }
        setPage(Page.Dashboard);
        addNotification(`Login com sucesso, ${userData.name.split(' ')[0]}!`, 'success');
    }, [addNotification]);

    const loginWithGoogle = useCallback(async (googleToken: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const payload = googleToken.split('.')[1];
            const decodedPayload = atob(payload);
            const parsedPayload = JSON.parse(decodedPayload);
            socialLogin({
                email: parsedPayload.email,
                name: parsedPayload.name,
                picture: parsedPayload.picture,
            });
        } catch (error) {
            addNotification("Login com Google falhou. Token inválido.", 'error');
        }
    }, [socialLogin, addNotification]);
    
    const loginWithApple = useCallback(async (appleToken: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const payload = appleToken.split('.')[1];
            const decodedPayload = atob(payload);
            const parsedPayload = JSON.parse(decodedPayload);
            socialLogin({
                email: parsedPayload.email,
                name: parsedPayload.name || parsedPayload.email.split('@')[0],
            });
        } catch (error) {
            addNotification("Login com Apple falhou. Token inválido.", 'error');
        }
    }, [socialLogin, addNotification]);

    const updateOrder = useCallback((updatedOrder: Order) => {
        setOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        if (selectedOrder?.id === updatedOrder.id) {
            setSelectedOrder(updatedOrder);
        }
    }, [selectedOrder]);

    const addOrder = useCallback((newOrderData: Omit<Order, 'id'>) => {
        const newOrder: Order = {
            ...newOrderData,
            id: `ORD-${String(Date.now()).slice(-4)}`,
        };
        setOrders(prevOrders => [newOrder, ...prevOrders]);
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
        <AuthContext.Provider value={{ user, login, registerUser, verifyUser, logout, page, setPage, loginWithGoogle, loginWithApple, orders, selectedOrder, setSelectedOrder, updateOrder, addOrder, lastRegisteredEmail, addNotification }}>
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