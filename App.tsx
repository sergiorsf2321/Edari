



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

    const logout = useCallback(() => {
        setUser(null);
        setPage(Page.Landing);
        setSelectedOrder(null);
    }, []);

    const signupAndLogin = useCallback((name: string, email: string) => {
        const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            email,
            role: Role.Client,
        };
        MOCK_USERS.push(newUser); // Add new user to mock data
        setUser(newUser);
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
            // If trying to access a protected page without being logged in,
            // render the LoginPage immediately and stop further processing.
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
                // We know the user exists because of the check above.
                return <OrderFlow />;
            case Page.OrderDetail:
                return <OrderDetailPage />;
            case Page.Dashboard:
                 // We know the user exists because of the check above.
                 // The 'user!' non-null assertion is safe here.
                switch (user!.role) {
                    case Role.Admin:
                        return <AdminDashboard />;
                    case Role.Analyst:
                        return <AnalystDashboard />;
                    case Role.Client:
                        return <ClientDashboard />;
                }
                // This break is technically unreachable but good practice
                break;
            default:
                return <LandingPage />;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, page, setPage, signupAndLogin, orders, selectedOrder, setSelectedOrder, updateOrder, addOrder }}>
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