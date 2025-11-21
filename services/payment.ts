
import { Service, User, CardDetails, PixResponse } from "../types";
import { PIX_QR_CODE_BASE64 } from "../assets";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generatePixPayment = async (service: Service, user: User, amount: number): Promise<PixResponse> => {
    await delay(1500); // Simula geração do QR Code
    return {
        qrCodeUrl: PIX_QR_CODE_BASE64,
        pixCopyPaste: `00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913${user.name.substring(0,10)}6008BRASILIA62070503***6304E7DF`
    };
};

export const processCreditCardPayment = async (cardDetails: CardDetails, service: Service, user: User, amount: number, installments: number): Promise<{ success: true, orderId: string }> => {
    await delay(2000); // Simula processamento da operadora
    
    // Simulação simples: sempre aprova
    return {
        success: true,
        orderId: `order_${new Date().getTime()}`
    };
};
