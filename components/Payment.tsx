import React, { useState } from 'react';
import { CardDetails, Order } from '../types';
import { generatePixPayment, processCreditCardPayment } from '../services/payment';
import { useAuth } from '../App';

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
    const { user } = useAuth();
    
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
            alert('Falha ao gerar o PIX. Tente novamente.');
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
            alert('Pagamento com cartão falhou. Verifique os dados e tente novamente.');
        } finally {
            setIsLoading(false);
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
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            <div className="mt-6 p-6 bg-slate-100 rounded-lg min-h-[250px]">
                {paymentMethod === 'CARD' && (
                    <form id="creditCardForm" onSubmit={handleCreditCardSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Nome no Cartão</label>
                                <input type="text" value={cardDetails.name} onChange={e => setCardDetails(prev => ({ ...prev, name: e.target.value }))} className="w-full p-2 border rounded-lg mt-1" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Número do Cartão</label>
                                <input type="text" placeholder="0000 0000 0000 0000" value={cardDetails.number} onChange={e => setCardDetails(prev => ({ ...prev, number: e.target.value }))} className="w-full p-2 border rounded-lg mt-1" required />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-slate-700">Validade</label>
                                    <input type="text" placeholder="MM/AA" value={cardDetails.expiry} onChange={e => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))} className="w-full p-2 border rounded-lg mt-1" required />
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-slate-700">CVC</label>
                                    <input type="text" placeholder="123" value={cardDetails.cvc} onChange={e => setCardDetails(prev => ({ ...prev, cvc: e.target.value }))} className="w-full p-2 border rounded-lg mt-1" required />
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
                        </div>
                    </form>
                )}
                 {paymentMethod === 'PIX' && (
                    <div className="text-center">
                        {isLoading && <p>Gerando código PIX...</p>}
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
                                <button onClick={() => navigator.clipboard.writeText(pixCopyPasteCode)} className="mt-3 bg-slate-200 text-slate-800 text-sm font-bold py-2 px-4 rounded-lg">
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
                    <button type="submit" form="creditCardForm" disabled={isLoading} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-slate-400">
                        {isLoading ? 'Processando...' : `Confirmar Pagamento de R$ ${total.toFixed(2).replace('.', ',')}`}
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