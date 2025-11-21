
import React, { useState, useEffect } from 'react';
import { XIcon, ShieldCheckIcon, FileTextIcon } from './icons/Icons';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'privacy' | 'lgpd';
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose, initialTab = 'privacy' }) => {
    const [activeTab, setActiveTab] = useState<'privacy' | 'lgpd'>(initialTab);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-brand-primary">Central de Privacidade</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-gray-50">
                    <button 
                        className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'privacy' ? 'bg-white text-brand-primary border-t-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('privacy')}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <FileTextIcon className="h-4 w-4" />
                            Política de Privacidade
                        </div>
                    </button>
                    <button 
                        className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'lgpd' ? 'bg-white text-green-600 border-t-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('lgpd')}
                    >
                         <div className="flex items-center justify-center gap-2">
                            <ShieldCheckIcon className="h-4 w-4" />
                            Conformidade LGPD
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto text-sm text-slate-700 space-y-4 text-justify flex-grow">
                    <p className="text-xs text-gray-400 text-right">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                    {activeTab === 'privacy' ? (
                        <>
                            <h3 className="text-lg font-bold text-brand-primary mb-2">Política de Privacidade</h3>
                            <p>A sua privacidade é de extrema importância para a <strong>EDARI - Soluções em Documentação</strong>. Esta Política descreve como coletamos e utilizamos suas informações pessoais.</p>
                            
                            <h4 className="font-bold text-slate-800 mt-4">1. Informações que Coletamos</h4>
                            <p>Coletamos as seguintes informações pessoais estritamente para a prestação de serviços:</p>
                            <ul className="list-disc list-inside space-y-1 pl-4">
                                <li><strong>Identificação:</strong> Nome Completo, CPF, Data de Nascimento.</li>
                                <li><strong>Contato:</strong> E-mail, Telefone/WhatsApp, Endereço Completo.</li>
                                <li><strong>Dados do Pedido:</strong> Informações sobre imóveis (matrícula, endereço) e documentos anexados (contratos, certidões).</li>
                            </ul>

                            <h4 className="font-bold text-slate-800 mt-4">2. Finalidade do Uso</h4>
                            <p>Seus dados são utilizados exclusivamente para:</p>
                             <ul className="list-disc list-inside space-y-1 pl-4">
                                <li>Executar os serviços contratados (buscas em cartórios, emissão de certidões, análises).</li>
                                <li>Processar pagamentos e emitir notas fiscais.</li>
                                <li>Enviar notificações sobre o status do seu pedido.</li>
                            </ul>

                            <h4 className="font-bold text-slate-800 mt-4">3. Compartilhamento de Dados</h4>
                            <p>Não vendemos seus dados. O compartilhamento ocorre apenas quando necessário para a execução do serviço com:</p>
                             <ul className="list-disc list-inside space-y-1 pl-4">
                                <li><strong>Cartórios de Registro:</strong> Para solicitação de atos registrais.</li>
                                <li><strong>Plataformas Governamentais (ONR, etc):</strong> Para protocolo digital.</li>
                                <li><strong>Processadores de Pagamento:</strong> Para transações financeiras seguras.</li>
                            </ul>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-green-600 mb-2">Conformidade com a LGPD</h3>
                            <p>A EDARI atua em total conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018). Garantimos transparência e controle sobre seus dados.</p>

                            <h4 className="font-bold text-slate-800 mt-4">1. Base Legal para Tratamento</h4>
                            <p>O tratamento dos seus dados pessoais é realizado principalmente sob a base legal de <strong>Execução de Contrato</strong> (Art. 7º, V da LGPD), sendo indispensável para a entrega das certidões e serviços de documentação solicitados.</p>

                            <h4 className="font-bold text-slate-800 mt-4">2. Seus Direitos como Titular</h4>
                            <p>Você possui os seguintes direitos garantidos por lei:</p>
                             <ul className="list-disc list-inside space-y-1 pl-4">
                                <li><strong>Confirmação e Acesso:</strong> Saber se tratamos seus dados e solicitar uma cópia.</li>
                                <li><strong>Correção:</strong> Solicitar a alteração de dados incompletos, inexatos ou desatualizados.</li>
                                <li><strong>Eliminação:</strong> Solicitar a exclusão de dados pessoais (exceto quando a manutenção for necessária para cumprimento de obrigação legal).</li>
                                <li><strong>Portabilidade:</strong> Solicitar a transferência dos dados a outro fornecedor.</li>
                            </ul>

                            <h4 className="font-bold text-slate-800 mt-4">3. Segurança da Informação</h4>
                            <p>Adotamos medidas técnicas e administrativas robustas para proteger seus dados contra acessos não autorizados e situações acidentais ou ilícitas de destruição, perda ou alteração.</p>

                            <h4 className="font-bold text-slate-800 mt-4">4. Encarregado de Dados (DPO)</h4>
                            <p>Para exercer seus direitos ou tirar dúvidas sobre o tratamento de seus dados, entre em contato diretamente com nosso canal de privacidade:</p>
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                                <p className="font-bold text-green-800">Canal de Atendimento LGPD</p>
                                <p className="text-green-700">E-mail: <a href="mailto:edari.docs@gmail.com" className="underline">edari.docs@gmail.com</a></p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t text-right">
                    <button 
                        onClick={onClose} 
                        className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-primary transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyModal;
