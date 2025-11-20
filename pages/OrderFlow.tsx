import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../App';
import { SERVICES, MOCK_USERS } from '../constants';
import { Service, UploadedFile, Page, ServiceId, Order, OrderStatus } from '../types';
import { UploadIcon, FileIcon, TrashIcon, CheckCircleIcon } from '../components/icons/Icons';
import Payment from '../components/Payment';
import { BRAZILIAN_STATES, CITIES_BY_STATE } from '../data/locations';
import { findRegistriesByCity } from '../services/registryService';

const OrderFlow: React.FC = () => {
    const [step, setStep] = useState(1);
    
    // Step 1 State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [serviceSpecificData, setServiceSpecificData] = useState<Record<string, string>>({});
    const [registries, setRegistries] = useState<string[]>([]);
    const [isLoadingRegistries, setIsLoadingRegistries] = useState(false);

    // Step 2 State
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [documentDescription, setDocumentDescription] = useState('');
    
    const { user, setPage, addOrder } = useAuth();

    // Rola para o topo sempre que a etapa (step) mudar
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const selectedCity = serviceSpecificData.city;
    const selectedState = serviceSpecificData.state;

    useEffect(() => {
        if (selectedCity && selectedState) {
            const fetchRegistries = async () => {
                setIsLoadingRegistries(true);
                setServiceSpecificData(prev => ({ ...prev, registry: '' })); // Clear previous selection
                try {
                    const foundRegistries = await findRegistriesByCity(selectedState, selectedCity);
                    setRegistries(foundRegistries);
                } catch (error) {
                    console.error("Failed to fetch registries:", error);
                    setRegistries([`Cartório de Registro de Imóveis de ${selectedCity}`]); // Fallback
                } finally {
                    setIsLoadingRegistries(false);
                }
            };
            fetchRegistries();
        } else {
            setRegistries([]);
        }
    }, [selectedCity, selectedState]);

    const total = useMemo(() => {
        if (!selectedService || selectedService.price === null) return 0;
        return selectedService.price;
    }, [selectedService]);

    const isConsultation = useMemo(() => selectedService?.price === null, [selectedService]);
    const isPesquisaQualificada = useMemo(() => selectedService?.id === ServiceId.QualifiedSearch, [selectedService]);

    const handleServiceDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setServiceSpecificData(prev => {
            const processedValue = name === 'matricula'
                ? value.replace(/\D/g, '') // Remove non-digit characters for 'matricula'
                : value;
            
            const newState = { ...prev, [name]: processedValue };
            if (name === 'state') {
                // Reset city and registry when state changes
                delete newState.city;
                delete newState.registry;
            }
            if (name === 'city') {
                // Reset registry when city changes
                delete newState.registry;
            }
            return newState;
        });
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles: UploadedFile[] = Array.from(event.target.files).map((file: File) => ({
                name: file.name,
                size: file.size,
                type: file.type,
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (fileName: string) => {
        setFiles(prev => prev.filter(file => file.name !== fileName));
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    
    const generateOrderDescription = (): string => {
        if (!selectedService) return documentDescription;

        const { state, city, registry, cpfCnpj, matricula, intendedAct, comarca, registries } = serviceSpecificData;
        const stateName = state ? BRAZILIAN_STATES.find(s => s.uf === state)?.name : '';
        const locationInfo = [city, stateName].filter(Boolean).join(' - ');

        let generatedDescription = '';

        switch (selectedService.id) {
            case ServiceId.QualifiedSearch:
                generatedDescription = `Pesquisa Qualificada para CPF/CNPJ: ${cpfCnpj || 'Não informado'}\nLocal: ${locationInfo}\nCartórios Específicos: ${registries || 'Todos da cidade'}`;
                break;
            case ServiceId.DigitalCertificate:
                generatedDescription = `Solicitação de Certidão Digital\nLocal: ${locationInfo}\nCartório: ${registry || 'Não informado'}\nMatrícula: ${matricula || 'Não informada'}`;
                break;
            case ServiceId.PreAnalysis:
                generatedDescription = `Solicitação de Pré-Análise Documental\nLocal: ${locationInfo}\nCartório: ${registry || 'Não informado'}\nComarca: ${comarca || city}`;
                break;
            case ServiceId.RegistryIntermediation:
                generatedDescription = `Intermediação Registral\nLocal: ${locationInfo}\nCartório: ${registry || 'Não informado'}\nMatrícula: ${matricula || 'Não informada'}`;
                break;
            case ServiceId.DocPreparation:
                generatedDescription = `Preparação Documental\nAto Pretendido: ${intendedAct || 'Não informado'}\nLocal: ${locationInfo}\nCartório: ${registry || 'Não informado'}\nMatrícula: ${matricula || 'Não informada'}`;
                break;
            default:
                return documentDescription;
        }

        return `${generatedDescription}\n\nObservações do cliente:\n${documentDescription || 'Nenhuma.'}`;
    };

    const handleConsultationSubmit = () => {
        if (!user || !selectedService) return;
        const newOrder: Omit<Order, 'id'> = {
            client: user,
            service: selectedService,
            analyst: undefined,
            status: OrderStatus.AwaitingQuote,
            isUrgent: false,
            propertyType: 'N/A',
            documents: files,
            total: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            report: undefined,
            description: generateOrderDescription(),
            messages: []
        };
        addOrder(newOrder);
        nextStep();
    };

    const handlePaymentSuccess = () => {
        if (!user || !selectedService) return;
        
        const newOrder: Omit<Order, 'id'> = {
            client: user,
            service: selectedService,
            analyst: MOCK_USERS.find(u => u.role === 'ANALYST'),
            status: OrderStatus.InProgress,
            isUrgent: false,
            propertyType: 'N/A',
            documents: isPesquisaQualificada ? [] : files,
            total: total,
            createdAt: new Date(),
            updatedAt: new Date(),
            paymentConfirmedAt: new Date(),
            report: undefined,
            description: generateOrderDescription(),
            messages: [
                { id: `msg-${Date.now()}`, sender: user!, content: 'Pedido criado e pagamento efetuado.', createdAt: new Date() }
            ]
        };
        addOrder(newOrder);
        setStep(s => s + 1);
    };

    const handleDocumentsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isConsultation) {
            handleConsultationSubmit();
        } else {
            nextStep();
        }
    };

    const isStep1Valid = useCallback(() => {
        if (!selectedService) return false;
        
        const requiredFields: { [key in ServiceId]?: string[] } = {
            [ServiceId.QualifiedSearch]: ['cpfCnpj', 'state', 'city'],
            [ServiceId.DigitalCertificate]: ['state', 'city', 'registry', 'matricula'],
            [ServiceId.PreAnalysis]: ['state', 'city', 'registry'],
            [ServiceId.RegistryIntermediation]: ['state', 'city', 'registry'],
            [ServiceId.DocPreparation]: ['intendedAct', 'state', 'city', 'registry', 'matricula'],
            [ServiceId.TechnicalReport]: [],
            [ServiceId.DevolutionaryNoteAnalysis]: [],
        };

        const fields = requiredFields[selectedService.id] || [];
        return fields.every(field => serviceSpecificData[field] && serviceSpecificData[field].trim());
    }, [selectedService, serviceSpecificData]);
    
    const Stepper = () => {
        const steps = isConsultation
            ? ["Serviço", "Documentos", "Confirmação"]
            : isPesquisaQualificada
            ? ["Serviço", "Pagamento", "Confirmação"]
            : ["Serviço", "Documentos", "Pagamento", "Confirmação"];
        
        let displayStep = step;
        if (isPesquisaQualificada) {
            if (step === 3) displayStep = 2; // Payment is the 2nd step in this flow
            else if (step === 4) displayStep = 3; // Confirmation is the 3rd
        }
        
        const currentStep = displayStep;
        const progressPercentage = currentStep > 1 ? ((currentStep - 1) / (steps.length - 1)) * 100 : 0;

        return (
            <div className="w-full">
                <div className="relative">
                    <div className="absolute top-5 left-0 w-full h-1 bg-slate-200" aria-hidden="true"></div>
                    <div 
                        className="absolute top-5 left-0 h-1 bg-green-600 transition-all duration-500" 
                        style={{ width: `${progressPercentage}%` }}
                        aria-hidden="true"
                    ></div>
                    
                    <ol className="relative flex justify-between items-start w-full">
                        {steps.map((title, index) => {
                            const stepNumber = index + 1;
                            const isCompleted = currentStep > stepNumber;
                            const isCurrent = currentStep === stepNumber;
                            
                            return (
                                <li key={title} className="text-center flex-1">
                                    <div className="flex flex-col items-center">
                                        <span 
                                            className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors duration-300 relative ${
                                                isCompleted ? 'bg-green-600 text-white border-2 border-green-600' : 
                                                isCurrent ? 'bg-blue-50 text-brand-primary border-2 border-brand-secondary' : 
                                                'bg-white border-2 border-slate-200 text-slate-500'
                                            }`}
                                        >
                                            {isCompleted ? <CheckCircleIcon className="w-5 h-5"/> : stepNumber}
                                        </span>
                                        <p className={`mt-2 text-sm font-medium ${isCompleted ? 'text-green-600' : isCurrent ? 'text-brand-primary' : 'text-slate-500'}`}>
                                            {title}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>
        );
    };

    const renderServiceSpecificFields = () => {
        if (!selectedService) return null;
        
        const commonFields = "w-full p-3 border rounded-lg bg-white text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed";
        
        const renderInput = (name: string, label: string, placeholder = '', type: 'text' | 'textarea' = 'text', required = true) => (
            <div>
                <label htmlFor={name} className="block text-sm font-medium mb-1">{label}</label>
                {type === 'text' ? (
                    <input 
                        type="text" 
                        id={name} 
                        name={name} 
                        value={serviceSpecificData[name] || ''} 
                        onChange={handleServiceDataChange} 
                        className={commonFields} 
                        placeholder={placeholder} 
                        required={required}
                        inputMode={name === 'matricula' ? 'numeric' : 'text'}
                    />
                ) : (
                    <textarea id={name} name={name} value={serviceSpecificData[name] || ''} onChange={handleServiceDataChange} className={commonFields} placeholder={placeholder} required={required} rows={3} />
                )}
            </div>
        );

        const citiesForState = selectedState ? CITIES_BY_STATE[selectedState] || [] : [];
    
        const renderLocationSelectors = (config: { state?: boolean, city?: boolean, registry?: boolean }) => (
            <>
                {config.state && (
                    <div>
                        <label htmlFor="state" className="block text-sm font-medium mb-1">Estado</label>
                        <select id="state" name="state" value={selectedState || ''} onChange={handleServiceDataChange} className={commonFields} required>
                            <option value="" disabled>Selecione um estado</option>
                            {BRAZILIAN_STATES.map(state => <option key={state.uf} value={state.uf}>{state.name}</option>)}
                        </select>
                    </div>
                )}
                {config.city && (
                     <div>
                        <label htmlFor="city" className="block text-sm font-medium mb-1">Cidade</label>
                        <select id="city" name="city" value={selectedCity || ''} onChange={handleServiceDataChange} className={commonFields} disabled={!selectedState || citiesForState.length === 0} required>
                            <option value="" disabled>Selecione uma cidade</option>
                            {citiesForState.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                    </div>
                )}
                {config.registry && (
                     <div>
                        <label htmlFor="registry" className="block text-sm font-medium mb-1">Cartório de Registro de Imóveis</label>
                        <select id="registry" name="registry" value={serviceSpecificData.registry || ''} onChange={handleServiceDataChange} className={commonFields} disabled={!selectedCity || isLoadingRegistries || registries.length === 0} required>
                            {isLoadingRegistries ? (
                                <option>Buscando cartórios...</option>
                            ) : (
                                <>
                                    <option value="" disabled>Selecione um cartório</option>
                                    {registries.map(registry => <option key={registry} value={registry}>{registry}</option>)}
                                </>
                            )}
                        </select>
                        {isLoadingRegistries && <div className="text-xs text-slate-500 mt-1 animate-pulse">Simulando busca no sistema do CNJ...</div>}
                    </div>
                )}
            </>
        );


        switch(selectedService.id) {
            case ServiceId.QualifiedSearch:
                return (
                    <div className="space-y-4">
                        {renderInput('cpfCnpj', 'CPF ou CNPJ do Pesquisado')}
                        {renderLocationSelectors({ state: true, city: true })}
                        {renderInput('registries', 'Cartórios Específicos (Opcional)', 'Deixe em branco para buscar em todos da cidade', 'text', false)}
                    </div>
                );
            case ServiceId.DigitalCertificate:
                 return (
                    <div className="space-y-4">
                        {renderLocationSelectors({ state: true, city: true, registry: true })}
                        {renderInput('matricula', 'Número da Matrícula')}
                    </div>
                );
            case ServiceId.PreAnalysis:
                return (
                    <div className="space-y-4">
                        {renderLocationSelectors({ state: true, city: true, registry: true })}
                        {renderInput('comarca', 'Comarca (se diferente da cidade)', '', 'text', false)}
                    </div>
                );
             case ServiceId.RegistryIntermediation:
                return (
                    <div className="space-y-4">
                        {renderLocationSelectors({ state: true, city: true, registry: true })}
                        {renderInput('matricula', 'Número da Matrícula (Opcional)', '', 'text', false)}
                    </div>
                );
            case ServiceId.DocPreparation:
                return (
                    <div className="space-y-4">
                         {renderInput('intendedAct', 'Ato Pretendido (ex: Averbação de construção)', '', 'textarea')}
                         {renderLocationSelectors({ state: true, city: true, registry: true })}
                         {renderInput('matricula', 'Número da Matrícula')}
                    </div>
                );
            case ServiceId.TechnicalReport:
                return <p className="text-sm text-slate-500 text-center p-4 bg-slate-50 rounded-lg">Para o parecer técnico, por favor, anexe a certidão de matrícula do seu imóvel na próxima etapa.</p>;
            case ServiceId.DevolutionaryNoteAnalysis:
                return <p className="text-sm text-slate-500 text-center p-4 bg-slate-50 rounded-lg">Para a análise, por favor, anexe a certidão de matrícula, os documentos enviados ao cartório e a nota devolutiva na próxima etapa.</p>;
            default:
                return null;
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1: // Serviço
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Escolha do Serviço</h2>
                        <p className="text-slate-500 mb-6">Selecione o serviço que melhor atende sua necessidade.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {SERVICES.map(service => (
                                <div key={service.id} onClick={() => { setSelectedService(service); setServiceSpecificData({})}} className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedService?.id === service.id ? 'border-brand-secondary bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <h3 className="font-bold">{service.name}</h3>
                                    <p className="text-sm text-slate-600">{service.description}</p>
                                    <p className="text-lg font-bold mt-2">{service.price ? `R$ ${service.price?.toFixed(2).replace('.', ',')}` : 'Sob Consulta'}</p>
                                </div>
                            ))}
                        </div>
                        {selectedService && (
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3 text-slate-800">Informações Necessárias</h3>
                                {renderServiceSpecificFields()}
                            </div>
                        )}
                        <div className="mt-8 flex justify-between">
                            <button type="button" onClick={() => setPage(Page.Dashboard)} className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg">Cancelar</button>
                            <button type="button" onClick={isPesquisaQualificada ? () => setStep(3) : nextStep} disabled={!isStep1Valid()} className="bg-brand-accent text-white font-bold py-3 px-6 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed">Próximo</button>
                        </div>
                    </div>
                );
            case 2: // Documentos
                return (
                    <form onSubmit={handleDocumentsSubmit}>
                        <h2 className="text-2xl font-bold mb-1">Envio de Documentos</h2>
                        <p className="text-slate-500 mb-6">Anexe os documentos necessários para a análise.</p>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                            <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                            <label htmlFor="file-upload" className="mt-4 inline-block bg-brand-secondary text-white font-semibold py-2 px-4 rounded-lg cursor-pointer hover:bg-brand-primary">
                                Selecionar Arquivos
                            </label>
                            <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                            <p className="mt-2 text-xs text-slate-500">PDF, JPG, PNG, DOCX. <span className="font-semibold">Dica: Prefira o formato .pdf.</span></p>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-6 space-y-3">
                                {files.map(file => (
                                    <div key={file.name} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FileIcon className="h-6 w-6 text-brand-primary flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate" title={file.name}>{file.name}</p>
                                                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeFile(file.name)} className="text-red-500 hover:text-red-700 ml-2">
                                            <TrashIcon className="h-5 w-5"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-6">
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">Descrição e Dúvidas (Obrigatório)</label>
                            <textarea
                                id="description"
                                value={documentDescription}
                                onChange={e => setDocumentDescription(e.target.value)}
                                className="w-full p-3 border rounded-lg bg-white text-slate-900"
                                rows={4}
                                placeholder="Descreva o que você busca com este serviço e liste quaisquer dúvidas específicas que você tenha."
                                required
                            />
                        </div>
                         <div className="mt-8 flex justify-between">
                            <button type="button" onClick={prevStep} className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg">Voltar</button>
                            <button type="submit" className="bg-brand-accent text-white font-bold py-3 px-6 rounded-lg">Próximo</button>
                        </div>
                    </form>
                );
            case 3: // Pagamento ou Confirmação (para Consulta)
                if (isConsultation) {
                    return (
                        <div className="text-center">
                            <CheckCircleIcon className="mx-auto h-24 w-24 text-green-500" />
                            <h2 className="text-3xl font-bold mt-4">Solicitação de Orçamento Enviada!</h2>
                            <p className="text-slate-600 mt-2 max-w-lg mx-auto">Recebemos suas informações. Nossa equipe de especialistas irá analisar sua solicitação e entrará em contato em breve com um orçamento detalhado no seu painel.</p>
                            <button onClick={() => setPage(Page.Dashboard)} className="mt-8 bg-brand-accent text-white font-bold py-3 px-6 rounded-lg">Acessar meu Painel</button>
                        </div>
                    );
                }

                const tempOrderForPayment: Order = {
                    id: 'temp',
                    total: total,
                    service: selectedService!,
                    client: user!, status: OrderStatus.Pending, isUrgent: false, propertyType: '', documents: [], createdAt: new Date(), updatedAt: new Date(), description: '', messages: []
                };

                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Resumo e Pagamento</h2>
                        <p className="text-slate-500 mb-6">Confira os detalhes e escolha a forma de pagamento.</p>
                        <div className="bg-slate-50 p-6 rounded-lg border">
                            <h3 className="font-bold mb-4 text-lg">Resumo do Pedido</h3>
                            <div className="space-y-2 text-slate-700">
                                <div className="flex justify-between"><span>Serviço:</span> <span className="font-medium text-right">{selectedService?.name}</span></div>
                                <div className="flex justify-between border-t pt-2 mt-2 text-xl font-bold text-brand-primary"><span>Total:</span> <span>R$ {total.toFixed(2).replace('.', ',')}</span></div>
                            </div>
                        </div>
                        <div className="mt-6">
                           <Payment order={tempOrderForPayment} onPaymentSuccess={handlePaymentSuccess} />
                        </div>
                         <div className="mt-8 flex justify-between">
                            <button type="button" onClick={isPesquisaQualificada ? () => setStep(1) : prevStep} className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg">Voltar</button>
                        </div>
                    </div>
                );
             case 4: // Confirmação
                return (
                    <div className="text-center">
                        <CheckCircleIcon className="mx-auto h-24 w-24 text-green-500" />
                        <h2 className="text-3xl font-bold mt-4">Pedido Realizado com Sucesso!</h2>
                        <p className="text-slate-600 mt-2">Você receberá um email com os detalhes. Acompanhe o status no seu painel.</p>
                        <button onClick={() => setPage(Page.Dashboard)} className="mt-8 bg-brand-accent text-white font-bold py-3 px-6 rounded-lg">Acessar meu Painel</button>
                    </div>
                );
        }
    };

    return (
        <div className="py-12 sm:py-16 bg-brand-light">
            <div className="container mx-auto px-4">
                <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                    <Stepper />
                    <div className="mt-12">
                        {renderStep()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderFlow;