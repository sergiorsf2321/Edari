import React, { useState, createContext, useContext, useCallback } from 'react';
import { User, Role, Page, AuthContextType, Order } from './types';
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

    const login = useCallback((email: string, role: Role) => {
        const foundUser = MOCK_USERS.find(u => u.email === email && u.role === role);
        if (foundUser) {
            setUser(foundUser);
            setPage(Page.Dashboard);
        } else {
            alert('Usuário ou perfil inválido!');
        }
    }, []);
    
    const signupAndLogin = useCallback((name: string, email: string) => {
        const existingUser = MOCK_USERS.find(u => u.email === email);
        if (existingUser) {
            alert('Este e-mail já está cadastrado. Por favor, faça login.');
            setPage(Page.Login);
            return;
        }
        const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            email,
            role: Role.Client,
        };
        MOCK_USERS.push(newUser);
        setUser(newUser);
        setPage(Page.Dashboard);
    }, [setPage]);

    const logout = useCallback(() => {
        setUser(null);
        setPage(Page.Landing);
        setSelectedOrder(null);
    }, []);

    const loginWithGoogle = useCallback((googleToken: string) => {
        console.log("[Frontend Simulation] Received Google Token. Sending to backend for verification:", googleToken);
        
        // --- INÍCIO DA SIMULAÇÃO DE BACKEND ---
        // Em um app real, o token acima seria enviado para o backend.
        // O backend verificaria o token com o Google, e então retornaria os dados do usuário.
        // Para simular, decodificamos o token aqui mesmo no frontend.
        let userData;
        try {
            const payload = googleToken.split('.')[1];
            const decodedPayload = atob(payload);
            const parsedPayload = JSON.parse(decodedPayload);
            userData = {
                email: parsedPayload.email,
                name: parsedPayload.name,
                picture: parsedPayload.picture,
            };
        } catch (error) {
            console.error("Erro ao decodificar o token do Google (simulação):", error);
            alert("Login com Google falhou. Token inválido.");
            return;
        }

        const existingUser = MOCK_USERS.find(u => u.email === userData.email && u.role === Role.Client);

        if (existingUser) {
            // Se o usuário já existe, apenas atualiza a foto e faz o login.
            existingUser.picture = userData.picture;
            setUser(existingUser);
            console.log("Usuário existente logado:", existingUser);
        } else {
            // Se não existe, cria um novo usuário cliente.
            const newUser: User = {
                id: `user-${Date.now()}`,
                name: userData.name,
                email: userData.email,
                role: Role.Client,
                picture: userData.picture,
            };
            MOCK_USERS.push(newUser);
            setUser(newUser);
            console.log("Novo usuário criado e logado:", newUser);
        }
        setPage(Page.Dashboard);
         // --- FIM DA SIMULAÇÃO DE BACKEND ---

    }, []);

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
            case Page.Landing:
                return <LandingPage />;
            case Page.Login:
                return <LoginPage />;
            case Page.StaffLogin:
                return <StaffLoginPage />;
            case Page.Signup:
                return <SignupPage />;
            case Page.Order:
                return <OrderFlow />;
            case Page.OrderDetail:
                return <OrderDetailPage />;
            case Page.Dashboard:
                switch (user!.role) {
                    case Role.Admin:
                        return <AdminDashboard />;
                    case Role.Analyst:
                        return <AnalystDashboard />;
                    case Role.Client:
                        return <ClientDashboard />;
                }
                break;
            default:
                return <LandingPage />;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signupAndLogin, logout, page, setPage, loginWithGoogle, orders, selectedOrder, setSelectedOrder, updateOrder, addOrder }}>
            <div className="bg-brand-light min-h-screen flex flex-col font-sans text-slate-800">
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