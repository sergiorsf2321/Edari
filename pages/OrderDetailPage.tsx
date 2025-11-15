import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../App';
import { Page, Role, OrderStatus, User, Message, UploadedFile } from '../types';
import { MOCK_USERS } from '../constants';
import { DownloadIcon, FileIcon, PaperclipIcon, SendIcon } from '../components/icons/Icons';
import StatusBadge from '../components/StatusBadge';
import Payment from '../components/Payment';

const OrderDetailPage: React.FC = () => {
    const { user, selectedOrder, updateOrder, setPage, setSelectedOrder } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [quoteValue, setQuoteValue] = useState<number | string>('');
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedOrder?.messages]);

    if (!user || !selectedOrder) {
        return (
            <div className="text-center py-20">
                <p>Pedido não encontrado ou acesso negado.</p>
                <button onClick={() => setPage(Page.Dashboard)} className="mt-4 text-brand-secondary">Voltar ao Painel</button>
            </div>
        );
    }
    
    const analysts = MOCK_USERS.filter(u => u.role === Role.Analyst);

    const handleSendMessage = () => {
        if (newMessage.trim() === '') return;
        const message: Message = { id: `msg-${Date.now()}`, sender: user, content: newMessage, createdAt: new Date() };
        updateOrder({ ...selectedOrder, messages: [...selectedOrder.messages, message], updatedAt: new Date() });
        setNewMessage('');
    };

    const handleAssignAnalyst = (analystId: string) => {
        const analyst = analysts.find(a => a.id === analystId);
        if (!analyst) return;
        updateOrder({ ...selectedOrder, analyst, status: OrderStatus.InProgress, updatedAt: new Date() });
    };
    
    const handleUploadReport = () => {
        const reportFile: UploadedFile = { name: 'relatorio_final.pdf', size: 1024 * 350, type: 'application/pdf' };
        const message: Message = { id: `msg-${Date.now()}`, sender: user, content: 'O relatório final está pronto para download.', createdAt: new Date(), attachment: reportFile };
        updateOrder({ ...selectedOrder, messages: [...selectedOrder.messages, message], report: reportFile, status: OrderStatus.Completed, updatedAt: new Date() });
    };

    const handleSendQuote = () => {
        const value = parseFloat(String(quoteValue));
        if (isNaN(value) || value <= 0) {
            alert("Por favor, insira um valor de orçamento válido.");
            return;
        }
        const message: Message = { 
            id: `msg-${Date.now()}`, 
            sender: user, 
            content: `Olá! Seu orçamento está pronto. O valor para o serviço "${selectedOrder.service.name}" é de R$ ${value.toFixed(2).replace('.', ',')}. Você já pode realizar o pagamento nesta página.`, 
            createdAt: new Date() 
        };
        updateOrder({ 
            ...selectedOrder, 
            total: value, 
            status: OrderStatus.Pending, 
            messages: [...selectedOrder.messages, message],
            updatedAt: new Date() 
        });
        setQuoteValue('');
    };

    const handlePaymentSuccess = () => {
        const nextStatus = OrderStatus.InProgress;
        const systemUser = MOCK_USERS.find(u => u.role === Role.Admin)!;
        const messageContent = selectedOrder.analyst 
            ? `Pagamento confirmado! ${selectedOrder.analyst.name.split(' ')[0]} já foi notificado(a) e iniciará sua análise em breve.`
            : 'Pagamento confirmado! Em breve um de nossos analistas será atribuído ao seu pedido.';

        const message: Message = { id: `msg-${Date.now()}`, sender: systemUser, content: messageContent, createdAt: new Date() };

        updateOrder({ 
            ...selectedOrder, 
            status: nextStatus, 
            messages: [...selectedOrder.messages, message],
            updatedAt: new Date() 
        });
    };

    const handleCancelOrder = () => {
        if (window.confirm("Você tem certeza que deseja desistir desta solicitação? Esta ação não pode ser desfeita.")) {
            updateOrder({ ...selectedOrder, status: OrderStatus.Canceled, updatedAt: new Date() });
            setPage(Page.Dashboard);
        }
    };


    return (
        <div className="bg-slate-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <button onClick={() => { setSelectedOrder(null); setPage(Page.Dashboard); }} className="mb-6 inline-flex items-center gap-2 text-brand-secondary font-semibold hover:underline">
                    &larr; Voltar para o Painel
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                             <h2 className="text-xl font-bold text-brand-primary mb-4">Detalhes do Pedido #{selectedOrder.id}</h2>
                             <div className="space-y-3 text-sm">
                                 <div className="flex justify-between">
                                     <span className="text-slate-500">Status:</span>
                                     <StatusBadge status={selectedOrder.status} />
                                 </div>
                                 <div className="flex justify-between"><span className="text-slate-500">Cliente:</span><span className="font-medium text-slate-800">{selectedOrder.client.name}</span></div>
                                 <div className="flex justify-between"><span className="text-slate-500">Serviço:</span><span className="font-medium text-slate-800">{selectedOrder.service.name}</span></div>
                                 <div className="flex justify-between"><span className="text-slate-500">Data do Pedido:</span><span className="font-medium text-slate-800">{selectedOrder.createdAt.toLocaleDateString('pt-BR')}</span></div>
                                 <div className="flex justify-between items-center">
                                     <span className="text-slate-500">Analista:</span>
                                     {user.role === Role.Admin && !selectedOrder.analyst ? (
                                         <select onChange={(e) => handleAssignAnalyst(e.target.value)} className="text-xs p-1 border rounded bg-white text-slate-900" defaultValue="">
                                             <option value="" disabled>Atribuir...</option>
                                             {analysts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                         </select>
                                     ) : (
                                        <span className="font-medium text-slate-800">{selectedOrder.analyst?.name ?? 'Não atribuído'}</span>
                                     )}
                                 </div>
                                 {selectedOrder.total > 0 && (
                                    <div className="flex justify-between border-t pt-2 font-bold"><span className="text-slate-500">Total:</span><span className="text-slate-800">R$ {selectedOrder.total.toFixed(2).replace('.',',')}</span></div>
                                 )}
                             </div>
                        </div>

                        {(user.role === Role.Admin || user.role === Role.Analyst) && selectedOrder.status === OrderStatus.AwaitingQuote && (
                            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-3">Definir Orçamento</h3>
                                <p className="text-sm text-slate-500 mb-4 text-justify">Insira o valor para este serviço. O cliente será notificado e poderá prosseguir com o pagamento.</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-600">R$</span>
                                    <input 
                                        type="number" 
                                        value={quoteValue}
                                        onChange={(e) => setQuoteValue(e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-white text-slate-900" 
                                        placeholder="Ex: 250.00"
                                    />
                                </div>
                                <button onClick={handleSendQuote} className="w-full mt-4 bg-brand-accent text-white font-bold py-2 rounded-lg">
                                    Enviar Orçamento ao Cliente
                                </button>
                            </div>
                        )}

                        {user.role === Role.Client && selectedOrder.status === OrderStatus.Pending && selectedOrder.total > 0 && (
                            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                                {showPaymentForm ? (
                                    <>
                                        <h2 className="text-xl font-bold text-brand-primary mb-2">Realizar Pagamento</h2>
                                        <p className="text-slate-600 mb-4 text-justify">Complete o pagamento para o orçamento de <span className="font-bold">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</span>.</p>
                                        <Payment order={selectedOrder} onPaymentSuccess={handlePaymentSuccess} />
                                        <button onClick={() => setShowPaymentForm(false)} className="mt-4 w-full text-center text-sm text-slate-600 hover:underline">
                                            Voltar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-xl font-bold text-brand-primary mb-2">Orçamento Pronto</h2>
                                        <p className="text-slate-600 mb-6 text-justify">
                                            Seu orçamento para o serviço "{selectedOrder.service.name}" está pronto. O valor total é de 
                                            <span className="font-bold"> R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</span>. 
                                            Você pode prosseguir para o pagamento ou, se preferir, cancelar a solicitação.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button onClick={() => setShowPaymentForm(true)} className="flex-1 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
                                                Prosseguir para Pagamento
                                            </button>
                                            <button onClick={handleCancelOrder} className="flex-1 bg-red-100 text-red-700 font-bold py-3 px-6 rounded-lg hover:bg-red-200 transition-colors">
                                                Desistir da Solicitação
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        
                        {user.role === Role.Client && selectedOrder.status === OrderStatus.AwaitingQuote && (
                            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                                <h2 className="text-xl font-bold text-brand-primary mb-2">Aguardando Orçamento</h2>
                                <p className="text-slate-600 text-justify">Nossa equipe está analisando sua solicitação. Você será notificado por aqui e por e-mail assim que o orçamento estiver disponível.</p>
                                <div className="mt-6 border-t pt-4">
                                    <h3 className="font-bold text-slate-800 mb-3">Não deseja mais aguardar?</h3>
                                    <button onClick={handleCancelOrder} className="w-full bg-red-100 text-red-700 font-bold py-2 rounded-lg hover:bg-red-200 transition-colors">
                                        Desistir da Solicitação
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                             <h3 className="font-bold text-slate-800 mb-3">Descrição Inicial do Cliente</h3>
                             <p className="text-slate-600 whitespace-pre-wrap text-sm text-justify">{selectedOrder.description}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4">Documentos Enviados</h3>
                            <div className="space-y-3">
                                {selectedOrder.documents.map(doc => (
                                    <div key={doc.name} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FileIcon className="h-6 w-6 text-brand-primary flex-shrink-0" />
                                            <p className="font-medium text-sm truncate" title={doc.name}>{doc.name}</p>
                                        </div>
                                        <button className="text-brand-secondary hover:text-brand-primary"><DownloadIcon className="h-5 w-5"/></button>
                                    </div>
                                ))}
                                {selectedOrder.documents.length === 0 && <p className="text-sm text-slate-500">Nenhum documento enviado.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col h-[80vh] border border-slate-200">
                        <h2 className="text-xl font-bold text-brand-primary mb-4 px-6 pt-6">Comunicação</h2>
                        <div className="flex-grow overflow-y-auto bg-slate-50 p-4 space-y-4 mx-6">
                            {selectedOrder.messages.map(msg => (
                                <div key={msg.id} className={`flex gap-3 ${msg.sender.id === user.id ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-white text-sm shrink-0`}>{msg.sender.name.charAt(0)}</div>
                                    <div className={`p-3 rounded-lg max-w-lg ${msg.sender.id === user.id ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                        <p className="font-bold text-sm mb-1">{msg.sender.name.split(' ')[0]}</p>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        {msg.attachment && (
                                            <button className={`mt-2 flex items-center gap-2 p-2 rounded-lg text-sm ${msg.sender.id === user.id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 hover:bg-slate-400'}`}>
                                                <DownloadIcon className="h-4 w-4"/>
                                                <span>{msg.attachment.name}</span>
                                            </button>
                                        )}
                                        <p className="text-xs opacity-70 mt-2 text-right">{msg.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                            {selectedOrder.messages.length === 0 && <p className="text-sm text-slate-500 text-center py-8">Inicie a conversa com o seu cliente ou analista.</p>}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="mt-auto p-6 border-t">
                            {selectedOrder.status !== OrderStatus.Completed && selectedOrder.status !== OrderStatus.Canceled && (
                                <div className="flex items-center gap-3">
                                    <textarea
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                        placeholder="Digite sua mensagem..."
                                        className="w-full p-2 border rounded-lg bg-white text-slate-900 resize-none"
                                        rows={1}
                                    />
                                    {user.role === Role.Analyst && (
                                        <button onClick={handleUploadReport} className="p-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300" title="Anexar Relatório Final (.pdf)">
                                            <PaperclipIcon className="h-6 w-6"/>
                                        </button>
                                    )}
                                    <button onClick={handleSendMessage} className="p-3 bg-brand-accent text-white rounded-lg hover:opacity-90">
                                        <SendIcon className="h-6 w-6"/>
                                    </button>
                                </div>
                            )}
                            {selectedOrder.status === OrderStatus.Completed && (
                                <p className="text-center text-sm text-slate-500 font-medium">Este pedido foi concluído. A comunicação está encerrada.</p>
                            )}
                            {selectedOrder.status === OrderStatus.Canceled && (
                                <p className="text-center text-sm text-red-500 font-medium">Este pedido foi cancelado. A comunicação está encerrada.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;