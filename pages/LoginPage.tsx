import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../App';
import { Page, Role } from '../types';

// Declaração para as bibliotecas globais do Google e da Apple
declare global {
  const google: any;
  const AppleID: any;
}

const AppleIcon = () => (
    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"></path>
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
            const data = await AppleID.auth.signIn();
            loginWithApple(data.authorization.id_token);
        } catch (error) {
            console.error("Erro no login com a Apple:", error);
            alert("Ocorreu um erro durante o login com a Apple. Por favor, tente novamente.");
        }
    };

    useEffect(() => {
        // Google Sign-In
        if (typeof google !== 'undefined') {
            google.accounts.id.initialize({
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
                google.accounts.id.renderButton(
                    googleButtonRef.current,
                    { theme: "outline", size: "large", type: 'standard', text: 'signin_with', shape: 'rectangular', width: '300' } 
                );
            }
        } else {
            console.error("Google Identity Services script not loaded.");
        }

        // Apple Sign-In
        if (typeof AppleID !== 'undefined') {
            AppleID.auth.init({
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