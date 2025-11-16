import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
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
import EmailConfirmationPage from './pages/EmailConfirmationPage';

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

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);

    const login = useCallback((email: string, role: Role) => {
        const foundUser = MOCK_USERS.find(u => u.email === email && u.role === role);
        if (foundUser) {
            if (!foundUser.isVerified) {
                alert('Seu e-mail ainda não foi confirmado. Por favor, verifique sua caixa de entrada e siga as instruções de confirmação.');
                setLastRegisteredEmail(email); // For simulation purposes
                setPage(Page.EmailConfirmation);
                return;
            }
            setUser(foundUser);
            setPage(Page.Dashboard);
        } else {
            alert('Usuário ou perfil inválido!');
        }
    }, []);
    
    const registerUser = useCallback((name: string, email: string, cpf: string, birthDate: string, address: string) => {
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
            cpf,
            birthDate,
            address,
            role: Role.Client,
            isVerified: false, // User starts as unverified
        };
        MOCK_USERS.push(newUser);
        setLastRegisteredEmail(email);
        setPage(Page.EmailConfirmation);
        console.log("Novo usuário criado (não verificado):", newUser);
    }, [setPage]);

    const verifyUser = useCallback((email: string) => {
        const userToVerify = MOCK_USERS.find(u => u.email === email);
        if (userToVerify) {
            userToVerify.isVerified = true;
            console.log("Usuário verificado:", userToVerify);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setPage(Page.Landing);
        setSelectedOrder(null);
    }, []);

    const loginWithGoogle = useCallback((googleToken: string) => {
        console.log("[Frontend Simulation] Received Google Token. Sending to backend for verification:", googleToken);
        
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
            existingUser.picture = userData.picture;
            existingUser.isVerified = true; // Google accounts are implicitly verified
            setUser(existingUser);
            console.log("Usuário existente logado:", existingUser);
        } else {
            const newUser: User = {
                id: `user-${Date.now()}`,
                name: userData.name,
                email: userData.email,
                role: Role.Client,
                picture: userData.picture,
                isVerified: true, // Google accounts are implicitly verified
            };
            MOCK_USERS.push(newUser);
            setUser(newUser);
            console.log("Novo usuário criado e logado:", newUser);
        }
        setPage(Page.Dashboard);

    }, []);
    
    const loginWithApple = useCallback((appleToken: string) => {
        console.log("[Frontend Simulation] Received Apple Token. Sending to backend for verification:", appleToken);
        
        let userData;
        try {
            const payload = appleToken.split('.')[1];
            const decodedPayload = atob(payload);
            const parsedPayload = JSON.parse(decodedPayload);
            userData = {
                email: parsedPayload.email,
                // Apple doesn't always send the name, but for simulation we'll construct a default name if needed.
                name: parsedPayload.name || parsedPayload.email.split('@')[0], 
            };
        } catch (error) {
            console.error("Erro ao decodificar o token da Apple (simulação):", error);
            alert("Login com Apple falhou. Token inválido.");
            return;
        }

        const existingUser = MOCK_USERS.find(u => u.email === userData.email && u.role === Role.Client);

        if (existingUser) {
            existingUser.isVerified = true; // Apple accounts are implicitly verified
            setUser(existingUser);
            console.log("Usuário existente logado via Apple:", existingUser);
        } else {
            const newUser: User = {
                id: `user-${Date.now()}`,
                name: userData.name,
                email: userData.email,
                role: Role.Client,
                isVerified: true, // Apple accounts are implicitly verified
            };
            MOCK_USERS.push(newUser);
            setUser(newUser);
            console.log("Novo usuário criado e logado via Apple:", newUser);
        }
        setPage(Page.Dashboard);
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
            case Page.EmailConfirmation:
                return <EmailConfirmationPage />;
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
        <AuthContext.Provider value={{ user, login, registerUser, verifyUser, logout, page, setPage, loginWithGoogle, loginWithApple, orders, selectedOrder, setSelectedOrder, updateOrder, addOrder, lastRegisteredEmail }}>
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