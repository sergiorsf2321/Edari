import { Service, User, CardDetails, PixResponse } from "../types";
import { apiRequest } from "./api";

export const generatePixPayment = async (service: Service, user: User, amount: number, orderId?: string): Promise<PixResponse> => {
    if (!orderId) throw new Error("ID do pedido necessário para gerar pagamento");
    
    return await apiRequest<PixResponse>('/payments', {
        method: 'POST',
        body: JSON.stringify({ orderId })
    });
};

export const processCreditCardPayment = async (cardDetails: CardDetails, service: Service, user: User, amount: number, installments: number): Promise<{ success: true, orderId: string }> => {
    throw new Error("Implementação de cartão requer biblioteca frontend do Mercado Pago (Brick).");
};