import React, { useState } from 'react';
import { useAuth } from '../App';
import { Role, Page } from '../types';
import { MOCK_USERS } from '../constants';

const StaffLoginPage: React.FC = () => {
    // Login form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>(Role.Analyst);
    const { login, setPage } = useAuth();

    // Forgot password states
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetEmailSent, setResetEmailSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email, role);
    };
    
    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(`Password reset requested for: ${forgotEmail}`);
        setResetEmailSent(true);
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
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
                                    >
                                        Enviar Link de Recuperação
                                    </button>
                                </form>
                                <p className="text-center text-sm text-slate-600 mt-8">
                                    Lembrou a senha?{' '}
                                    <button 
                                        onClick={() => setIsForgotPassword(false)} 
                                        className="font-semibold text-brand-secondary hover:underline"
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
                            <div className="mb-6">
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
                            <div className="mb-4">
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
                            <div className="mb-4">
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

                            <div className="flex items-center justify-end mb-6">
                            <button
                                    type="button"
                                    onClick={() => setIsForgotPassword(true)}
                                    className="text-sm text-brand-secondary hover:underline focus:outline-none"
                                >
                                    Esqueci minha senha
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Entrar
                            </button>
                        </form>
                        <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t">
                            Não é um colaborador?{' '}
                            <button 
                                onClick={() => setPage(Page.Login)} 
                                className="font-semibold text-brand-secondary hover:underline"
                            >
                                Acessar como cliente
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffLoginPage;