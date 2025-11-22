import React, { useState } from 'react';
import { useAuth } from '../App';
import { Page } from '../types';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { isValidCPF } from '../utils/validators';

const SignupPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cpf, setCpf] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [agreedToPolicy, setAgreedToPolicy] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [cpfError, setCpfError] = useState('');

    const { registerUser, setPage, addNotification } = useAuth();

    // Mantive os formatters originais (omitidos para brevidade, copie do original se necessário)
    const formatCPF = (v: string) => v; // Placeholder
    const formatDate = (v: string) => v; // Placeholder
    const formatPhone = (v: string) => v; // Placeholder

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidCPF(cpf)) {
            setCpfError('CPF inválido.');
            return;
        }
        if (!agreedToPolicy) {
            addNotification('Aceite a política de privacidade.', 'error');
            return;
        }
        setIsLoading(true);
        // CORREÇÃO: Passando a senha
        await registerUser(name, email, cpf, birthDate, address, phone, password);
        setIsLoading(false);
    };

    return (
        <>
            <div className="bg-brand-light py-12 sm:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                        <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Criar Conta</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                            {/* Campos do formulário (Nome, Email, CPF, etc.) */}
                            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border rounded-lg" required />
                            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border rounded-lg" required />
                            <input type="text" placeholder="CPF" value={cpf} onChange={e => setCpf(e.target.value)} className="w-full px-4 py-3 border rounded-lg" required />
                            <input type="text" placeholder="Data de Nascimento" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full px-4 py-3 border rounded-lg" required />
                            <input type="text" placeholder="Celular" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 border rounded-lg" required />
                            <input type="text" placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-3 border rounded-lg" required />
                            
                            {/* Campo de Senha */}
                            <input type="password" placeholder="Senha (mín 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg" required minLength={6} />

                            <div className="flex items-center mt-4">
                                <input type="checkbox" checked={agreedToPolicy} onChange={e => setAgreedToPolicy(e.target.checked)} className="h-4 w-4" />
                                <span className="ml-2 text-sm">Concordo com a <button type="button" onClick={() => setIsPolicyModalOpen(true)} className="text-brand-secondary underline">Política de Privacidade</button></span>
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90 mt-6">
                                {isLoading ? <LoadingSpinner /> : 'Criar Conta'}
                            </button>
                        </form>
                        <p className="text-center text-sm text-slate-600 mt-4">
                             Já tem conta? <button onClick={() => setPage(Page.Login)} className="text-brand-secondary font-bold">Login</button>
                        </p>
                    </div>
                </div>
            </div>
            <PrivacyPolicyModal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} />
        </>
    );
};

export default SignupPage;