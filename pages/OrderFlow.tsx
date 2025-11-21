import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../App';
import { SERVICES } from '../constants';
import { MOCK_USERS } from '../data/mocks';
import { Service, UploadedFile, Page, ServiceId, Order, OrderStatus } from '../types';
import { UploadIcon, FileIcon, TrashIcon, CheckCircleIcon, ShieldCheckIcon, AlertTriangleIcon } from '../components/icons/Icons';
import Payment from '../components/Payment';
import { BRAZILIAN_STATES } from '../data/locations';
import { findRegistriesByCity } from '../services/registryService';
import { isValidCPF, isValidCNPJ, isValidCpfOrCnpj } from '../utils/validators';

// Função auxiliar para buscar cidades na API do IBGE
const fetchCitiesByState = async (uf: string): Promise<string[]> => {
    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        if (!response.ok) throw new Error('Falha ao buscar cidades');
        const data = await response.json();
        return data.map((city: any) => city.nome).sort();
    } catch (error) {
        console.error("Erro ao carregar cidades:", error);
        return [];
    }
};

// Funções de formatação
const formatCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
};

const formatCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
};

const formatCpfCnpj = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 11) {
        return formatCPF(cleanValue);
    } else {
        return formatCNPJ(cleanValue);
    }
};

const formatDate = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .slice(0, 10);
};


const OrderFlow: React.FC = () => {
    const [step, setStep] = useState(1);
    
    // Step 1 State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [serviceSpecificData, setServiceSpecificData] = useState<Record<string, string>>({});
    const [registries, setRegistries] = useState<string[]>([]);
    const [isLoadingRegistries, setIsLoadingRegistries] = useState(false);
    
    // Estado para erros de validação dos campos do serviço
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    
    // Estado para cidades carregadas da API
    const [cities, setCities] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    // Step 2 State
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [documentDescription, setDocumentDescription] = useState('');
    const [fileError, setFileError] = useState('');

    // Estado para completar cadastro (se faltar CPF/Endereço)
    const [missingInfoData, setMissingInfoData] = useState({ cpf: '', address: '' });
    const [invoiceCpfError, setInvoiceCpfError] = useState('');
    
    const { user, setPage, addOrder, updateUserProfile, addNotification } = useAuth();

    // Rola para o topo sempre que a etapa (step) mudar
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const selectedCity = serviceSpecificData.city;
    const selectedState = serviceSpecificData.state;

    // Carrega cidades quando o estado muda
    useEffect(() => {
        if (selectedState) {
            setIsLoadingCities(true);
            fetchCitiesByState(selectedState)
                .then(fetchedCities => {
                    setCities(fetchedCities);
                    setIsLoadingCities(false);
                });
        } else {
            setCities([]);
        }
    }, [selectedState]);

    useEffect(() => {
        if (selectedCity && selectedState) {
            const fetchRegistries = async () => {
                setIsLoadingRegistries(true);
                setServiceSpecificData(prev => ({ ...prev, registry: '' })); // Clear previous selection
                
                // Determina o tipo de cartório com base no serviço selecionado
                let registryType: 'imoveis' | 'civil' = 'imoveis';
                
                if (selectedService?.id === ServiceId.DigitalCertificate) {
                    if (serviceSpecificData.certificateType === 'nascimento' || serviceSpecificData.certificateType === 'casamento') {
                        registryType = 'civil';
                    }
                }

                try {
                    const foundRegistries = await findRegistriesByCity(selectedState, selectedCity, registryType);
                    setRegistries(foundRegistries);
                } catch (error) {
                    console.error("Failed to fetch registries:", error);
                    setRegistries([`${registryType === 'civil' ? 'Cartório de Registro Civil' : 'Cartório de Registro de Imóveis'} de ${selectedCity}`]); // Fallback
                } finally {
                    setIsLoadingRegistries(false);
                }
            };
            fetchRegistries();
        } else {
            setRegistries([]);
        }
    }, [selectedCity, selectedState, selectedService, serviceSpecificData.certificateType]);

    const total = useMemo(() => {
        if (!selectedService || selectedService.price === null) return 0;
        return selectedService.price;
    }, [selectedService]);

    const isConsultation = useMemo(() => selectedService?.price === null, [selectedService]);
    const isPesquisaQualificada = useMemo(() => selectedService?.id === ServiceId.QualifiedSearch, [selectedService]);

    const validateField = (name: string, value: string) => {
        let error = '';
        
        if (name === 'cpfCnpj') {
            if (value && !isValidCpfOrCnpj(value)) {
                error = 'CPF ou CNPJ inválido. Verifique os dígitos.';
            }
        } else if (name.includes('cpf') || name === 'cpf1' || name === 'cpf2') {
            if (value && !isValidCPF(value)) {
                error = 'CPF inválido.';
            }
        }

        setFieldErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleServiceDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Aplicar formatação obrigatória
        if (name === 'cpfCnpj') {
            processedValue = formatCpfCnpj(value);
        } else if (name.includes('cpf') || name === 'cpf1' || name === 'cpf2') {
             processedValue = formatCPF(value);
        } else if (name === 'matricula') {
             processedValue = value.replace(/\D/g, '');
        } else if (name.includes('birthDate')) {
            processedValue = formatDate(value);
        }

        // Limpa o erro ao digitar
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        setServiceSpecificData(prev => {
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
    
    const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        validateField(name, value);
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles: UploadedFile[] = Array.from(event.target.files).map((file: File) => ({
                name: file.name,
                size: file.size,
                type: file.type,
            }));
            setFiles(prev => [...prev, ...newFiles]);
            setFileError(''); // Limpa erro ao adicionar arquivo
        }
    };

    const removeFile = (fileName: string) => {
        setFiles(prev => prev.filter(file => file.name !== fileName));
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    
    const generateOrderDescription = (): string => {
        if (!selectedService) return documentDescription;

        const data = serviceSpecificData;
        const stateName = data.state ? BRAZILIAN_STATES.find(s => s.uf === data.state)?.name : '';
        const locationInfo = [data.city, stateName].filter(Boolean).join(' - ');

        let generatedDescription = '';

        switch (selectedService.id) {
            case ServiceId.QualifiedSearch:
                generatedDescription = `Pesquisa Qualificada para CPF/CNPJ: ${data.cpfCnpj || 'Não informado'}\nLocal: ${locationInfo}\nCartórios Específicos: ${data.registries || 'Todos da cidade'}`;
                break;
            case ServiceId.DigitalCertificate:
                if (data.certificateType === 'imovel') {
                    generatedDescription = `Certidão de Imóvel\nLocal: ${locationInfo}\nCartório: ${data.registry || 'Não informado'}\nMatrícula: ${data.matricula || 'Não informada'}`;
                } else if (data.certificateType === 'nascimento') {
                    generatedDescription = `Certidão de Nascimento\nNome: ${data.fullName}\nData de Nascimento: ${data.birthDate}\nLocal de Nascimento: ${locationInfo}\nCartório: ${data.registry || 'Não informado'}\nNome da Mãe: ${data.filiacao1}\nNome do Pai: ${data.filiacao2 || 'Não informada'}`;
                } else if (data.certificateType === 'casamento') {
                    generatedDescription = `Certidão de Casamento\nCônjuge 1: ${data.spouse1Name} (CPF: ${data.cpf1})\nFiliação Cônjuge 1: ${data.spouse1Filiacao1} e ${data.spouse1Filiacao2 || '-'}\nCônjuge 2: ${data.spouse2Name} (CPF: ${data.cpf2})\nFiliação Cônjuge 2: ${data.spouse2Filiacao1} e ${data.spouse2Filiacao2 || '-'}\nLocal do Casamento: ${locationInfo}\nCartório: ${data.registry || 'Não informado'}\nRegime de Bens: ${data.regime}`;
                } else {
                    generatedDescription = `Solicitação de Certidão Digital (Tipo não especificado)`;
                }
                break;
            case ServiceId.PreAnalysis:
                generatedDescription = `Solicitação de Pré-Análise Documental\nEstado: ${stateName}`;
                break;
            case ServiceId.RegistryIntermediation:
                generatedDescription = `Intermediação Registral\nLocal: ${locationInfo}\nCartório: ${data.registry || 'Não informado'}\nMatrícula: ${data.matricula || 'Não informada'}`;
                break;
            case ServiceId.DocPreparation:
                generatedDescription = `Preparação Documental\nAto Pretendido: ${data.intendedAct || 'Não informado'}\nEstado: ${stateName}\nMatrícula: ${data.matricula || 'Não informada'}`;
                break;
            case ServiceId.TechnicalReport:
                generatedDescription = `Relatório de Conformidade de Matrícula\nEstado: ${stateName}`;
                break;
            case ServiceId.DevolutionaryNoteAnalysis:
                generatedDescription = `Análise de Nota Devolutiva\nEstado: ${stateName}`;
                break;
            default:
                return documentDescription;
        }

        return `${generatedDescription}\n\nObservações do cliente:\n${documentDescription || 'Nenhuma.'}`;
    };
    
    const handleUpdateProfileForInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isValidCPF(missingInfoData.cpf)) {
            setInvoiceCpfError('CPF inválido.');
            addNotification("Por favor, informe um CPF válido.", "error");
            return;
        }

        if (!missingInfoData.cpf || !missingInfoData.address) {
            addNotification("Preencha todos os dados para a Nota Fiscal.", "error");
            return;
        }
        updateUserProfile({
            cpf: missingInfoData.cpf,
            address: missingInfoData.address
        });
        addNotification("Dados salvos com sucesso.", "success");
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

        // Lista de serviços onde o upload de documentos é essencial/obrigatório
        const servicesRequiringFiles = [
            ServiceId.PreAnalysis,
            ServiceId.RegistryIntermediation,
            ServiceId.DocPreparation,
            ServiceId.TechnicalReport,
            ServiceId.DevolutionaryNoteAnalysis
        ];

        if (selectedService && servicesRequiringFiles.includes(selectedService.id)) {
            if (files.length === 0) {
                setFileError('Para este serviço, é obrigatório anexar a documentação para análise.');
                addNotification('Por favor, anexe os documentos necessários.', 'error');
                return;
            }
        }

        if (isConsultation) {
            handleConsultationSubmit();
        } else {
            nextStep();
        }
    };

    const isStep1Valid = useCallback(() => {
        if (!selectedService) return false;
        const data = serviceSpecificData;
        
        // Verifica se existe algum erro ativo nos campos
        const hasErrors = Object.keys(fieldErrors).length > 0;
        if (hasErrors) return false;

        if (selectedService.id === ServiceId.DigitalCertificate) {
            if (!data.certificateType) return false;
            if (data.certificateType === 'imovel') {
                return !!(data.state && data.city && data.registry && data.matricula);
            }
            if (data.certificateType === 'nascimento') {
                return !!(data.fullName && data.birthDate && data.state && data.city && data.registry && data.filiacao1 && data.filiacao2);
            }
            if (data.certificateType === 'casamento') {
                return !!(data.spouse1Name && data.cpf1 && data.spouse1Filiacao1 && data.spouse1Filiacao2 && 
                          data.spouse2Name && data.cpf2 && data.spouse2Filiacao1 && data.spouse2Filiacao2 && 
                          data.state && data.city && data.registry && data.regime);
            }
            return false;
        }

        const requiredFields: { [key in ServiceId]?: string[] } = {
            [ServiceId.QualifiedSearch]: ['cpfCnpj', 'state', 'city'],
            [ServiceId.PreAnalysis]: ['state'],
            [ServiceId.RegistryIntermediation]: ['state', 'city', 'registry'],
            [ServiceId.DocPreparation]: ['intendedAct', 'state', 'matricula'],
            [ServiceId.TechnicalReport]: [],
            [ServiceId.DevolutionaryNoteAnalysis]: ['state'],
        };

        const fields = requiredFields[selectedService.id] || [];
        return fields.every(field => serviceSpecificData[field] && serviceSpecificData[field].trim());
    }, [selectedService, serviceSpecificData, fieldErrors]);
    
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
                <label htmlFor={name} className="block text-sm font-medium mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                {type === 'text' ? (
                    <input 
                        type="text" 
                        id={name} 
                        name={name} 
                        value={serviceSpecificData[name] || ''} 
                        onChange={handleServiceDataChange} 
                        onBlur={handleFieldBlur}
                        className={`${commonFields} ${fieldErrors[name] ? 'border-red-500' : 'border-slate-300'}`} 
                        placeholder={placeholder} 
                        required={required}
                        inputMode={(name === 'matricula' || name.includes('cpf')) ? 'numeric' : 'text'}
                    />
                ) : (
                    <textarea id={name} name={name} value={serviceSpecificData[name] || ''} onChange={handleServiceDataChange} className={commonFields} placeholder={placeholder} required={required} rows={3} />
                )}
                {fieldErrors[name] && <p className="text-xs text-red-500 mt-1">{fieldErrors[name]}</p>}
            </div>
        );

        const renderLocationSelectors = (config: { state?: boolean, city?: boolean, registry?: boolean, stateLabel?: string, cityLabel?: string, registryLabel?: string, stateHelp?: string }) => (
            <>
                {config.state && (
                    <div>
                        <label htmlFor="state" className="block text-sm font-medium mb-1">{config.stateLabel || 'Estado'} <span className="text-red-500">*</span></label>
                        <select id="state" name="state" value={selectedState || ''} onChange={handleServiceDataChange} className={commonFields} required>
                            <option value="" disabled>Selecione um estado</option>
                            {BRAZILIAN_STATES.map(state => <option key={state.uf} value={state.uf}>{state.name}</option>)}
                        </select>
                        {config.stateHelp && (
                             <p className="text-xs text-slate-500 mt-1 text-justify">{config.stateHelp}</p>
                        )}
                    </div>
                )}
                {config.city && (
                     <div>
                        <label htmlFor="city" className="block text-sm font-medium mb-1">{config.cityLabel || 'Cidade'} <span className="text-red-500">*</span></label>
                        <select id="city" name="city" value={selectedCity || ''} onChange={handleServiceDataChange} className={commonFields} disabled={!selectedState || isLoadingCities} required>
                            <option value="" disabled>{isLoadingCities ? 'Carregando cidades...' : 'Selecione uma cidade'}</option>
                            {cities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                    </div>
                )}
                {config.registry && (
                     <div>
                        <label htmlFor="registry" className="block text-sm font-medium mb-1">{config.registryLabel || 'Cartório de Registro de Imóveis'} <span className="text-red-500">*</span></label>
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
                    </div>
                )}
            </>
        );

        const LgpdDisclaimer = () => (
             <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-start gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 text-justify">
                    <strong>Segurança e Privacidade:</strong> A Edari utiliza os dados informados acima apenas e exclusivamente para obter a certidão junto ao cartório competente, em total conformidade com a Lei Geral de Proteção de Dados (LGPD).
                </p>
            </div>
        );
        
        const formalRequirementsStateHelp = "Informe o estado onde se pretende praticar os atos para a correta identificação dos requisitos formais exigidos pelos cartórios (Código de Normas).";


        switch(selectedService.id) {
            case ServiceId.QualifiedSearch:
                return (
                    <div className="space-y-4">
                        {renderInput('cpfCnpj', 'CPF ou CNPJ do Pesquisado', 'Somente números')}
                        {renderLocationSelectors({ state: true, city: true })}
                        {renderInput('registries', 'Cartórios Específicos (Opcional)', 'Deixe em branco para buscar em todos da cidade', 'text', false)}
                    </div>
                );
            case ServiceId.DigitalCertificate:
                 return (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="certificateType" className="block text-sm font-medium mb-1">Tipo de Certidão <span className="text-red-500">*</span></label>
                            <select 
                                id="certificateType" 
                                name="certificateType" 
                                value={serviceSpecificData.certificateType || ''} 
                                onChange={handleServiceDataChange} 
                                className={commonFields} 
                                required
                            >
                                <option value="" disabled>Selecione o tipo</option>
                                <option value="imovel">Matrícula de Imóvel</option>
                                <option value="nascimento">Nascimento</option>
                                <option value="casamento">Casamento</option>
                            </select>
                        </div>

                        {serviceSpecificData.certificateType === 'imovel' && (
                            <>
                                {renderLocationSelectors({ state: true, city: true, registry: true })}
                                {renderInput('matricula', 'Número da Matrícula', 'Somente números')}
                                <LgpdDisclaimer />
                            </>
                        )}

                        {serviceSpecificData.certificateType === 'nascimento' && (
                            <>
                                {renderInput('fullName', 'Nome Completo')}
                                {renderInput('birthDate', 'Data de Nascimento (DD/MM/AAAA)', 'DD/MM/AAAA')}
                                {renderLocationSelectors({ 
                                    state: true, 
                                    city: true, 
                                    registry: true, 
                                    stateLabel: 'Estado de Nascimento', 
                                    cityLabel: 'Cidade de Nascimento',
                                    registryLabel: 'Cartório de Registro Civil'
                                })}
                                <div className="bg-slate-100 p-3 rounded-md">
                                    <p className="text-sm font-bold mb-2 text-slate-700">Filiação</p>
                                    {renderInput('filiacao1', 'Nome da Mãe')}
                                    {renderInput('filiacao2', 'Nome do Pai')}
                                </div>
                                <LgpdDisclaimer />
                            </>
                        )}

                        {serviceSpecificData.certificateType === 'casamento' && (
                            <>
                                <div className="bg-slate-100 p-3 rounded-md">
                                    <p className="text-sm font-bold mb-2 text-slate-700">Cônjuge 1</p>
                                    {renderInput('spouse1Name', 'Nome Completo')}
                                    {renderInput('cpf1', 'CPF', '000.000.000-00')}
                                    {renderInput('spouse1Filiacao1', 'Nome da Mãe')}
                                    {renderInput('spouse1Filiacao2', 'Nome do Pai')}
                                </div>
                                <div className="bg-slate-100 p-3 rounded-md">
                                    <p className="text-sm font-bold mb-2 text-slate-700">Cônjuge 2</p>
                                    {renderInput('spouse2Name', 'Nome Completo')}
                                    {renderInput('cpf2', 'CPF', '000.000.000-00')}
                                    {renderInput('spouse2Filiacao1', 'Nome da Mãe')}
                                    {renderInput('spouse2Filiacao2', 'Nome do Pai')}
                                </div>
                                
                                {renderLocationSelectors({ state: true, city: true, registry: true, registryLabel: 'Cartório onde casaram' })}
                                {renderInput('regime', 'Regime de Bens')}
                                <LgpdDisclaimer />
                            </>
                        )}
                    </div>
                );
            case ServiceId.PreAnalysis:
                return (
                    <div className="space-y-4">
                        {renderLocationSelectors({ state: true, stateHelp: formalRequirementsStateHelp })}
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
                         {renderLocationSelectors({ state: true, stateHelp: formalRequirementsStateHelp })}
                         {renderInput('matricula', 'Número da Matrícula')}
                    </div>
                );
            case ServiceId.TechnicalReport:
                return <p className="text-sm text-slate-500 text-center p-4 bg-slate-50 rounded-lg">Para o parecer técnico, por favor, anexe a certidão de matrícula do seu imóvel na próxima etapa.</p>;
            case ServiceId.DevolutionaryNoteAnalysis:
                 return (
                    <div className="space-y-4">
                         {renderLocationSelectors({ state: true, stateHelp: formalRequirementsStateHelp })}
                         <p className="text-sm text-slate-500 text-center p-4 bg-slate-50 rounded-lg mt-4">Por favor, anexe a certidão de matrícula, os documentos enviados ao cartório e a nota devolutiva na próxima etapa.</p>
                    </div>
                );
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
                            {SERVICES.map(service => {
                                const isQuote = service.price === null;
                                return (
                                    <div key={service.id} onClick={() => { setSelectedService(service); setServiceSpecificData({}); setFieldErrors({}); }} className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedService?.id === service.id ? 'border-brand-secondary bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <h3 className="font-bold">{service.name}</h3>
                                        <p className="text-sm text-slate-600">{service.description}</p>
                                        {isQuote && <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded mt-2 inline-block">Sob Orçamento</span>}
                                    </div>
                                );
                            })}
                        </div>
                        {selectedService && (
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3 text-slate-800">Informações Necessárias</h3>
                                {isConsultation && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 flex items-start gap-2">
                                        <ShieldCheckIcon className="w-5 h-5 shrink-0 mt-0.5" />
                                        <p className="text-justify">Este serviço requer análise prévia. Preencha os dados e anexe os documentos na próxima etapa para receber um orçamento personalizado de nossos especialistas. <strong>Retornamos com o orçamento em até 24h.</strong></p>
                                    </div>
                                )}
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
                        <div className={`border-2 border-dashed rounded-lg p-8 text-center ${fileError ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}>
                            <UploadIcon className={`mx-auto h-12 w-12 ${fileError ? 'text-red-400' : 'text-slate-400'}`} />
                            <label htmlFor="file-upload" className="mt-4 inline-block bg-brand-secondary text-white font-semibold py-2 px-4 rounded-lg cursor-pointer hover:bg-brand-primary">
                                Selecionar Arquivos
                            </label>
                            <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                            <p className={`mt-2 text-xs ${fileError ? 'text-red-600 font-bold' : 'text-slate-500'}`}>PDF, JPG, PNG, DOCX. <span className="font-semibold">Dica: Prefira o formato .pdf.</span></p>
                            {fileError && <p className="mt-2 text-sm font-bold text-red-600">{fileError}</p>}
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
                            <p className="text-slate-600 mt-2 max-w-lg mx-auto">Recebemos suas informações. Nossa equipe de especialistas irá analisar sua solicitação e retornaremos com o orçamento em até 24 horas no seu painel.</p>
                            <button onClick={() => setPage(Page.Dashboard)} className="mt-8 bg-brand-accent text-white font-bold py-3 px-6 rounded-lg">Acessar meu Painel</button>
                        </div>
                    );
                }
                
                // Verificar se o usuário possui CPF e Endereço (obrigatório para Nota Fiscal)
                if (user && (!user.cpf || !user.address)) {
                    return (
                        <div className="w-full">
                            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <AlertTriangleIcon className="h-6 w-6 text-yellow-500" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-lg font-medium text-yellow-800">Complete seu cadastro</h3>
                                        <p className="mt-2 text-sm text-yellow-700 text-justify">
                                            Para emitirmos sua <strong>Nota Fiscal</strong> e garantirmos a segurança jurídica da transação, precisamos que você informe seu CPF e Endereço completo. Isso é necessário apenas uma vez.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <form onSubmit={handleUpdateProfileForInvoice} className="space-y-4 bg-white p-6 rounded-lg border border-slate-200">
                                <div>
                                    <label htmlFor="invoice-cpf" className="block text-sm font-medium mb-1 text-slate-700">CPF</label>
                                    <input 
                                        id="invoice-cpf" 
                                        type="text" 
                                        value={missingInfoData.cpf} 
                                        onChange={e => {
                                            setMissingInfoData({...missingInfoData, cpf: formatCPF(e.target.value)});
                                            setInvoiceCpfError('');
                                        }}
                                        onBlur={(e) => {
                                            if(e.target.value && !isValidCPF(e.target.value)) {
                                                setInvoiceCpfError('CPF inválido.');
                                            }
                                        }}
                                        placeholder="000.000.000-00" 
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900 ${invoiceCpfError ? 'border-red-500' : 'border-slate-300'}`} 
                                        required 
                                    />
                                    {invoiceCpfError && <p className="text-xs text-red-500 mt-1">{invoiceCpfError}</p>}
                                </div>
                                <div>
                                    <label htmlFor="invoice-address" className="block text-sm font-medium mb-1 text-slate-700">Endereço Completo</label>
                                    <input 
                                        id="invoice-address" 
                                        type="text" 
                                        value={missingInfoData.address} 
                                        onChange={e => setMissingInfoData({...missingInfoData, address: e.target.value})} 
                                        placeholder="Rua, Nº, Bairro, Cidade - Estado, CEP" 
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary bg-white text-slate-900" 
                                        required 
                                    />
                                </div>
                                <div className="pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={!!invoiceCpfError}
                                        className={`w-full font-bold py-3 px-6 rounded-lg transition-all ${!!invoiceCpfError ? 'bg-slate-400 cursor-not-allowed text-slate-200' : 'bg-brand-secondary text-white hover:opacity-90'}`}
                                    >
                                        Salvar e Continuar para Pagamento
                                    </button>
                                </div>
                            </form>
                            <div className="mt-8 flex justify-between">
                                <button type="button" onClick={isPesquisaQualificada ? () => setStep(1) : prevStep} className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg">Voltar</button>
                            </div>
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