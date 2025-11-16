import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../App';
import { Page, Role } from '../types';

// Declaração para a biblioteca global do Google
declare global {
  const google: any;
}

const LoginPage: React.FC = () => {
    const { login, loginWithGoogle, setPage } = useAuth();
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleEmailLogin = (e: React.FormEvent) => {
        e.preventDefault();
        login(email, Role.Client);
    };

    const handleGoogleSignIn = (response: any) => {
        // 'response.credential' é o ID Token (JWT) que o Google retorna
        loginWithGoogle(response.credential);
    };

    useEffect(() => {
        if (typeof google === 'undefined') {
            console.error("Google Identity Services script not loaded.");
            return;
        }

        google.accounts.id.initialize({
            // =======================================================================
            // ATENÇÃO: O erro "401: invalid_client" ocorre porque o ID abaixo
            // é um placeholder. Você PRECISA substituí-lo pelo seu Client ID real,
            // obtido no Google Cloud Console em "APIs & Services > Credentials".
            // Além disso, certifique-se de que o domínio em que você está
            // rodando a aplicação (ex: http://localhost:3000) está listado nos
            // "Authorized JavaScript origins".
            // =======================================================================
            client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
            callback: handleGoogleSignIn
        });

        if (googleButtonRef.current) {
            google.accounts.id.renderButton(
                googleButtonRef.current,
                { theme: "outline", size: "large", type: 'standard', text: 'signin_with', shape: 'rectangular', width: '300' } 
            );
        }

    }, [loginWithGoogle]);

    return (
        <div className="bg-brand-light py-12 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Área do Cliente</h2>
                    <p className="text-center text-slate-500 mb-8">Acesse para gerenciar seus pedidos.</p>
                    
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1 text-slate-700">Email</label>
                            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" required />
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-sm font-medium mb-1 text-slate-700">Senha</label>
                            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" placeholder="Qualquer senha funciona" required />
                        </div>
                        <button type="submit" className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
                            Entrar
                        </button>
                    </form>
                    
                     <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-slate-300"></div>
                        <span className="flex-shrink mx-4 text-slate-400 text-sm">ou</span>
                        <div className="flex-grow border-t border-slate-300"></div>
                    </div>

                    <div className="flex justify-center">
                        <div ref={googleButtonRef}></div>
                    </div>
                    
                    <p className="text-center text-sm text-slate-600 mt-8">
                        Não tem uma conta?{' '}
                        <button 
                            onClick={() => setPage(Page.Signup)} 
                            className="font-semibold text-brand-secondary hover:underline"
                        >
                            Crie agora
                        </button>
                    </p>

                    <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t">
                        Acesso para colaboradores?{' '}
                        <button 
                            onClick={() => setPage(Page.StaffLogin)} 
                            className="font-semibold text-brand-secondary hover:underline"
                        >
                            Entrar aqui
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;