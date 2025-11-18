import React from 'react';
import { useAuth } from '../App';
import { Page } from '../types';
import { MailCheckIcon } from '../components/icons/Icons';

const EmailConfirmationPage: React.FC = () => {
    const { verifyUser, setPage, lastRegisteredEmail, addNotification } = useAuth();

    const handleConfirm = () => {
        if (lastRegisteredEmail) {
            verifyUser(lastRegisteredEmail);
            setPage(Page.Login);
        } else {
            addNotification('Ocorreu um erro. Por favor, tente se cadastrar novamente.', 'error');
            setPage(Page.Signup);
        }
    };

    return (
        <div className="bg-brand-light py-12 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <MailCheckIcon className="h-9 w-9 text-brand-secondary" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Confirme seu E-mail</h2>
                    <p className="text-center text-slate-500 mb-6">
                        Enviamos um link de confirmação para <br/>
                        <strong className="text-slate-700">{lastRegisteredEmail || 'seu e-mail'}</strong>.
                    </p>
                    <p className="text-center text-sm text-slate-500 mb-8">
                        Por favor, clique no link para ativar sua conta. Se não o encontrar, verifique sua pasta de spam.
                    </p>
                    
                    <div className="mt-8">
                        <button 
                            onClick={handleConfirm}
                            className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
                        >
                            (Simulação) Confirmar E-mail e ir para Login
                        </button>
                    </div>

                    <p className="text-center text-sm text-slate-600 mt-8">
                        Já confirmou?{' '}
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

export default EmailConfirmationPage;