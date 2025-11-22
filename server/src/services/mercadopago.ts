import { MercadoPagoConfig, Payment } from 'mercadopago';

let client: any = null;

if (process.env.MP_ACCESS_TOKEN) {
    client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
}

export const createPixPayment = async (orderId: string, amount: number, email: string, firstName: string) => {
    // Fallback para URL se a variável não estiver definida (evita erro em dev)
    const apiUrl = process.env.API_PUBLIC_URL || 'https://edari-api.onrender.com';

    if (!client) {
        console.warn("[MP Warning] Token ausente. Gerando PIX simulado.");
        return {
            id: `sim_${Date.now()}`,
            qr_code: "00020126580014br.gov.bcb.pix0136fake-pix-key-for-testing-purposes",
            qr_code_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        };
    }

    try {
        const payment = new Payment(client);

        const body = {
            transaction_amount: Number(amount),
            description: `Pedido #${orderId} - Edari`,
            payment_method_id: 'pix',
            payer: { email: email, first_name: firstName },
            external_reference: orderId,
            notification_url: `${apiUrl}/api/webhooks/mp` 
        };

        const response = await payment.create({ body });
        
        return {
            id: response.id,
            qr_code: response.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64
        };
    } catch (error: any) {
        console.error("[Mercado Pago Error]", error);
        throw new Error("Não foi possível gerar o QR Code.");
    }
}