import mercadopago from 'mercadopago';

if (process.env.MP_ACCESS_TOKEN) {
    mercadopago.configure({
        access_token: process.env.MP_ACCESS_TOKEN
    });
}

export const createPixPayment = async (orderId: string, amount: number, email: string, firstName: string) => {
    if (!process.env.MP_ACCESS_TOKEN) {
        console.warn("MP_ACCESS_TOKEN ausente. Gerando PIX simulado.");
        return {
            id: `simulated_${Date.now()}`,
            qr_code: "00020126580014br.gov.bcb.pix0136fake-pix-key-for-testing-purposes5204000053039865802BR5913Edari Servicos6009Sao Paulo62070503***6304E2CA",
            qr_code_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        };
    }

    try {
        const payment_data = {
            transaction_amount: Number(amount),
            description: `Pedido #${orderId} - Edari`,
            payment_method_id: 'pix',
            payer: { email: email, first_name: firstName },
            external_reference: orderId,
            notification_url: `https://edari-api.onrender.com/api/webhooks/mp`
        };

        const payment = await mercadopago.payment.create(payment_data);
        
        return {
            id: payment.body.id,
            qr_code: payment.body.point_of_interaction.transaction_data.qr_code,
            qr_code_base64: payment.body.point_of_interaction.transaction_data.qr_code_base64
        };
    } catch (error) {
        console.error("Erro Mercado Pago:", error);
        throw error;
    }
}