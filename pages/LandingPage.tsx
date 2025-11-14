import React from 'react';
import { useAuth } from '../App';
import { SERVICES } from '../constants';
import { Page } from '../types';
import { ArrowRightIcon, ShieldCheckIcon, ClockIcon, CheckCircleIcon, SearchIcon, FileTextIcon, UsersIcon } from '../components/icons/Icons';

const LandingPage: React.FC = () => {
    const { setPage } = useAuth();
    
    const serviceIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
        'exam': SearchIcon,
        'adaptation': FileTextIcon,
        'express': ClockIcon,
        'consulting': UsersIcon
    };

    return (
        <div className="bg-white">
            <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20 px-6 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-pattern"></div>
                </div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">EDARI</h1>
                        <p className="text-2xl md:text-3xl mb-4">Exame Documental e Adequação Registral Imobiliária</p>
                        <p className="text-xl text-blue-200 mb-8">Segurança e precisão na documentação do seu imóvel</p>
                        <button 
                            onClick={() => setPage(Page.Order)}
                            className="bg-white text-blue-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition shadow-lg inline-flex items-center gap-2"
                        >
                            Começar Agora
                            <ArrowRightIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </section>

            <section className="py-16 px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Por que escolher a EDARI?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition text-center">
                            <ShieldCheckIcon className="mx-auto text-blue-600 mb-4 h-12 w-12" />
                            <h3 className="text-xl font-semibold mb-3 text-gray-900">Segurança Jurídica</h3>
                            <p className="text-gray-600">Análise rigorosa por especialistas em direito imobiliário</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition text-center">
                            <ClockIcon className="mx-auto text-blue-600 mb-4 h-12 w-12" />
                            <h3 className="text-xl font-semibold mb-3 text-gray-900">Agilidade</h3>
                            <p className="text-gray-600">Prazos reduzidos e processo 100% digital</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition text-center">
                            <CheckCircleIcon className="mx-auto text-blue-600 mb-4 h-12 w-12" />
                            <h3 className="text-xl font-semibold mb-3 text-gray-900">Precisão</h3>
                            <p className="text-gray-600">Relatórios detalhados e recomendações práticas</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="services" className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Nossos Serviços</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {SERVICES.map(service => {
                            const Icon = serviceIcons[service.id] || FileTextIcon;
                            return (
                                <div key={service.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition border border-gray-200 flex flex-col">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="bg-blue-100 p-3 rounded-lg">
                                            <Icon className="text-blue-600 h-7 w-7" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                                            <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-blue-600 font-bold text-lg">{service.price ? `R$ ${service.price.toFixed(2).replace('.', ',')}` : 'Sob Consulta'}</span>
                                                <span className="text-gray-500">• {service.duration}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ul className="space-y-2 mb-4 flex-grow">
                                        {service.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                                <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => setPage(Page.Order)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition font-medium mt-auto"
                                    >
                                        Contratar Serviço
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="bg-blue-900 text-white py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">Pronto para regularizar seu imóvel?</h2>
                    <p className="text-xl text-blue-200 mb-8">Processo 100% online, rápido e seguro</p>
                    <button 
                        onClick={() => setPage(Page.Order)}
                        className="bg-white text-blue-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition shadow-lg"
                    >
                        Iniciar Agora
                    </button>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;