
import React, { useState } from 'react';
import { MailIcon, ShieldCheckIcon, FileTextIcon, CheckCircleIcon } from './icons/Icons';
import { LOGO_FOOTER_URL } from '../assets';
import { useAuth } from '../App';
import { Page } from '../types';
import PrivacyPolicyModal from './PrivacyPolicyModal';

const Footer: React.FC = () => {
    const { setPage } = useAuth();
    const [policyModalState, setPolicyModalState] = useState<{ isOpen: boolean; tab: 'privacy' | 'lgpd' }>({
        isOpen: false,
        tab: 'privacy'
    });

    const openModal = (tab: 'privacy' | 'lgpd') => {
        setPolicyModalState({ isOpen: true, tab });
    };

    const closeModal = () => {
        setPolicyModalState(prev => ({ ...prev, isOpen: false }));
    };

    return (
      <footer className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          
          {/* Seção 1: Marca e Descrição */}
          <div className="flex flex-col items-center md:items-start">
            <img src={LOGO_FOOTER_URL} alt="EDARI Logo" className="h-20 w-auto mb-6" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">EDARI - Soluções em Documentação LTDA</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm text-justify">
              Soluções completas e digitais para a regularização e análise documental do seu patrimônio imobiliário.
            </p>
          </div>

          {/* Seção 2: Privacidade e LGPD */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-bold text-gray-400 mb-6 flex items-center gap-2">
                <ShieldCheckIcon className="h-6 w-6 text-green-500" />
                Privacidade e Segurança
            </h3>
            <ul className="space-y-4 text-gray-400 text-sm w-full">
                <li>
                    <button 
                        onClick={() => openModal('privacy')} 
                        className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2 w-full md:w-auto"
                    >
                        <FileTextIcon className="h-4 w-4" />
                        Política de Privacidade
                    </button>
                </li>
                <li>
                    <button 
                        onClick={() => openModal('lgpd')} 
                        className="hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2 w-full md:w-auto"
                    >
                        <CheckCircleIcon className="h-4 w-4" />
                        Conformidade LGPD
                    </button>
                </li>
                <li className="text-xs text-gray-500 pt-2 text-justify">
                    Seus dados são tratados com rigorosa segurança, utilizados única e exclusivamente para a execução dos serviços contratados, conforme a Lei nº 13.709/2018.
                </li>
            </ul>
          </div>

          {/* Seção 3: Contato */}
          <div className="flex flex-col items-center md:items-start">
             <h3 className="text-lg font-bold text-gray-400 mb-6 flex items-center gap-2">
                <MailIcon className="h-6 w-6 text-blue-500" />
                Canais de Atendimento
            </h3>
            <div className="text-gray-400 text-sm space-y-4 w-full">
                <p className="text-justify">Precisa de ajuda ou tem alguma dúvida? Entre em contato com nossa equipe de suporte.</p>
                <a 
                    href="mailto:edari.docs@gmail.com" 
                    className="inline-flex items-center gap-3 bg-gray-800 px-4 py-3 rounded-lg hover:bg-gray-700 hover:text-white transition-all w-full justify-center md:justify-start"
                >
                    <MailIcon className="h-5 w-5 text-brand-secondary" />
                    <span className="font-medium">edari.docs@gmail.com</span>
                </a>
                <p className="text-xs text-gray-500 pt-2 text-justify">
                    Horário de atendimento: Segunda a Sexta, das 09h às 18h.
                </p>
            </div>
          </div>

        </div>
        
        {/* Barra Inferior */}
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm gap-4">
          <p>&copy; {new Date().getFullYear()} EDARI. Todos os direitos reservados.</p>
          <button
            onClick={() => setPage(Page.StaffLogin)}
            className="hover:text-white transition-colors text-xs uppercase tracking-wider"
          >
            Acesso Colaborador
          </button>
        </div>

        {/* Modal de Privacidade */}
        <PrivacyPolicyModal 
            isOpen={policyModalState.isOpen} 
            onClose={closeModal} 
            initialTab={policyModalState.tab}
        />
      </footer>
    );
};

export default Footer;
