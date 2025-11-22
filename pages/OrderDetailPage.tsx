import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../App';
import { Page, Role, OrderStatus, User, Message, UploadedFile } from '../types';
import { MOCK_USERS } from '../data/mocks';
import { DownloadIcon, FileIcon, PaperclipIcon, SendIcon, TrashIcon } from '../components/icons/Icons';
import StatusBadge from '../components/StatusBadge';
import Payment from '../components/Payment';
import LoadingSpinner from '../components/LoadingSpinner';

// 🔥 MEMOIZED COMPONENT PARA MENSAGENS
const MessageItem = React.memo(({ 
  msg, 
  currentUserId 
}: { 
  msg: Message; 
  currentUserId: string 
}) => {
  const isOwnMessage = msg.sender.id === currentUserId;
  
  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${
        isOwnMessage ? 'bg-blue-500' : 'bg-slate-300'
      }`}>
        {msg.sender.name.charAt(0)}
      </div>
      <div className={`p-3 rounded-lg max-w-lg ${
        isOwnMessage ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-800'
      }`}>
        <p className="font-bold text-sm mb-1">{msg.sender.name.split(' ')[0]}</p>
        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        {msg.attachment && (
          <button className={`mt-2 flex items-center gap-2 p-2 rounded-lg text-sm ${
            isOwnMessage ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 hover:bg-slate-400'
          }`}>
            <DownloadIcon className="h-4 w-4"/>
            <span>{msg.attachment.name}</span>
          </button>
        )}
        <p className="text-xs opacity-70 mt-2 text-right">
          {msg.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

// 🔥 MEMOIZED COMPONENT PARA DOCUMENTOS
const DocumentItem = React.memo(({ 
  doc, 
  onDownload 
}: { 
  doc: UploadedFile; 
  onDownload: (doc: UploadedFile) => void 
}) => {
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FileIcon className="h-6 w-6 text-brand-primary flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate" title={doc.name}>
            {doc.name}
          </p>
          <p className="text-xs text-slate-500">
            {formatFileSize(doc.size)} • {doc.type.split('/')[1]?.toUpperCase() || 'FILE'}
          </p>
        </div>
      </div>
      <button 
        onClick={() => onDownload(doc)}
        className="text-brand-secondary hover:text-brand-primary ml-2 flex-shrink-0"
      >
        <DownloadIcon className="h-5 w-5"/>
      </button>
    </div>
  );
});

DocumentItem.displayName = 'DocumentItem';

const calculateCompletionDate = (startDate: Date, durationString: string): string => {
    if (durationString.toLowerCase().includes('personalizado')) {
        return 'A definir';
    }
    
    const matches = durationString.match(/\d+/g);
    if (!matches) {
        return 'A definir';
    }

    const days = parseInt(matches[matches.length - 1], 10);
    
    let date = new Date(startDate);
    let added = 0;
    while (added < days) {
        date.setDate(date.getDate() + 1);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            added++;
        }
    }
    return date.toLocaleDateString('pt-BR');
};

const OrderDetailPage: React.FC = () => {
    const { user, selectedOrder, updateOrder, setPage, setSelectedOrder, addNotification } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<UploadedFile | null>(null);
    const [quoteValue, setQuoteValue] = useState<number | string>('');
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isAnalystTyping, setIsAnalystTyping] = useState(false);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🔥 MEMOIZED VALUES
    const estimatedCompletionDate = useMemo(() => {
        if (!selectedOrder?.paymentConfirmedAt) return null;
        return calculateCompletionDate(selectedOrder.paymentConfirmedAt, selectedOrder.service.duration);
    }, [selectedOrder?.paymentConfirmedAt, selectedOrder?.service.duration]);

    const analysts = useMemo(() => 
        MOCK_USERS.filter(u => u.role === Role.Analyst),
        []
    );

    const documentStats = useMemo(() => {
        if (!selectedOrder?.documents) return { totalSize: 0, fileCount: 0 };
        
        return selectedOrder.documents.reduce((acc, doc) => {
            acc.totalSize += doc.size;
            acc.fileCount += 1;
            return acc;
        }, { totalSize: 0, fileCount: 0 });
    }, [selectedOrder?.documents]);

    // 🔥 OPTIMIZED SCROLL EFFECT
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ 
                behavior: selectedOrder?.messages.length === 1 ? 'auto' : 'smooth' 
            });
        }
    }, [selectedOrder?.messages, isAnalystTyping]);

    // Simulate analyst typing and replying
    useEffect(() => {
        if (!user || !selectedOrder || isAnalystTyping) return;

        const lastMessage = selectedOrder.messages[selectedOrder.messages.length - 1];
        const isClientLastSender = lastMessage && lastMessage.sender.id === user.id;

        if (isClientLastSender && selectedOrder.analyst && selectedOrder.status === OrderStatus.InProgress) {
            const typingTimer = setTimeout(() => {
                setIsAnalystTyping(true);
            }, 1000);

            const replyTimer = setTimeout(() => {
                const reply: Message = {
                    id: `msg-${Date.now()}`,
                    sender: selectedOrder.analyst!,
                    content: "Recebido. Estou verificando as informações e retorno em breve.",
                    createdAt: new Date(),
                };
                updateOrder({ ...selectedOrder, messages: [...selectedOrder.messages, reply] });
                setIsAnalystTyping(false);
            }, 3500);

            return () => {
                clearTimeout(typingTimer);
                clearTimeout(replyTimer);
            };
        }
    }, [selectedOrder, user, updateOrder, isAnalystTyping]);

    // 🔥 OPTIMIZED HANDLERS
    const handleSendMessage = useCallback(async () => {
        if ((newMessage.trim() === '' && !attachment) || isSending) return;

        setIsSending(true);
        await new Promise(res => setTimeout(res, 500));

        const message: Message = { 
            id: `msg-${Date.now()}`, 
            sender: user!, 
            content: newMessage, 
            createdAt: new Date(),
            attachment: attachment || undefined,
        };

        const updatedDocuments = attachment 
            ? [...selectedOrder!.documents, attachment] 
            : selectedOrder!.documents;

        updateOrder({ 
            ...selectedOrder!, 
            messages: [...selectedOrder!.messages, message], 
            documents: updatedDocuments,
            updatedAt: new Date() 
        });

        setNewMessage('');
        setAttachment(null);
        setIsSending(false);
    }, [newMessage, attachment, isSending, user, selectedOrder, updateOrder]);

    const handleAssignAnalyst = useCallback((analystId: string) => {
        const analyst = analysts.find(a => a.id === analystId);
        if (!analyst || !selectedOrder) return;
        
        updateOrder({ 
            ...selectedOrder, 
            analyst, 
            status: OrderStatus.InProgress, 
            updatedAt: new Date() 
        });
        addNotification(`Analista ${analyst.name} atribuído com sucesso.`, 'success');
    }, [analysts, selectedOrder, updateOrder, addNotification]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            
            // Validação
            const allowedTypes = [
                'application/pdf',
                'image/jpeg', 'image/png', 'image/jpg',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            
            if (!allowedTypes.includes(file.type)) {
                addNotification('Tipo de arquivo não permitido. Use PDF, Word ou imagens.', 'error');
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) {
                addNotification('Arquivo muito grande. Máximo 10MB.', 'error');
                return;
            }
            
            setAttachment({
                name: file.name,
                size: file.size,
                type: file.type,
            });
        }
    }, [addNotification]);
    
    const handleAttachmentClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleSendQuote = useCallback(() => {
        if (!selectedOrder) return;
        
        const value = parseFloat(String(quoteValue));
        if (isNaN(value) || value <= 0) {
            addNotification("Por favor, insira um valor de orçamento válido.", 'error');
            return;
        }
        
        const message: Message = { 
            id: `msg-${Date.now()}`, 
            sender: user!, 
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
        addNotification("Orçamento enviado ao cliente.", 'success');
    }, [quoteValue, selectedOrder, user, updateOrder, addNotification]);

    const handlePaymentSuccess = useCallback(() => {
        if (!selectedOrder) return;
        
        const nextStatus = OrderStatus.InProgress;
        const systemUser = MOCK_USERS.find(u => u.role === Role.Admin)!;
        const messageContent = selectedOrder.analyst 
            ? `Pagamento confirmado! ${selectedOrder.analyst.name.split(' ')[0]} já foi notificado(a) e iniciará sua análise em breve.`
            : 'Pagamento confirmado! Em breve um de nossos analistas será atribuído ao seu pedido.';

        const message: Message = { 
            id: `msg-${Date.now()}`, 
            sender: systemUser, 
            content: messageContent, 
            createdAt: new Date() 
        };

        updateOrder({ 
            ...selectedOrder, 
            status: nextStatus, 
            messages: [...selectedOrder.messages, message],
            updatedAt: new Date(),
            paymentConfirmedAt: new Date(),
        });
        
        addNotification("Pagamento confirmado com sucesso!", "success");
        setShowPaymentForm(false);
    }, [selectedOrder, updateOrder, addNotification]);

    const handleCancelOrder = useCallback(() => {
        if (!selectedOrder) return;
        
        if (window.confirm("Você tem certeza que deseja desistir desta solicitação? Esta ação não pode ser desfeita.")) {
            updateOrder({ ...selectedOrder, status: OrderStatus.Canceled, updatedAt: new Date() });
            addNotification("Sua solicitação foi cancelada.", "info");
            setPage(Page.Dashboard);
        }
    }, [selectedOrder, updateOrder, addNotification, setPage]);

    const handleDownloadDocument = useCallback((doc: UploadedFile) => {
        // Simular download
        addNotification(`Iniciando download de ${doc.name}`, 'info');
        // Implementar lógica real de download aqui
    }, [addNotification]);

    if (!user || !selectedOrder) {
        return (
            <div className="text-center py-20">
                <p>Pedido não encontrado ou acesso negado.</p>
                <button 
                    onClick={() => setPage(Page.Dashboard)} 
                    className="mt-4 text-brand-secondary hover:underline"
                >
                    Voltar ao Painel
                </button>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <button 
                    onClick={() => { setSelectedOrder(null); setPage(Page.Dashboard); }} 
                    className="mb-6 inline-flex items-center gap-2 text-brand-secondary font-semibold hover:underline"
                >
                    &larr; Voltar para o Painel
                </button>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                            <h2 className="text-xl font-bold text-brand-primary mb-4">
                                Detalhes do Pedido #{selectedOrder.id}
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Status:</span>
                                    <StatusBadge status={selectedOrder.status} />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Cliente:</span>
                                    <span className="font-medium text-slate-800">{selectedOrder.client.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Serviço:</span>
                                    <span className="font-medium text-slate-800">{selectedOrder.service.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Data do Pedido:</span>
                                    <span className="font-medium text-slate-800">
                                        {selectedOrder.createdAt.toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                {estimatedCompletionDate && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Previsão de Conclusão:</span>
                                        <span className="font-medium text-slate-800">{estimatedCompletionDate}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Analista:</span>
                                    {user.role === Role.Admin && (selectedOrder.status === OrderStatus.Pending || selectedOrder.status === OrderStatus.InProgress) ? (
                                        <select 
                                            onChange={(e) => handleAssignAnalyst(e.target.value)} 
                                            className="text-xs p-1 border rounded bg-white text-slate-900" 
                                            value={selectedOrder.analyst?.id || ""}
                                        >
                                            <option value="" disabled>Atribuir...</option>
                                            {analysts.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="font-medium text-slate-800">
                                            {selectedOrder.analyst?.name ?? 'Não atribuído'}
                                        </span>
                                    )}
                                </div>
                                {selectedOrder.total > 0 && (
                                    <div className="flex justify-between border-t pt-2 font-bold">
                                        <span className="text-slate-500">Total:</span>
                                        <span className="text-slate-800">
                                            R$ {selectedOrder.total.toFixed(2).replace('.',',')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Orçamento para Admin/Analyst */}
                        {(user.role === Role.Admin || user.role === Role.Analyst) && selectedOrder.status === OrderStatus.AwaitingQuote && (
                            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-3">Definir Orçamento</h3>
                                <p className="text-sm text-slate-500 mb-4 text-justify">
                                    Insira o valor para este serviço. O cliente será notificado e poderá prosseguir com o pagamento.
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-600">R$</span>
                                    <input 
                                        type="number" 
                                        value={quoteValue}
                                        onChange={(e) => setQuoteValue(e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-white text-slate-900" 
                                        placeholder="Ex: 250.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <button 
                                    onClick={handleSendQuote} 
                                    className="w-full mt-4 bg-brand-accent text-white font-bold py-2 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Enviar Orçamento ao Cliente
                                </button>
                            </div>
                        )}

                        {/* Pagamento para Cliente */}
                        {user.role === Role.Client && selectedOrder.status === OrderStatus.Pending && selectedOrder.total > 0 && (
                            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                                {showPaymentForm ? (
                                    <>
                                        <h2 className="text-xl font-bold text-brand-primary mb-2">Realizar Pagamento</h2>
                                        <p className="text-slate-600 mb-4 text-justify">
                                            Complete o pagamento para o orçamento de{' '}
                                            <span className="font-bold">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</span>.
                                        </p>
                                        <Payment order={selectedOrder} onPaymentSuccess={handlePaymentSuccess} />
                                        <button 
                                            onClick={() => setShowPaymentForm(false)} 
                                            className="mt-4 w-full text-center text-sm text-slate-600 hover:underline"
                                        >
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
                                            <button 
                                                onClick={() => setShowPaymentForm(true)} 
                                                className="flex-1 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                Prosseguir para Pagamento
                                            </button>
                                            <button 
                                                onClick={handleCancelOrder} 
                                                className="flex-1 bg-red-100 text-red-700 font-bold py-3 px-6 rounded-lg hover:bg-red-200 transition-colors"
                                            >
                                                Desistir da Solicitação
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        
                        {/* Aguardando Orçamento */}
                        {user.role === Role.Client && selectedOrder.status === OrderStatus.AwaitingQuote && (
                            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                                <h2 className="text-xl font-bold text-brand-primary mb-2">Aguardando Orçamento</h2>
                                <p className="text-slate-600 text-justify">
                                    Nossa equipe está analisando sua solicitação. Você será notificado por aqui e por e-mail assim que o orçamento estiver disponível.
                                </p>
                                <div className="mt-6 border-t pt-4">
                                    <h3 className="font-bold text-slate-800 mb-3">Não deseja mais aguardar?</h3>
                                    <button 
                                        onClick={handleCancelOrder} 
                                        className="w-full bg-red-100 text-red-700 font-bold py-2 rounded-lg hover:bg-red-200 transition-colors"
                                    >
                                        Desistir da Solicitação
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Descrição */}
                        <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-3">Descrição Inicial do Cliente</h3>
                            <p className="text-slate-600 whitespace-pre-wrap text-sm text-justify">
                                {selectedOrder.description}
                            </p>
                        </div>

                        {/* Documentos */}
                        <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800">Documentos Enviados</h3>
                                {documentStats.fileCount > 0 && (
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                        {documentStats.fileCount} arquivo(s)
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3">
                                {selectedOrder.documents.map(doc => (
                                    <DocumentItem 
                                        key={doc.name} 
                                        doc={doc} 
                                        onDownload={handleDownloadDocument}
                                    />
                                ))}
                                {selectedOrder.documents.length === 0 && (
                                    <p className="text-sm text-slate-500 text-center py-4">
                                        Nenhum documento enviado.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chat */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col h-[80vh] border border-slate-200">
                        <div className="px-6 pt-6 pb-4 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-brand-primary">Comunicação</h2>
                            {selectedOrder.analyst && (
                                <p className="text-sm text-slate-600 mt-1">
                                    Analista: {selectedOrder.analyst.name}
                                </p>
                            )}
                        </div>
                        
                        <div className="flex-grow overflow-y-auto bg-slate-50 p-4 space-y-4">
                            {selectedOrder.messages.map(msg => (
                                <MessageItem 
                                    key={msg.id} 
                                    msg={msg} 
                                    currentUserId={user.id} 
                                />
                            ))}
                            
                            {isAnalystTyping && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-white text-sm shrink-0">
                                        {selectedOrder.analyst?.name.charAt(0)}
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-200 text-slate-800">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {selectedOrder.messages.length === 0 && (
                                <div className="text-center py-12">
                                    <FileIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500">Inicie a conversa com o seu cliente ou analista.</p>
                                </div>
                            )}
                            
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input de Mensagem */}
                        <div className="mt-auto p-6 border-t">
                            {selectedOrder.status !== OrderStatus.Completed && selectedOrder.status !== OrderStatus.Canceled ? (
                                <>
                                    {attachment && (
                                        <div className="mb-3 flex items-center justify-between bg-slate-100 p-3 rounded-lg">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <FileIcon className="h-5 w-5 text-brand-primary flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-sm truncate" title={attachment.name}>
                                                        {attachment.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {(attachment.size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setAttachment(null)} 
                                                className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                                            >
                                                <TrashIcon className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-end gap-3">
                                        <textarea
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder="Digite sua mensagem..."
                                            className="flex-1 p-3 border border-slate-300 rounded-lg bg-white text-slate-900 resize-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                                            rows={1}
                                            disabled={isSending}
                                        />
                                        
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileChange} 
                                            className="hidden" 
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        />
                                        
                                        <button 
                                            onClick={handleAttachmentClick} 
                                            className="p-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Anexar Documento"
                                            disabled={isSending}
                                        >
                                            <PaperclipIcon className="h-5 w-5"/>
                                        </button>
                                        
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={isSending || (newMessage.trim() === '' && !attachment)}
                                            className="p-3 bg-brand-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center w-12 h-12"
                                        >
                                            {isSending ? (
                                                <LoadingSpinner size="sm" />
                                            ) : (
                                                <SendIcon className="h-5 w-5"/>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className={`text-center py-3 rounded-lg ${
                                    selectedOrder.status === OrderStatus.Completed 
                                        ? 'bg-green-50 text-green-700' 
                                        : 'bg-red-50 text-red-700'
                                }`}>
                                    <p className="font-medium">
                                        {selectedOrder.status === OrderStatus.Completed 
                                            ? '✅ Este pedido foi concluído. A comunicação está encerrada.'
                                            : '❌ Este pedido foi cancelado. A comunicação está encerrada.'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;