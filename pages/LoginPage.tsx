import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../App';
import { Page, Role } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthService } from '../services/authService';
import { AlertTriangleIcon } from '../components/icons/Icons';

declare global { const google: any; }
const GOOGLE_CLIENT_ID = "SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

const LoginPage: React.FC = () => {
    const { login, loginWithGoogle, setPage } = useAuth();
    const googleButtonRef = useRef<HTMLDivElement>(null);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dbError, setDbError] = useState<string | null>(null);

    useEffect(() => {
        AuthService.checkServerStatus().then(status => {
            if (!status.online) setDbError("Backend offline.");
            else if (status.userCount === 0) setDbError("Banco de dados vazio. Execute 'npm run seed'.");
        });
        localStorage.removeItem('edari_token');
    }, []);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await login(email, Role.Client, password);
        setIsLoading(false);
    };

    // ... (Google Login logic permanece igual) ...

    return (
        <div className="bg-brand-light py-12 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Área do Cliente</h2>
                    
                    {dbError && (
                        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 text-sm">
                            <p className="font-bold">Erro de Conexão</p>
                            <p>{dbError}</p>
                        </div>
                    )}
                    
                    <form onSubmit={handleEmailLogin} className="space-y-4 mt-6">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700">Senha</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg" required />
                        </div>
                        
                        <button type="submit" className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90" disabled={isLoading}>
                            {isLoading ? <LoadingSpinner /> : 'Entrar'}
                        </button>
                    </form>
                    
                    <p className="text-center text-sm text-slate-600 mt-8">
                        Não tem uma conta? <button onClick={() => setPage(Page.Signup)} className="font-semibold text-brand-secondary hover:underline">Crie agora</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;