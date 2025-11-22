import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../App';
import { SERVICES } from '../constants';
import { MOCK_USERS } from '../data/mocks';
import { Service, UploadedFile, Page, ServiceId, Order, OrderStatus } from '../types';
import { UploadIcon, FileIcon, TrashIcon, CheckCircleIcon, ShieldCheckIcon, AlertTriangleIcon, ClockIcon } from '../components/icons/Icons';
import Payment from '../components/Payment';
import { BRAZILIAN_STATES } from '../data/locations';
import { findRegistriesByCity } from '../services/registryService';
import { isValidCPF, isValidCNPJ, isValidCpfOrCnpj } from '../utils/validators';
import { OrderService } from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';

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
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [serviceSpecificData, setServiceSpecificData] = useState<Record<string, string>>({});
    const [registries, setRegistries] = useState<string[]>([]);
    const [isLoadingRegistries, setIsLoadingRegistries] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [cities, setCities] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [documentDescription, setDocumentDescription] = useState('');
    const [fileError, setFileError] = useState('');
    const [missingInfoData, setMissingInfoData] = useState({ cpf: '', address: '' });
    const [invoiceCpfError, setInvoiceCpfError] = useState('');
    
    // 🔥 NOVOS ESTADOS DE LOADING
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentAction, setCurrentAction] = useState<string>('');
    const [isGeneratingPix, setIsGeneratingPix] = useState(false);

    const { user, setPage, addOrder, updateUserProfile, addNotification } = useAuth();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const selectedCity = serviceSpecificData.city;
    const selectedState = serviceSpecificData.state;

    useEffect(() => {
        if (selectedState) {
            setIsLoadingCities(true);
            setCurrentAction('Buscando cidades...');
            fetchCitiesByState(selectedState)
                .then(fetchedCities => {
                    setCities(fetchedCities);
                    setIsLoadingCities(false);
                    setCurrentAction('');
                })
                .catch(() => {
                    setIsLoadingCities(false);
                    setCurrentAction('');
                });
        } else {
            setCities([]);
        }
    }, [selectedState]);

    useEffect(() => {
        if (selectedCity && selectedState) {
            const fetchRegistries = async () => {
                setIsLoadingRegistries(true);
                setCurrentAction('Buscando cartórios...');
                setServiceSpecificData(prev => ({ ...prev, registry: '' })); 
                
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
                    setRegistries([`${registryType === 'civil' ? 'Cartório de Registro Civil' : 'Cartório de Registro de Imóveis'} de ${selectedCity}`]); 
                } finally {
                    setIsLoadingRegistries(false);
                    setCurrentAction('');
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
                error = 'CPF ou CNPJ inválido.';
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

        if (name === 'cpfCnpj') {
            processedValue = formatCpfCnpj(value);
        } else if (name.includes('cpf') || name === 'cpf1' || name === 'cpf2') {
             processedValue = formatCPF(value);
        } else if (name === 'matricula') {
             processedValue = value.replace(/\D/g, '');
        } else if (name.includes('birthDate')) {
            processedValue = formatDate(value);
        }

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
                delete newState.city;
                delete newState.registry;
            }
            if (name === 'city') {
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
                fileRef: file
            }));
            
            // 🔥 VALIDAÇÃO DE ARQUIVOS
            const invalidFile = newFiles.find(file => {
                const allowedTypes = [
                    'application/pdf',
                    'image/jpeg', 
                    'image/png',
                    'image/jpg',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ];
                
                if (!allowedTypes.includes(file.type)) {
                    return true;
                }
                
                if (file.size > 10 * 1024 * 1024) {
                    return true;
                }
                
                return false;
            });
            
            if (invalidFile) {
                setFileError('Arquivo inválido. Use PDF, Word ou imagens (máx. 10MB).');
                addNotification('Tipo de arquivo não suportado ou muito grande.', 'error');
                return;
            }
            
            setFiles(prev => [...prev, ...newFiles]);
            setFileError('');
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
            default: generatedDescription = '';
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
        updateUserProfile({ cpf: missingInfoData.cpf, address: missingInfoData.address });
        addNotification("Dados salvos com sucesso.", "success");
    };

    const submitOrder = async (initialStatus: OrderStatus) => {
        if (!user || !selectedService) {
            addNotification('Erro: usuário ou serviço não encontrado.', 'error');
            return;
        }
        
        setIsSubmitting(true);
        setCurrentAction('Criando pedido...');

        try {
            const orderData: Omit<Order, 'id'> = {
                client: user,
                service: selectedService,
                analyst: undefined,
                status: initialStatus,
                isUrgent: false,
                propertyType: 'N/A',
                documents: [],
                total: total,
                createdAt: new Date(),
                updatedAt: new Date(),
                paymentConfirmedAt: initialStatus === OrderStatus.InProgress ? new Date() : undefined,
                description: generateOrderDescription(),
                messages: []
            };

            const createdOrder = await OrderService.createOrder(orderData);
            
            // 🔥 UPLOAD COM PROGRESSO SIMULADO
            if (files.length > 0) {
                setCurrentAction('Enviando documentos...');
                const realFiles = files.filter(f => f.fileRef);
                
                for (let i = 0; i < realFiles.length; i++) {
                    setUploadProgress(Math.round(((i + 1) / realFiles.length) * 100));
                    await OrderService.uploadFile(realFiles[i].fileRef!, createdOrder.id);
                }
                setUploadProgress(0);
            }

            addOrder(createdOrder);
            
            if (initialStatus === OrderStatus.AwaitingQuote) {
                nextStep();
            } else {
                setStep(4);
            }

            addNotification('Pedido criado com sucesso!', 'success');
            
        } catch (error: any) {
            console.error("Erro ao criar pedido:", error);
            addNotification(
                error.message || "Erro ao processar pedido. Tente novamente.", 
                'error'
            );
        } finally {
            setIsSubmitting(false);
            setCurrentAction('');
            setUploadProgress(0);
        }
    };

    const handleConsultationSubmit = () => submitOrder(OrderStatus.AwaitingQuote);
    const handlePaymentSuccess = () => submitOrder(OrderStatus.InProgress);

    const handleDocumentsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 🔥 VALIDAÇÃO MELHORADA
        const servicesRequiringFiles = [ServiceId.PreAnalysis, ServiceId.RegistryIntermediation, ServiceId.DocPreparation, ServiceId.TechnicalReport, ServiceId.DevolutionaryNoteAnalysis];

        if (selectedService && servicesRequiringFiles.includes(selectedService.id)) {
            if (files.length === 0) {
                setFileError('Para este serviço, é obrigatório anexar a documentação.');
                addNotification('Por favor, anexe os documentos necessários.', 'error');
                return;
            }
        }

        if (isConsultation) {
            await handleConsultationSubmit();
        } else {
            nextStep();
        }
    };

    const isStep1Valid = useCallback(() => {
        if (!selectedService) return false;
        const data = serviceSpecificData;
        const hasErrors = Object.keys(fieldErrors).length > 0;
        if (hasErrors) return false;

        if (selectedService.id === ServiceId.DigitalCertificate) {
            if (!data.certificateType) return false;
            if (data.certificateType === 'imovel') return !!(data.state && data.city && data.registry && data.matricula);
            if (data.certificateType === 'nascimento') return !!(data.fullName && data.birthDate && data.state && data.city && data.registry && data.filiacao1 && data.filiacao2);
            if (data.certificateType === 'casamento') return !!(data.spouse1Name && data.cpf1 && data.spouse1Filiacao1 && data.spouse1Filiacao2 && data.spouse2Name && data.cpf2 && data.spouse2Filiacao1 && data.spouse2Filiacao2 && data.state && data.city && data.registry && data.regime);
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
        const steps = isConsultation ? ["Serviço", "Documentos", "Confirmação"] : isPesquisaQualificada ? ["Serviço", "Pagamento", "Confirmação"] : ["Serviço", "Documentos", "Pagamento", "Confirmação"];
        let displayStep = step;
        if (isPesquisaQualificada) {
            if (step === 3) displayStep = 2;
            else if (step === 4) displayStep = 3;
        }
        const currentStep = displayStep;
        const progressPercentage = currentStep > 1 ? ((currentStep - 1) / (steps.length - 1)) * 100 : 0;
        return (
            <div className="w-full">
                <div className="relative">
                    <div className="absolute top-5 left-0 w-full h-1 bg-slate-200"></div>
                    <div className="absolute top-5 left-0 h-1 bg-green-600 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    <ol className="relative flex justify-between items-start w-full">
                        {steps.map((title, index) => {
                            const stepNumber = index + 1;
                            const isCompleted = currentStep > stepNumber;
                            const isCurrent = currentStep === stepNumber;
                            return (
                                <li key={title} className="text-center flex-1">
                                    <div className="flex flex-col items-center">
                                        <span className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors duration-300 relative ${isCompleted ? 'bg-green-600 text-white border-2 border-green-600' : isCurrent ? 'bg-blue-50 text-brand-primary border-2 border-brand-secondary' : 'bg-white border-2 border-slate-200 text-slate-500'}`}>
                                            {isCompleted ? <CheckCircleIcon className="w-5 h-5"/> : stepNumber}
                                        </span>
                                        <p className={`mt-2 text-sm font-medium ${isCompleted ? 'text-green-600' : isCurrent ? 'text-brand-primary' : 'text-slate-500'}`}>{title}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>
                
                {/* 🔥 INDICADOR DE CARREGAMENTO GLOBAL */}
                {currentAction && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <LoadingSpinner size="sm" color="text-blue-600" />
                                <span className="text-sm text-blue-700 font-medium">{currentAction}</span>
                            </div>
                            {uploadProgress > 0 && (
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                    {uploadProgress}%
                                </span>
                            )}
                        </div>
                        {uploadProgress > 0 && (
                            <div className="mt-2 w-full bg-blue-200 rounded-full h-1">
                                <div 
                                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderServiceSpecificFields = () => {
        if (!selectedService) return null;
        
        const commonClasses = "w-full p-3 border rounded-lg bg-white text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed";
        const data = serviceSpecificData;

        switch (selectedService.id) {
            case ServiceId.QualifiedSearch:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">CPF/CNPJ para Pesquisa *</label>
                            <input
                                type="text"
                                name="cpfCnpj"
                                value={data.cpfCnpj || ''}
                                onChange={handleServiceDataChange}
                                onBlur={handleFieldBlur}
                                className={`${commonClasses} ${fieldErrors.cpfCnpj ? 'border-red-500' : 'border-slate-300'}`}
                                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                required
                            />
                            {fieldErrors.cpfCnpj && <p className="text-xs text-red-500 mt-1">{fieldErrors.cpfCnpj}</p>}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Estado *</label>
                                <select
                                    name="state"
                                    value={data.state || ''}
                                    onChange={handleServiceDataChange}
                                    className={commonClasses}
                                    required
                                >
                                    <option value="">Selecione o estado</option>
                                    {BRAZILIAN_STATES.map(state => (
                                        <option key={state.uf} value={state.uf}>
                                            {state.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Cidade *</label>
                                <select
                                    name="city"
                                    value={data.city || ''}
                                    onChange={handleServiceDataChange}
                                    className={commonClasses}
                                    disabled={!data.state || isLoadingCities}
                                    required
                                >
                                    <option value="">{isLoadingCities ? 'Carregando cidades...' : 'Selecione a cidade'}</option>
                                    {cities.map(city => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case ServiceId.DigitalCertificate:
                if (!data.certificateType) {
                    return (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-800">Tipo de Certidão</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { value: 'imovel', label: 'Certidão de Imóvel' },
                                    { value: 'nascimento', label: 'Certidão de Nascimento' },
                                    { value: 'casamento', label: 'Certidão de Casamento' }
                                ].map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setServiceSpecificData(prev => ({ ...prev, certificateType: type.value }))}
                                        className="p-4 border-2 rounded-lg text-center hover:border-brand-secondary transition-colors"
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                }

                // ... (resto dos campos específicos para cada tipo de certidão)
                return <div>Campos específicos para {data.certificateType}</div>;

            default:
                return null;
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-brand-primary mb-4">Escolha o Serviço</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {SERVICES.map(service => (
                                    <div
                                        key={service.id}
                                        onClick={() => setSelectedService(service)}
                                        className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                                            selectedService?.id === service.id
                                                ? 'border-brand-secondary bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <h3 className="font-bold text-lg mb-2">{service.name}</h3>
                                        <p className="text-slate-600 text-sm mb-3">{service.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500">
                                                <ClockIcon className="inline w-4 h-4 mr-1" />
                                                {service.duration}
                                            </span>
                                            {service.price !== null ? (
                                                <span className="font-bold text-brand-primary">
                                                    R$ {service.price.toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-blue-600 font-semibold">Sob Orçamento</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedService && (
                            <div className="bg-white p-6 rounded-lg border border-slate-200">
                                <h3 className="font-bold text-lg mb-4">Detalhes do {selectedService.name}</h3>
                                {renderServiceSpecificFields()}
                            </div>
                        )}

                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={() => setPage(Page.Dashboard)}
                                className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={!isStep1Valid()}
                                className="px-6 py-3 bg-brand-secondary text-white rounded-lg hover:bg-brand-primary disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-brand-primary mb-4">
                                {isConsultation ? 'Documentos e Observações' : 'Documentos para Análise'}
                            </h2>
                            
                            <div className="bg-white p-6 rounded-lg border border-slate-200">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">Observações Adicionais</label>
                                    <textarea
                                        value={documentDescription}
                                        onChange={(e) => setDocumentDescription(e.target.value)}
                                        className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 resize-none"
                                        rows={4}
                                        placeholder="Descreva qualquer informação adicional que possa ajudar na análise do seu caso..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Anexar Documentos {selectedService && [ServiceId.PreAnalysis, ServiceId.RegistryIntermediation, ServiceId.DocPreparation, ServiceId.TechnicalReport, ServiceId.DevolutionaryNoteAnalysis].includes(selectedService.id) && '*'}
                                    </label>
                                    
                                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            <UploadIcon className="w-5 h-5" />
                                            Selecionar Arquivos
                                        </label>
                                        <p className="text-sm text-slate-500 mt-2">
                                            PDF, Word ou imagens (máx. 10MB cada)
                                        </p>
                                    </div>

                                    {fileError && (
                                        <p className="text-red-500 text-sm mt-2">{fileError}</p>
                                    )}

                                    {files.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {files.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <FileIcon className="w-5 h-5 text-brand-primary" />
                                                        <div>
                                                            <p className="font-medium text-sm">{file.name}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(file.name)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={prevStep}
                                className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                            >
                                Voltar
                            </button>
                            <button
                                type="button"
                                onClick={handleDocumentsSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-brand-secondary text-white rounded-lg hover:bg-brand-primary disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        Processando...
                                    </>
                                ) : isConsultation ? (
                                    'Solicitar Orçamento'
                                ) : (
                                    'Continuar para Pagamento'
                                )}
                            </button>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-brand-primary mb-4">Pagamento</h2>
                        
                        <div className="bg-white p-6 rounded-lg border border-slate-200">
                            <Payment 
                                order={{
                                    id: 'temp-order',
                                    client: user!,
                                    service: selectedService!,
                                    status: OrderStatus.Pending,
                                    isUrgent: false,
                                    propertyType: 'N/A',
                                    documents: [],
                                    total: total,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    description: generateOrderDescription(),
                                    messages: []
                                }}
                                onPaymentSuccess={handlePaymentSuccess}
                            />
                        </div>

                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={prevStep}
                                className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="text-center space-y-6">
                        <div className="bg-white p-8 rounded-lg border border-slate-200">
                            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-brand-primary mb-2">
                                {isConsultation ? 'Solicitação Enviada!' : 'Pedido Concluído!'}
                            </h2>
                            <p className="text-slate-600 mb-6">
                                {isConsultation 
                                    ? 'Sua solicitação de orçamento foi enviada com sucesso. Nossa equipe entrará em contato em breve.'
                                    : 'Seu pedido foi processado com sucesso. Você pode acompanhar o andamento no seu painel.'
                                }
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => setPage(Page.Dashboard)}
                                    className="px-6 py-3 bg-brand-secondary text-white rounded-lg hover:bg-brand-primary"
                                >
                                    Ir para o Painel
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedService(null);
                                        setServiceSpecificData({});
                                        setFiles([]);
                                        setDocumentDescription('');
                                        setStep(1);
                                    }}
                                    className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                                >
                                    Novo Pedido
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="py-12 sm:py-16 bg-brand-light">
            <div className="container mx-auto px-4 max-w-4xl">
                <Stepper />
                <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                    {renderStepContent()}
                </div>
            </div>
        </div>
    );
};

export default OrderFlow;