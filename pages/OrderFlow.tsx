import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { SERVICES } from '../constants';
import { Service, ServiceId, UploadedFile, Page } from '../types';
import { UploadIcon, FileIcon, TrashIcon, CheckCircleIcon } from '../components/icons/Icons';

const OrderFlow: React.FC = () => {
    const [step, setStep] = useState(1);
    
    // Step 1 State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Step 2 State
    const [selectedService, setSelectedService] = useState<Service | null>(SERVICES[0]);
    const [propertyType, setPropertyType] = useState('Apartamento');

    // Step 3 State
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [documentDescription, setDocumentDescription] = useState('');
    
    // Step 4 State
    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'PIX' | 'BOLETO'>('CARD');

    const { setPage } = useAuth();

    const total = useMemo(() => {
        if (!selectedService || selectedService.price === null) return 0;
        return selectedService.price;
    }, [selectedService]);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles: UploadedFile[] = Array.from(event.target.files).map(file => ({
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
    
    const handleStep3Submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) {
            alert("Por favor, anexe pelo menos um documento para continuar.");
            return;
        }
        nextStep();
    };

    const handleSubmitOrder = () => {
        // Here you would typically send data to a backend
        console.log({ name, email, password, selectedService, propertyType, files, documentDescription, total, paymentMethod });
        nextStep(); // Move to confirmation step
    };
    
    const Stepper = () => (
        <div className="w-full max-w-2xl mx-auto mb-12">
            <ol className="flex items-center w-full">
                {[ "Cadastro", "Serviço", "Documentos", "Pagamento" ].map((title, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = step > stepNumber;
                    const isCurrent = step === stepNumber;
                    return (
                        <li key={title} className={`flex w-full items-center ${stepNumber < 4 ? 'after:content-[\'\'] after:w-full after:h-1 after:border-b after:border-4 after:inline-block' : ''} ${isCompleted || isCurrent ? 'after:border-brand-secondary' : 'after:border-slate-200'}`}>
                            <span className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${isCompleted ? 'bg-brand-secondary text-white' : isCurrent ? 'bg-blue-200 text-brand-primary border-2 border-brand-secondary' : 'bg-slate-200 text-slate-500'}`}>
                                {isCompleted ? <CheckCircleIcon className="w-5 h-5"/> : stepNumber}
                            </span>
                        </li>
                    );
                })}
            </ol>
             <div className="flex justify-between text-sm font-medium text-slate-600 mt-2">
                <span>Cadastro</span>
                <span>Serviço</span>
                <span>Documentos</span>
                <span>Pagamento</span>
            </div>
        </div>
    );

    const renderStep = () => {
        switch (step) {
            case 1: // Cadastro
                return (
                    <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                        <h2 className="text-2xl font-bold mb-1">Crie sua Conta</h2>
                        <p className="text-slate-500 mb-6">Vamos começar com seus dados básicos.</p>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-1">Nome Completo</label>
                                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-lg" required />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" required />
                            </div>
                             <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-1">Senha</label>
                                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" required minLength={6} placeholder="Mínimo de 6 caracteres" />
                            </div>
                        </div>
                         <div className="mt-8 flex justify-end">
                            <button type="submit" className="bg-brand-accent text-white font-bold py-3 px-6 rounded-lg">Próximo</button>
                        </div>
                    </form>
                );
            case 2: // Serviço
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Escolha do Serviço</h2>
                        <p className="text-slate-500 mb-6">Selecione o serviço que melhor atende sua necessidade.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {SERVICES.filter(s => s.price !== null).map(service => (
                                <div key={service.id} onClick={() => setSelectedService(service)} className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedService?.id === service.id ? 'border-brand-secondary bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <h3 className="font-bold">{service.name}</h3>
                                    <p className="text-sm text-slate-600">{service.description}</p>
                                    <p className="text-lg font-bold mt-2">R$ {service.price?.toFixed(2).replace('.', ',')}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4">
                           <div>
                                <label htmlFor="propertyType" className="block text-sm font-medium mb-1">Tipo de Imóvel</label>
                                <select id="propertyType" value={propertyType} onChange={e => setPropertyType(e.target.value)} className="w-full p-3 border rounded-lg bg-white" required>
                                    <option>Apartamento</option>
                                    <option>Casa</option>
                                    <option>Terreno</option>
                                    <option>Comercial</option>
                                    <option>Rural</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-between">
                            <button type="button" onClick={prevStep} className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg">Voltar</button>
                            <button type="button" onClick={nextStep} disabled={!selectedService} className="bg-brand-accent text-white font-bold py-3 px-6 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed">Próximo</button>
                        </div>
                    </div>
                );
            case 3: // Documentos
                return (
                    <form onSubmit={handleStep3Submit}>
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
                                className="w-full p-3 border rounded-lg"
                                rows={4}
                                placeholder="Descreva o que você busca com esta análise e liste quaisquer dúvidas específicas que você tenha sobre o imóvel ou a documentação."
                                required
                            />
                        </div>
                         <div className="mt-8 flex justify-between">
                            <button type="button" onClick={prevStep} className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg">Voltar</button>
                            <button type="submit" className="bg-brand-accent text-white font-bold py-3 px-6 rounded-lg">Próximo</button>
                        </div>
                    </form>
                );
            case 4: // Pagamento
                 const paymentOptions = [
                    { id: 'CARD', label: 'Cartão de Crédito' },
                    { id: 'PIX', label: 'PIX' },
                    { id: 'BOLETO', label: 'Boleto' },
                ];
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
                            <h3 className="font-bold mb-4 text-lg">Forma de Pagamento</h3>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                                {paymentOptions.map(opt => (
                                    <button 
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setPaymentMethod(opt.id as 'CARD' | 'PIX' | 'BOLETO')}
                                        className={`flex-1 p-4 border-2 rounded-lg font-bold transition-colors ${paymentMethod === opt.id ? 'border-brand-secondary bg-blue-50 text-brand-primary' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 p-6 bg-slate-100 rounded-lg min-h-[160px] flex items-center justify-center text-center">
                            {paymentMethod === 'CARD' && <p className="text-slate-600">Ao finalizar, você será redirecionado para um ambiente seguro para inserir os dados do seu cartão.</p>}
                            {paymentMethod === 'PIX' && (
                                <div>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=paypix${total}`} alt="QR Code PIX" className="mx-auto mb-3 border-4 border-white shadow-md" />
                                    <p className="text-sm text-slate-600">Use o app do seu banco para ler o QR Code e pagar.</p>
                                </div>
                            )}
                            {paymentMethod === 'BOLETO' && (
                                <div>
                                     <p className="text-slate-600">O boleto com vencimento em 3 dias úteis será gerado e enviado para o seu email após a finalização do pedido.</p>
                                </div>
                            )}
                        </div>
                         <div className="mt-8 flex justify-between">
                            <button type="button" onClick={prevStep} className="bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg">Voltar</button>
                            <button type="button" onClick={handleSubmitOrder} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700">Finalizar Pedido</button>
                        </div>
                    </div>
                );
             case 5: // Confirmação
                return (
                    <div className="text-center">
                        <CheckCircleIcon className="mx-auto h-24 w-24 text-green-500" />
                        <h2 className="text-3xl font-bold mt-4">Pedido Realizado com Sucesso!</h2>
                        <p className="text-slate-600 mt-2">Você receberá um email com os detalhes. Acompanhe o status no seu painel.</p>
                        <button onClick={() => setPage(Page.Login)} className="mt-8 bg-brand-accent text-white font-bold py-3 px-6 rounded-lg">Acessar meu Painel</button>
                    </div>
                );
        }
    };

    return (
        <div className="py-12 sm:py-16 bg-brand-light">
            <div className="container mx-auto px-4">
                <Stepper />
                <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                    {renderStep()}
                </div>
            </div>
        </div>
    );
};

export default OrderFlow;