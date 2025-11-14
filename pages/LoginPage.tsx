import React, { useState } from 'react';
import { useAuth } from '../App';
import { Role } from '../types';
import { MOCK_USERS } from '../constants';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>(Role.Client);
    const { login } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email, role);
    };

    return (
        <div className="bg-brand-light py-12 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Acessar Painel</h2>
                    <p className="text-center text-slate-500 mb-8">Bem-vindo(a) de volta!</p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">Acessar como:</label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary"
                            >
                                <option value={Role.Client}>Cliente</option>
                                <option value={Role.Analyst}>Analista</option>
                                <option value={Role.Admin}>Administrador</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                            <select
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary"
                                required
                            >
                                <option value="" disabled>Selecione um email de exemplo</option>
                                {MOCK_USERS.filter(u => u.role === role).map(user => (
                                    <option key={user.id} value={user.email}>{user.email}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-6">
                             <label htmlFor="password"className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
                             <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary"
                                placeholder="Qualquer senha funciona"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Entrar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;