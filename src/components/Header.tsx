import React, { useState } from 'react';
import { useAuth } from '../App';
import { Page } from '../types';
import { MenuIcon, XIcon, UserCircleIcon } from './icons/Icons';
import { LOGO_URL } from '../assets';

const Header: React.FC = () => {
    const { user, logout, setPage } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavigation = (page: Page) => {
        setPage(page);
        setIsMenuOpen(false);
    };
    
    const handleScrollToServices = () => {
      if (document.getElementById('services')) {
        const servicesSection = document.getElementById('services');
        if (servicesSection) {
          servicesSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        setPage(Page.Landing);
        setTimeout(() => {
          const servicesSection = document.getElementById('services');
          if (servicesSection) {
            servicesSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
      setIsMenuOpen(false);
    }

    const navLinks = (
      <>
        <button onClick={() => handleNavigation(Page.Landing)} className="text-gray-700 hover:text-blue-600 font-medium transition">
            Início
        </button>
        <button onClick={handleScrollToServices} className="text-gray-700 hover:text-blue-600 font-medium transition">
            Serviços
        </button>
      </>
    );

    const authButtons = (
        <>
        {user ? (
            <div className="flex items-center gap-4">
                {user.picture ? (
                    <img src={user.picture} alt={`Foto de ${user.name}`} className="h-9 w-9 rounded-full" />
                ) : (
                    <span className="text-gray-700 hidden sm:inline">Olá, {user.name.split(' ')[0]}!</span>
                )}
                <button 
                    onClick={() => handleNavigation(Page.Dashboard)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                    Meu Painel
                </button>
                 <button onClick={logout} className="text-gray-700 hover:text-blue-600 font-medium transition">Sair</button>
            </div>
        ) : (
            <button 
                onClick={() => handleNavigation(Page.Login)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
                Área do Cliente
            </button>
        )}
        </>
    );

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <button onClick={() => handleNavigation(Page.Landing)} className="flex items-center gap-2 cursor-pointer logo-sheen">
                        <img src={LOGO_URL} alt="EDARI Logo" className="h-10 w-auto" />
                    </button>
                    
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks}
                        {authButtons}
                    </div>

                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden text-gray-700"
                    >
                        {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden mt-4 pb-4 space-y-3 flex flex-col items-start">
                        {navLinks}
                        <div className="border-t w-full my-2"></div>
                        {authButtons}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Header;