import React, { useState } from 'react';
import { useAuth } from '../App';
import { Page } from '../types';

const SignupPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signupAndLogin, setPage } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Em um aplicativo real, você validaria os dados antes de chamar a API
        signupAndLogin(name, email);
    };

    return (
        <div className="bg-brand-light py-12 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Criar Conta</h2>
                    <p className="text-center text-slate-500 mb-8">Rápido e fácil, vamos começar!</p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-1 text-slate-700">Nome Completo</label>
                                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" required />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1 text-slate-700">Email</label>
                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" required />
                            </div>
                             <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-1 text-slate-700">Senha</label>
                                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" required minLength={6} placeholder="Mínimo de 6 caracteres" />
                            </div>
                        </div>
                        <div className="mt-8">
                            <button type="submit" className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
                                Criar Conta e Acessar
                            </button>
                        </div>
                    </form>
                    <p className="text-center text-sm text-slate-600 mt-8">
                        Já tem uma conta?{' '}
                        <button 
                            onClick={() => setPage(Page.Login)} 
                            className="font-semibold text-brand-secondary hover:underline"
                        >
                            Faça Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;