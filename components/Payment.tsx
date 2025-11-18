import React, { useState } from 'react';
import { CardDetails, Order } from '../types';
import { generatePixPayment, processCreditCardPayment } from '../services/payment';
import { useAuth } from '../App';
import LoadingSpinner from './LoadingSpinner';

interface PaymentProps {
    order: Order;
    onPaymentSuccess: () => void;
}

const Payment: React.FC<PaymentProps> = ({ order, onPaymentSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'PIX'>('CARD');
    const [isLoading, setIsLoading] = useState(false);
    const [pixCopyPasteCode, setPixCopyPasteCode] = useState<string | null>(null);
    const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string | null>(null);
    const [cardDetails, setCardDetails] = useState<CardDetails>({ number: '', name: '', expiry: '', cvc: '' });
    const [installments, setInstallments] = useState(1);
    const { user, addNotification } = useAuth();
    
    const total = order.total;

    const handleGeneratePix = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await generatePixPayment(order.service, user, total);
            setPixCopyPasteCode(response.pixCopyPaste);
            setPixQrCodeUrl(response.qrCodeUrl);
        } catch (error) {
            console.error(error);
            addNotification('Falha ao gerar o PIX. Tente novamente.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCreditCardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);
        try {
            await processCreditCardPayment(cardDetails, order.service, user, total, installments);
            onPaymentSuccess();
        } catch (error) {
            console.error(error);
            addNotification('Pagamento com cartão falhou. Verifique os dados.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        const formattedValue = value.match(/.{1,4}/g)?.join(' ').slice(0, 19) || '';
        setCardDetails(prev => ({ ...prev, number: formattedValue }));
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        let formattedValue = value;
        if (value.length > 2) {
            formattedValue = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
        }
        setCardDetails(prev => ({ ...prev, expiry: formattedValue }));
    };

    const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 4) {
            setCardDetails(prev => ({ ...prev, cvc: value }));
        }
    };

    const handleCopyToClipboard = () => {
        if (pixCopyPasteCode) {
            navigator.clipboard.writeText(pixCopyPasteCode);
            addNotification('Código PIX copiado para a área de transferência!', 'success');
        }
    };
    
    const paymentOptions = [ { id: 'CARD', label: 'Cartão de Crédito' }, { id: 'PIX', label: 'PIX' }];

    return (
        <div>
            <h3 className="font-bold mb-4 text-lg">Forma de Pagamento</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                {paymentOptions.map(opt => (
                    <button 
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id as 'CARD' | 'PIX')}
                        className={`flex-1 p-4 border-2 rounded-lg font-bold transition-colors ${paymentMethod === opt.id ? 'border-brand-secondary bg-blue-50 text-brand-primary' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        disabled={isLoading}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            <div className="mt-6 p-6 bg-slate-100 rounded-lg min-h-[250px]">
                {paymentMethod === 'CARD' && (
                    <form id="creditCardForm" onSubmit={handleCreditCardSubmit}>
                        <fieldset disabled={isLoading} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Nome no Cartão</label>
                                <input type="text" value={cardDetails.name} onChange={e => setCardDetails(prev => ({ ...prev, name: e.target.value }))} className="w-full p-2 border rounded-lg mt-1 bg-white" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Número do Cartão</label>
                                <input 
                                    type="text" 
                                    placeholder="0000 0000 0000 0000" 
                                    value={cardDetails.number} 
                                    onChange={handleCardNumberChange} 
                                    className="w-full p-2 border rounded-lg mt-1 bg-white" 
                                    maxLength={19}
                                    required />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-slate-700">Validade</label>
                                    <input 
                                        type="text" 
                                        placeholder="MM/AA" 
                                        value={cardDetails.expiry} 
                                        onChange={handleExpiryChange} 
                                        className="w-full p-2 border rounded-lg mt-1 bg-white" 
                                        maxLength={5}
                                        required />
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-slate-700">CVC</label>
                                    <input 
                                        type="text" 
                                        placeholder="123" 
                                        value={cardDetails.cvc} 
                                        onChange={handleCvcChange} 
                                        className="w-full p-2 border rounded-lg mt-1 bg-white" 
                                        maxLength={4}
                                        required />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Parcelas</label>
                                <select value={installments} onChange={e => setInstallments(Number(e.target.value))} className="w-full p-2 border rounded-lg mt-1 bg-white">
                                    {[...Array(12)].map((_, i) => {
                                        const installmentNumber = i + 1;
                                        const installmentValue = (total / installmentNumber).toFixed(2).replace('.', ',');
                                        return (
                                            <option key={installmentNumber} value={installmentNumber}>
                                                {installmentNumber}x de R$ {installmentValue}
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                        </fieldset>
                    </form>
                )}
                 {paymentMethod === 'PIX' && (
                    <div className="text-center flex flex-col justify-center items-center h-full">
                        {isLoading && <LoadingSpinner />}
                        {!isLoading && !pixCopyPasteCode && (
                            <button onClick={handleGeneratePix} className="bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg">
                                Gerar PIX
                            </button>
                        )}
                        {pixCopyPasteCode && pixQrCodeUrl && (
                            <div>
                                <img src={pixQrCodeUrl} alt="QR Code PIX" className="mx-auto mb-3 border-4 border-white shadow-md w-40 h-40" />
                                <p className="text-sm font-semibold mb-2">Pague com o QR Code ou copie o código abaixo:</p>
                                <div className="bg-white p-2 border rounded-lg text-sm text-slate-700 break-all">
                                    <code>{pixCopyPasteCode}</code>
                                </div>
                                <button onClick={handleCopyToClipboard} className="mt-3 bg-slate-200 text-slate-800 text-sm font-bold py-2 px-4 rounded-lg">
                                    Copiar Código
                                </button>
                                 <p className="mt-4 text-xs text-slate-500">Após o pagamento, clique em "Finalizar Pedido" para confirmar.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
             <div className="mt-8 flex justify-end">
                 {paymentMethod === 'CARD' ? (
                    <button type="submit" form="creditCardForm" disabled={isLoading} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-slate-400 flex justify-center items-center min-w-[120px] h-[48px]">
                        {isLoading ? <LoadingSpinner /> : `Pagar R$ ${total.toFixed(2).replace('.', ',')}`}
                    </button>
                 ) : (
                     <button type="button" onClick={onPaymentSuccess} disabled={!pixCopyPasteCode} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-slate-400">
                         Finalizar Pedido
                     </button>
                 )}
            </div>
        </div>
    );
};

export default Payment;