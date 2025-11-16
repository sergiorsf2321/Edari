import React from 'react';
import { MailIcon, PhoneIcon } from './icons/Icons';
import { LOGO_URL } from '../assets';
import { useAuth } from '../App';
import { Page } from '../types';

const Footer: React.FC = () => {
    const { setPage } = useAuth();

    return (
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-center items-center md:items-start text-center md:text-left gap-12">
          <div className="flex-shrink-0">
            <img src={LOGO_URL} alt="EDARI Logo" className="h-10 w-auto filter brightness-0 invert mb-4 mx-auto md:mx-0" />
            <p className="text-gray-400 mb-4 max-w-xs">
              Exame Documental e Adequação Registral Imobiliária
            </p>
            <p className="text-gray-400 text-sm">
              Soluções completas para regularização de imóveis
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <h4 className="font-semibold mb-4">Contato</h4>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <MailIcon className="h-5 w-5" />
                <span>contato@edari.com.br</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <PhoneIcon className="h-5 w-5" />
                <span>(11) 99999-8888</span>
              </div>
            </div>
          </div>

        </div>
        
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} EDARI - Todos os direitos reservados</p>
           <p className="mt-4">
              <button
                onClick={() => setPage(Page.StaffLogin)}
                className="hover:text-white transition-colors"
                aria-label="Acesso restrito para colaboradores"
              >
                Acesso Restrito
              </button>
            </p>
        </div>
      </footer>
    );
};

export default Footer;