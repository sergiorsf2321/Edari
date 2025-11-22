
import React, { useState, useEffect, useRef } from 'react';
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
    const [phone, setPhone] = useState(''); // Novo estado para telefone
    const [agreedToPolicy, setAgreedToPolicy] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Estado para erro de validação
    const [cpfError, setCpfError] = useState('');

    const { registerUser, setPage, addNotification } = useAuth();

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .slice(0, 14);
    };

    const formatDate = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1/$2')
            .replace(/(\d{2})(\d)/, '$1/$2')
            .slice(0, 10);
    };
    
    const formatPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d)(\d{4})$/, '$1-$2')
            .slice(0, 15);
    };

    const handleCpfBlur = () => {
        if (cpf && !isValidCPF(cpf)) {
            setCpfError('CPF inválido. Verifique os números.');
        } else {
            setCpfError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isValidCPF(cpf)) {
            setCpfError('CPF inválido. Verifique os números.');
            addNotification('Por favor, corrija os erros no formulário.', 'error');
            return;
        }

        if (!agreedToPolicy) {
            addNotification('Você deve concordar com a Política de Privacidade para continuar.', 'error');
            return;
        }
        setIsLoading(true);
        await registerUser(name, email, cpf, birthDate, address, phone);
        setIsLoading(false);
    };

    return (
        <>
            <div className="bg-brand-light py-12 sm:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                        <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Criar Conta</h2>
                        <p className="text-center text-slate-500 mb-8">Rápido e fácil, vamos começar!</p>
                        
                        <form onSubmit={handleSubmit}>
                            <fieldset disabled={isLoading} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium mb-1 text-slate-700">Nome Completo</label>
                                    <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" required />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium mb-1 text-slate-700">Email</label>
                                    <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="cpf" className="block text-sm font-medium mb-1 text-slate-700">CPF</label>
                                        <input 
                                            id="cpf" 
                                            type="text" 
                                            value={cpf} 
                                            onChange={e => { setCpf(formatCPF(e.target.value)); setCpfError(''); }} 
                                            onBlur={handleCpfBlur}
                                            placeholder="000.000.000-00" 
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900 ${cpfError ? 'border-red-500' : 'border-slate-300'}`} 
                                            required 
                                        />
                                        {cpfError && <p className="text-xs text-red-500 mt-1">{cpfError}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="birthDate" className="block text-sm font-medium mb-1 text-slate-700">Data de Nascimento</label>
                                        <input id="birthDate" type="text" value={birthDate} onChange={e => setBirthDate(formatDate(e.target.value))} placeholder="DD/MM/AAAA" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" required />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium mb-1 text-slate-700">Celular / WhatsApp</label>
                                    <input id="phone" type="text" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" required />
                                </div>
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium mb-1 text-slate-700">Endereço Completo</label>
                                    <input id="address" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, Nº, Bairro, Cidade - Estado, CEP" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" required />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium mb-1 text-slate-700">Senha</label>
                                    <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" required minLength={6} placeholder="Mínimo de 6 caracteres" />
                                </div>
                            </fieldset>
                             <div className="mt-6 flex items-start">
                                <input
                                    id="policy"
                                    type="checkbox"
                                    checked={agreedToPolicy}
                                    onChange={(e) => setAgreedToPolicy(e.target.checked)}
                                    className="h-4 w-4 text-brand-secondary focus:ring-brand-secondary border-gray-300 rounded mt-1"
                                    disabled={isLoading}
                                />
                                <label htmlFor="policy" className="ml-2 block text-sm text-gray-900">
                                    Li e concordo com a{' '}
                                    <button
                                        type="button"
                                        onClick={() => setIsPolicyModalOpen(true)}
                                        className="font-medium text-brand-secondary hover:underline"
                                        disabled={isLoading}
                                    >
                                        Política de Privacidade
                                    </button>
                                    .
                                </label>
                            </div>

                            <div className="mt-8">
                                <button 
                                    type="submit" 
                                    disabled={!agreedToPolicy || isLoading || !!cpfError} 
                                    className={`w-full font-bold py-3 rounded-lg flex justify-center items-center h-[48px] transition-all ${(!agreedToPolicy || isLoading || !!cpfError) ? 'bg-slate-400 cursor-not-allowed text-slate-200' : 'bg-brand-accent text-white hover:opacity-90'}`}
                                >
                                    {isLoading ? <LoadingSpinner /> : 'Criar Conta'}
                                </button>
                            </div>
                        </form>
                        <p className="text-center text-sm text-slate-600 mt-8">
                            Já tem uma conta?{' '}
                            <button 
                                onClick={() => setPage(Page.Login)} 
                                className="font-semibold text-brand-secondary hover:underline"
                                disabled={isLoading}
                            >
                                Faça Login
                            </button>
                        </p>
                    </div>
                </div>
            </div>
            <PrivacyPolicyModal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} />
        </>
    );
};

export default SignupPage;
