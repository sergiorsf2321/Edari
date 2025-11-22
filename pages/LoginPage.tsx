
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../App';
import { Page, Role } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthService } from '../services/authService';
import { AlertTriangleIcon } from '../components/icons/Icons';

declare global {
  const google: any;
}

const GOOGLE_CLIENT_ID = "SEU_GOOGLE_CLIENT_ID_AQUI.apps.googleusercontent.com";

const LoginPage: React.FC = () => {
    const { login, loginWithGoogle, setPage, addNotification } = useAuth();
    const googleButtonRef = useRef<HTMLDivElement>(null);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSocialLoading, setIsSocialLoading] = useState(false);
    
    // Estado de Diagnóstico
    const [dbError, setDbError] = useState<string | null>(null);

    // Verificação de Saúde do Backend
    useEffect(() => {
        const checkDb = async () => {
            const status = await AuthService.checkServerStatus();
            if (!status.online) {
                setDbError("O servidor backend parece estar offline.");
            } else if (status.userCount === 0) {
                setDbError("ERRO CRÍTICO: O Banco de Dados está vazio. Execute 'npm run seed' no servidor.");
            }
        };
        checkDb();
        
        // Limpa tokens antigos para evitar conflito
        localStorage.removeItem('edari_token');
    }, []);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulação de senha fixa caso o usuário não tenha mudado o backend
        const loginPassword = password || 'admin123';
        
        // Tenta logar. Se falhar, o erro será capturado pelo addNotification no App.tsx ou aqui
        const success = await login(email, Role.Client);
        if (!success && !dbError) {
             // Se falhou e não temos erro de DB, provavelmente é senha
             // A notificação já é exibida pelo App.tsx, mas podemos reforçar aqui se necessário
        }
        setIsLoading(false);
    };

    const handleGoogleSignIn = async (response: any) => {
        setIsSocialLoading(true);
        await loginWithGoogle(response.credential);
        setIsSocialLoading(false);
    };

    useEffect(() => {
        const initializeGoogle = () => {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                try {
                    google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: handleGoogleSignIn,
                        auto_select: false,
                        cancel_on_tap_outside: true
                    });

                    if (googleButtonRef.current) {
                        google.accounts.id.renderButton(
                            googleButtonRef.current,
                            { theme: "outline", size: "large", type: 'standard', text: 'signin_with', shape: 'rectangular', width: '300' } 
                        );
                    }
                } catch (error) {
                    console.warn("Google Sign-In falhou ao inicializar:", error);
                }
            }
        };

        const timer = setTimeout(initializeGoogle, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="bg-brand-light py-12 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Área do Cliente</h2>
                    <p className="text-center text-slate-500 mb-8">Acesse para gerenciar seus pedidos.</p>
                    
                    {/* ALERTA DE DIAGNÓSTICO */}
                    {dbError && (
                        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                            <div className="flex items-start">
                                <AlertTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-sm">Problema Detectado</p>
                                    <p className="text-xs mt-1">{dbError}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1 text-slate-700">Email</label>
                            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" required disabled={isLoading || isSocialLoading} />
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-sm font-medium mb-1 text-slate-700">Senha</label>
                            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" placeholder="Sua senha" required disabled={isLoading || isSocialLoading} />
                        </div>
                        
                        <button 
                            type="submit" 
                            className={`w-full font-bold py-3 rounded-lg flex justify-center items-center h-[48px] transition-all ${isLoading || isSocialLoading ? 'bg-slate-400 cursor-not-allowed text-slate-200' : 'bg-brand-accent text-white hover:opacity-90'}`}
                            disabled={isLoading || isSocialLoading}
                        >
                            {isLoading ? <LoadingSpinner /> : 'Entrar'}
                        </button>
                    </form>
                    
                     <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-slate-300"></div>
                        <span className="flex-shrink mx-4 text-slate-400 text-sm">ou</span>
                        <div className="flex-grow border-t border-slate-300"></div>
                    </div>

                    <div className="flex flex-col items-center">
                        {isSocialLoading && <div className="absolute inset-0 bg-white bg-opacity-50 flex justify-center items-center rounded-xl z-10"><LoadingSpinner /></div>}
                        
                        {/* Botão Google */}
                        <div ref={googleButtonRef} className="h-[40px] w-[300px] flex justify-center min-h-[40px]"></div>
                    </div>
                    
                    <p className="text-center text-sm text-slate-600 mt-8">
                        Não tem uma conta?{' '}
                        <button 
                            onClick={() => setPage(Page.Signup)} 
                            className="font-semibold text-brand-secondary hover:underline"
                            disabled={isLoading || isSocialLoading}
                        >
                            Crie agora
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
