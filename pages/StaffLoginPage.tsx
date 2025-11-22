import React, { useState } from 'react';
import { useAuth } from '../App';
import { Role, Page } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const StaffLoginPage: React.FC = () => {
    // Login form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>(Role.Analyst);
    const { login, addNotification } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Forgot password states
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetEmailSent, setResetEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await login(email, role);
        setIsLoading(false);
    };
    
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        addNotification(`Se houver uma conta para ${forgotEmail}, um e-mail de recuperação foi enviado.`, 'info');
        setResetEmailSent(true);
        setIsLoading(false);
    };

    return (
        <div className="bg-brand-light py-12 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                {isForgotPassword ? (
                    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                        <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Recuperar Senha</h2>
                        {resetEmailSent ? (
                             <div>
                                <p className="text-center text-slate-500 my-8">Se houver uma conta para <strong>{forgotEmail}</strong>, você receberá um email com as instruções de redefinição.</p>
                                <button 
                                    onClick={() => { setIsForgotPassword(false); setResetEmailSent(false); setForgotEmail(''); }} 
                                    className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Voltar para Login
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-center text-slate-500 mb-8">Digite seu e-mail para continuar.</p>
                                <form onSubmit={handleForgotPassword}>
                                    <div className="mb-6">
                                        <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            id="forgot-email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900"
                                            placeholder="seu@email.com"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center h-[48px]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <LoadingSpinner/> : 'Enviar Link de Recuperação'}
                                    </button>
                                </form>
                                <p className="text-center text-sm text-slate-600 mt-8">
                                    Lembrou a senha?{' '}
                                    <button 
                                        onClick={() => setIsForgotPassword(false)} 
                                        className="font-semibold text-brand-secondary hover:underline"
                                        disabled={isLoading}
                                    >
                                        Voltar para o Login
                                    </button>
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                        <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Acesso Restrito</h2>
                        <p className="text-center text-slate-500 mb-8">Login para colaboradores.</p>
                        
                        <form onSubmit={handleSubmit}>
                           <fieldset disabled={isLoading} className="space-y-4">
                                <div className="mb-2">
                                    <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">Acessar como:</label>
                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) => {
                                            setRole(e.target.value as Role);
                                            setEmail(''); // Reset email when role changes
                                        }}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900"
                                    >
                                        <option value={Role.Analyst}>Analista</option>
                                        <option value={Role.Admin}>Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900"
                                        placeholder="seu@email.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password"className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900"
                                        placeholder="Qualquer senha funciona"
                                    />
                                </div>
                           </fieldset>

                            <div className="flex items-center justify-end my-4">
                            <button
                                    type="button"
                                    onClick={() => setIsForgotPassword(true)}
                                    className="text-sm text-brand-secondary hover:underline focus:outline-none"
                                    disabled={isLoading}
                                >
                                    Esqueci minha senha
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center h-[48px]"
                                disabled={isLoading}
                            >
                                {isLoading ? <LoadingSpinner/> : 'Entrar'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffLoginPage;