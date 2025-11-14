import React from 'react';
import { MailIcon, PhoneIcon, MapPinIcon } from './icons/Icons';

const Footer: React.FC = () => {
    return (
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">EDARI</h3>
            <p className="text-gray-400 mb-4">
              Exame Documental e Adequação Registral Imobiliária
            </p>
            <p className="text-gray-400 text-sm">
              Soluções completas para regularização de imóveis
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-center gap-3">
                <MailIcon className="h-5 w-5" />
                <span>contato@edari.com.br</span>
              </div>
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-5 w-5" />
                <span>(11) 99999-8888</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPinIcon className="h-5 w-5" />
                <span>Av. Paulista, 1000, São Paulo - SP</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Horário de Atendimento</h4>
            <div className="text-gray-400 space-y-2">
              <p>Segunda a Sexta: 9h às 18h</p>
              <p>Sábado: 9h às 13h</p>
              <p className="text-sm mt-4">Atendimento online 24/7</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} EDARI - Todos os direitos reservados</p>
        </div>
      </footer>
    );
};

export default Footer;