import React, { useState, createContext, useContext, useCallback } from 'react';
import { User, Role, Page, AuthContextType } from './types';
import { MOCK_USERS } from './constants';

import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OrderFlow from './pages/OrderFlow';
import ClientDashboard from './pages/ClientDashboard';
import AnalystDashboard from './pages/AnalystDashboard';
import AdminDashboard from './pages/AdminDashboard';

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
    }, []);

    const renderPage = () => {
        switch (page) {
            case Page.Landing:
                return <LandingPage />;
            case Page.Login:
                return <LoginPage />;
            case Page.Order:
                return <OrderFlow />;
            case Page.Dashboard:
                if (user) {
                    switch (user.role) {
                        case Role.Admin:
                            return <AdminDashboard />;
                        case Role.Analyst:
                            return <AnalystDashboard />;
                        case Role.Client:
                            return <ClientDashboard />;
                    }
                }
                // Fallback to landing if no user on dashboard page
                setPage(Page.Landing);
                return <LandingPage />;
            default:
                return <LandingPage />;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, page, setPage }}>
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