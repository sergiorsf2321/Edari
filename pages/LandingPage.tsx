import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { SERVICES } from '../constants';
import { Page, ServiceId } from '../types';
import { ArrowRightIcon, ShieldCheckIcon, ClockIcon, CheckCircleIcon, SearchIcon, FileTextIcon, BriefcaseIcon, FileIcon, HandshakeIcon, ScanTextIcon, FileSearch2Icon } from '../components/icons/Icons';
import { HERO_BACKGROUND_IMAGE, LOGO_URL } from '../assets';

// Custom hook for scroll animations
const useAnimateOnScroll = (options = { threshold: 0.1, triggerOnce: true }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                if (options.triggerOnce && ref.current) {
                    observer.unobserve(ref.current);
                }
            }
        }, options);

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [ref, options]);

    return [ref, isVisible] as const;
};


const LandingPage: React.FC = () => {
    const { user, setPage } = useAuth();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Trigger hero animation on page load
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);
    
    const [aboutRef, isAboutVisible] = useAnimateOnScroll();
    const [whyRef, isWhyVisible] = useAnimateOnScroll();
    const [servicesRef, isServicesVisible] = useAnimateOnScroll();
    const [ctaRef, isCtaVisible] = useAnimateOnScroll();


    const serviceIcons: { [key in ServiceId]?: React.FC<React.SVGProps<SVGSVGElement>> } = {
        [ServiceId.QualifiedSearch]: SearchIcon,
        [ServiceId.DigitalCertificate]: FileIcon,
        [ServiceId.PreAnalysis]: BriefcaseIcon,
        [ServiceId.RegistryIntermediation]: HandshakeIcon,
        [ServiceId.DocPreparation]: FileTextIcon,
        [ServiceId.TechnicalReport]: ScanTextIcon,
        [ServiceId.DevolutionaryNoteAnalysis]: FileSearch2Icon,
    };

    const handleOrderClick = () => {
        if (user) {
            setPage(Page.Order);
        } else {
            setPage(Page.Login);
        }
    };

    const whyEdariItems = [
        { icon: ShieldCheckIcon, title: "Conformidade", description: "Serviços realizados por especialistas para assegurar o atendimento às exigências registrais." },
        { icon: ClockIcon, title: "Agilidade Digital", description: "Processos 100% online para otimizar seu tempo e resolver pendências." },
        { icon: CheckCircleIcon, title: "Precisão e Clareza", description: "Informações precisas e comunicação direta para sua tranquilidade." },
        { icon: HandshakeIcon, title: "Suporte Humano e Dedicado", description: "Nossa equipe está ao seu lado do início ao fim, garantindo que você se sinta seguro em cada etapa." }
    ];

    const mainServices = SERVICES.slice(0, 6);
    const specialService = SERVICES.find(s => s.id === ServiceId.DevolutionaryNoteAnalysis);

    return (
        <div className="bg-white">
            <section
                className="relative text-white pt-28 pb-32 px-6 overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(to right, rgba(30, 58, 138, 0.85), rgba(29, 78, 216, 0.6)), url(${HERO_BACKGROUND_IMAGE})` }}
            >
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center">
                        <h1 className={`text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                          <span className="logo-sheen inline-block py-2 px-1">A adequação registral que seu imóvel <span className="text-brand-accent">precisa</span>. A <span className="text-brand-accent">eficiência</span> que <span className="text-brand-accent">você</span> busca.</span>
                        </h1>
                        <p className={`text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto mb-8 transition-all duration-1000 ease-out delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>Da busca em cartórios ao suporte no protocolo via ONR, realizamos a conferência de requisitos e a preparação de processos completos, assegurando a conformidade técnica e a regularidade formal do seu patrimônio.</p>
                        <button 
                            onClick={handleOrderClick}
                            className={`logo-sheen bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-all shadow-lg transform hover:scale-105 inline-flex items-center gap-2 duration-1000 ease-out delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                        >
                            Começar Agora
                            <ArrowRightIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </section>
            
            <section ref={aboutRef} className={`py-20 px-6 bg-white transition-all duration-1000 ease-out ${isAboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div className="text-left">
                        <h2 className="text-sm font-bold uppercase text-brand-secondary mb-2">Quem Somos</h2>
                        <h3 className="text-3xl font-bold mb-4 text-gray-900">Simplificando a Burocracia Imobiliária</h3>
                        <p className="text-gray-600 mb-4 text-justify">
                            A EDARI nasceu da necessidade de trazer agilidade e assertividade aos trâmites do mercado imobiliário brasileiro. Somos uma equipe de especialistas na análise de conformidade e gestão administrativa de documentos junto aos cartórios de registro de imóveis.
                        </p>
                        <p className="text-gray-600 text-justify">
                           Nossa missão é transformar a burocracia em eficiência. Com um processo 100% digital, combinamos tecnologia e conhecimento técnico para entregar desde a busca de certidões até a preparação documental e o saneamento de pendências, garantindo que cada etapa do registro ocorra com precisão e sem retrabalho.
                        </p>
                    </div>
                    <div className="flex justify-center items-center">
                        <div className="logo-sheen">
                            <img src={LOGO_URL} alt="Logo EDARI" className="h-36 w-auto" />
                        </div>
                    </div>
                </div>
            </section>

            <section ref={whyRef} className="py-16 px-6 bg-slate-200">
                <div className="max-w-6xl mx-auto">
                    <h2 className={`text-3xl font-bold text-center mb-12 text-gray-900 transition-all duration-1000 ease-out ${isWhyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>Por que escolher a EDARI?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {whyEdariItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={index} className={`bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-500 ease-out text-center transform hover:scale-105 hover:-translate-y-2 ${isWhyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ transitionDelay: `${index * 150}ms` }}>
                                    <div className="flex items-center justify-center h-16 w-16 mx-auto bg-blue-100 rounded-full mb-4">
                                        <Icon className="text-blue-600 h-9 w-9" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3 text-gray-900">{item.title}</h3>
                                    <p className="text-gray-600">{item.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section id="services" ref={servicesRef} className="py-16 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className={`text-3xl font-bold text-center mb-12 text-gray-900 transition-all duration-1000 ease-out ${isServicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>Nossos Serviços</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mainServices.map((service, index) => {
                            const Icon = serviceIcons[service.id] || FileTextIcon;
                            return (
                                <div 
                                    key={service.id} 
                                    className={`bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-500 ease-out border border-gray-200 flex flex-col transform hover:scale-105 hover:-translate-y-2 ${isServicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                                    style={{ transitionDelay: `${index * 150}ms` }}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="bg-blue-100 p-3 rounded-lg">
                                            <Icon className="text-blue-600 h-7 w-7" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                                            <p className="text-gray-600 text-sm mb-3 text-justify">{service.description}</p>
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
                                        onClick={handleOrderClick}
                                        className="logo-sheen w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-all shadow-lg transform hover:scale-105 mt-auto"
                                    >
                                        Contratar Serviço
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    {specialService && (
                      <div className="mt-8 flex justify-center">
                        {(() => {
                           const Icon = serviceIcons[specialService.id] || FileTextIcon;
                           return (
                                <div 
                                    key={specialService.id} 
                                    className={`bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-500 ease-out border border-gray-200 flex flex-col transform hover:scale-105 hover:-translate-y-2 w-full md:w-2/3 lg:w-1/3 ${isServicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                                    style={{ transitionDelay: `${mainServices.length * 150}ms` }}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="bg-blue-100 p-3 rounded-lg">
                                            <Icon className="text-blue-600 h-7 w-7" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{specialService.name}</h3>
                                            <p className="text-gray-600 text-sm mb-3 text-justify">{specialService.description}</p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-blue-600 font-bold text-lg">{specialService.price ? `R$ ${specialService.price.toFixed(2).replace('.', ',')}` : 'Sob Consulta'}</span>
                                                <span className="text-gray-500">• {specialService.duration}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ul className="space-y-2 mb-4 flex-grow">
                                        {specialService.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                                <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={handleOrderClick}
                                        className="logo-sheen w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-all shadow-lg transform hover:scale-105 mt-auto"
                                    >
                                        Contratar Serviço
                                    </button>
                                </div>
                           );
                        })()}
                      </div>
                    )}
                </div>
            </section>

            <section ref={ctaRef} className={`bg-blue-900 text-white py-16 px-6 transition-all duration-1000 ease-out ${isCtaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">Pronto para regularizar seu imóvel?</h2>
                    <p className="text-xl text-blue-200 mb-8">Processo 100% online, rápido e seguro</p>
                    <button 
                        onClick={handleOrderClick}
                        className="logo-sheen bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition shadow-lg transform hover:scale-105"
                    >
                        Iniciar Agora
                    </button>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;