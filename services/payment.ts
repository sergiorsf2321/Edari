// FIX: Corrected import typo from PIX_QR_CODE_BASE_64 to PIX_QR_CODE_BASE64.
import { PIX_QR_CODE_BASE64 } from "../assets";
import { Service, User, CardDetails, PixResponse } from "../types";

// Simula uma chamada de API para o seu backend, que por sua vez se comunicaria com o Mercado Pago
export const generatePixPayment = (service: Service, user: User, amount: number): Promise<PixResponse> => {
    console.log(`[Mercado Pago Simulation] Requesting PIX for service ${service.name} for user ${user.name}`);
    
    // Em um backend real, você montaria um objeto de pagamento como este:
    const mercadoPagoPayload = {
      transaction_amount: amount,
      description: service.name,
      payment_method_id: 'pix',
      payer: {
        email: user.email,
        first_name: user.name.split(' ')[0],
        last_name: user.name.split(' ').slice(1).join(' '),
      }
    };

    console.log('[Mercado Pago Simulation] Sending payload to backend:', mercadoPagoPayload);
    
    return new Promise((resolve) => {
        setTimeout(() => {
            // A API real do Mercado Pago retornaria uma estrutura similar a esta
            const response: PixResponse = {
                qrCodeUrl: PIX_QR_CODE_BASE64, // Na vida real, seria uma URL da imagem do QR Code
                pixCopyPaste: `00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913${user.name.substring(0,13)}6008BRASILIA62070503***6304E7DF`
            };
            console.log('[Mercado Pago Simulation] PIX generated successfully.');
            resolve(response);
        }, 1500); // Simula 1.5 segundos de delay da rede
    });
};

// Simula uma chamada de API para o seu backend, que por sua vez se comunicaria com o Mercado Pago
export const processCreditCardPayment = (cardDetails: CardDetails, service: Service, user: User, amount: number, installments: number): Promise<{ success: true, orderId: string }> => {
    console.log(`[Mercado Pago Simulation] Processing Credit Card for ${cardDetails.name} and service ${service.name}`);

    // IMPORTANTE: Em um app real, NUNCA envie os dados do cartão para o seu backend.
    // Use o SDK do Mercado Pago no frontend para criar um 'card_token' seguro e envie apenas o token.
    const mercadoPagoPayload = {
        transaction_amount: amount,
        description: service.name,
        installments: installments,
        payment_method_id: 'visa', // O SDK identificaria a bandeira
        payer: {
            email: user.email,
        },
        // Em um app real, você enviaria o 'token' aqui, não os dados brutos.
        // token: "card_token_gerado_no_frontend",
    };
    
    console.log('[Mercado Pago Simulation] Sending payload to backend:', mercadoPagoPayload);

    return new Promise((resolve) => {
        setTimeout(() => {
            // Para fins de simulação, o pagamento com cartão de crédito sempre será bem-sucedido.
            console.log('[Mercado Pago Simulation] Credit Card payment successful.');
            resolve({ success: true, orderId: `mp_${new Date().getTime()}` });
        }, 2000); // Simula 2 segundos de delay da rede
    });
};