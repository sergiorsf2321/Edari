import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../App';
import { Page, Role } from '../types';

// Declaração para as bibliotecas globais do Google e da Apple
// FIX: Changed to augment the Window interface to avoid redeclaration errors.
declare global {
  interface Window {
    google: any;
    AppleID: any;
  }
}

const AppleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.39,14.73a5.3,5.3,0,0,1-2.2-3.59,4.41,4.41,0,0,1,1.1-3.28,4.78,4.78,0,0,0-3.3-1.2,5.26,5.26,0,0,0-4.3,2.43,5.33,5.33,0,0,0-4.3-2.43,5,5,0,0,0-4.4,5.15A7.82,7.82,0,0,0,5.89,20.4,5,5,0,0,0,10,22a4.8,4.8,0,0,0,4.2-2.31,4.4,4.4,0,0,0,1.1-1.35C16.29,18.06,19.39,14.73,19.39,14.73ZM13.19,6.1a3.14,3.14,0,0,1,1-2.28,3,3,0,0,0-2.3-1.12,3.13,3.13,0,0,0-2.7,1.72,3.18,3.18,0,0,0-.6,2.35A2.77,2.77,0,0,0,9,7.1,3.22,3.22,0,0,1,13.19,6.1Z" />
    </svg>
);

const LoginPage: React.FC = () => {
    const { login, loginWithGoogle, loginWithApple, setPage } = useAuth();
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

    const handleAppleSignIn = async () => {
        try {
            // FIX: Use window.AppleID to access the global variable.
            const data = await window.AppleID.auth.signIn();
            loginWithApple(data.authorization.id_token);
        } catch (error) {
            console.error("Erro no login com a Apple:", error);
            alert("Ocorreu um erro durante o login com a Apple. Por favor, tente novamente.");
        }
    };

    useEffect(() => {
        // Google Sign-In
        // FIX: Use window.google to access the global variable.
        if (typeof window.google !== 'undefined') {
            window.google.accounts.id.initialize({
                // =======================================================================
                // ATENÇÃO, EQUIPE DE BACKEND:
                // O Client ID abaixo é um placeholder. Ele DEVE ser substituído pelo 
                // Client ID real, obtido no Google Cloud Console e configurado para
                // o domínio de produção.
                // =======================================================================
                client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
                callback: handleGoogleSignIn
            });

            if (googleButtonRef.current) {
                window.google.accounts.id.renderButton(
                    googleButtonRef.current,
                    { theme: "outline", size: "large", type: 'standard', text: 'signin_with', shape: 'rectangular', width: '300' } 
                );
            }
        } else {
            console.error("Google Identity Services script not loaded.");
        }

        // Apple Sign-In
        // FIX: Use window.AppleID to access the global variable.
        if (typeof window.AppleID !== 'undefined') {
            window.AppleID.auth.init({
                // =======================================================================
                // ATENÇÃO, EQUIPE DE BACKEND:
                // O Service ID (clientId) abaixo é um exemplo. Ele DEVE ser substituído 
                // pelo Service ID real, configurado na sua conta de desenvolvedor Apple.
                // O redirectURI também deve ser ajustado para o domínio de produção.
                // =======================================================================
                clientId : 'br.com.edari.signin', // Exemplo de Service ID
                scope : 'name email',
                redirectURI : window.location.origin, // Para popup, o origin é suficiente
                usePopup : true
            });
        } else {
             console.error("Apple Sign In JS script not loaded.");
        }
    }, [loginWithGoogle, loginWithApple]);

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

                    <div className="flex flex-col items-center">
                        <div ref={googleButtonRef}></div>
                        <button
                            type="button"
                            onClick={handleAppleSignIn}
                            className="mt-3 w-[300px] bg-black text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                        >
                            <AppleIcon />
                            Entrar com a Apple
                        </button>
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
                </div>
            </div>
        </div>
    );
};

export default LoginPage;