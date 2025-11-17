import React from 'react';
import { XIcon } from './icons/Icons';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-brand-primary">Política de Privacidade</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto text-sm text-slate-700 space-y-4 text-justify">
                    <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                    <p>A sua privacidade é de extrema importância para a EDARI - Análise Documental Imobiliária ("EDARI", "nós"). Esta Política de Privacidade descreve como coletamos, usamos, armazenamos, compartilhamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).</p>
                    
                    <h3 className="font-bold text-slate-800">1. Informações que Coletamos</h3>
                    <p>Coletamos as seguintes informações pessoais para criar sua conta e prestar nossos serviços:</p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                        <li><strong>Nome Completo:</strong> Para identificação pessoal.</li>
                        <li><strong>E-mail:</strong> Para comunicação, login e envio de notificações importantes.</li>
                        <li><strong>CPF:</strong> Para verificação de identidade e cumprimento de exigências legais em transações imobiliárias e fiscais.</li>
                        <li><strong>Data de Nascimento:</strong> Para verificação de maioridade legal.</li>
                        <li><strong>Endereço Completo:</strong> Para faturamento e correspondência.</li>
                        <li><strong>Documentos e Informações de Pedidos:</strong> Arquivos e dados que você nos envia para a prestação dos serviços contratados.</li>
                    </ul>

                    <h3 className="font-bold text-slate-800">2. Finalidade da Coleta de Dados</h3>
                    <p>Utilizamos seus dados para:</p>
                     <ul className="list-disc list-inside space-y-1 pl-4">
                        <li><strong>Prestação de Serviços:</strong> Realizar as análises documentais, pesquisas, emissão de certidões e outros serviços contratados.</li>
                        <li><strong>Comunicação:</strong> Enviar atualizações sobre seus pedidos, orçamentos, e responder às suas solicitações.</li>
                        <li><strong>Cumprimento de Obrigações Legais:</strong> Utilizar dados como CPF em processos junto a cartórios, prefeituras e outros órgãos públicos, conforme necessário para a execução dos serviços.</li>
                        <li><strong>Segurança:</strong> Prevenir fraudes e garantir a segurança da sua conta e da nossa plataforma.</li>
                        <li><strong>Faturamento:</strong> Processar pagamentos pelos serviços prestados.</li>
                    </ul>

                    <h3 className="font-bold text-slate-800">3. Compartilhamento de Informações</h3>
                    <p>A EDARI não vende suas informações pessoais. Compartilhamos seus dados apenas quando estritamente necessário para a prestação dos serviços, com:</p>
                     <ul className="list-disc list-inside space-y-1 pl-4">
                        <li><strong>Cartórios e Órgãos Públicos:</strong> Para protocolo e andamento dos processos registrais.</li>
                        <li><strong>Parceiros de Pagamento:</strong> Para processar transações financeiras de forma segura.</li>
                        <li><strong>Autoridades Judiciais ou Administrativas:</strong> Em caso de requisição legal.</li>
                    </ul>

                    <h3 className="font-bold text-slate-800">4. Armazenamento e Segurança dos Dados</h3>
                    <p>Seus dados são armazenados em servidores seguros, e empregamos medidas técnicas e administrativas, como criptografia e controle de acesso, para protegê-los contra acesso não autorizado, alteração, destruição ou perda.</p>

                    <h3 className="font-bold text-slate-800">5. Seus Direitos como Titular dos Dados</h3>
                    <p>De acordo com a LGPD, você tem o direito de:</p>
                     <ul className="list-disc list-inside space-y-1 pl-4">
                        <li><strong>Confirmação e Acesso:</strong> Saber se tratamos seus dados e acessá-los.</li>
                        <li><strong>Correção:</strong> Solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
                        <li><strong>Anonimização, Bloqueio ou Eliminação:</strong> Solicitar a eliminação de dados desnecessários ou tratados em desconformidade com a LGPD.</li>
                        <li><strong>Portabilidade:</strong> Solicitar a portabilidade dos seus dados a outro fornecedor de serviço.</li>
                        <li><strong>Informação sobre Compartilhamento:</strong> Saber com quais entidades públicas e privadas compartilhamos seus dados.</li>
                        <li><strong>Revogação do Consentimento:</strong> Revogar seu consentimento a qualquer momento.</li>
                    </ul>
                    <p>Para exercer seus direitos, entre em contato conosco através do e-mail: <strong>privacidade@edari.com.br</strong>.</p>
                    
                    <h3 className="font-bold text-slate-800">6. Encarregado de Proteção de Dados (DPO)</h3>
                    <p>Para qualquer dúvida sobre esta política ou sobre o tratamento de seus dados, entre em contato com nosso Encarregado de Proteção de Dados (DPO) através do e-mail: <strong>dpo@edari.com.br</strong>.</p>
                    
                    <p className="font-semibold">Ao criar uma conta na EDARI, você declara que leu, compreendeu e concorda com os termos desta Política de Privacidade.</p>
                </div>
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