import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN!
});

export const createPreference = async (
  orderId: string,
  amount: number,
  description: string,
  payerEmail: string
) => {
  try {
    const preference = await mercadopago.preferences.create({
      items: [
        {
          title: description,
          unit_price: amount,
          quantity: 1
        }
      ],
      external_reference: orderId,
      payer: {
        email: payerEmail
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment/success`,
        failure: `${process.env.FRONTEND_URL}/payment/failure`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`
      },
      auto_return: 'approved' as any,
      notification_url: `${process.env.BACKEND_URL}/api/payment/webhook`
    });

    return preference.body;
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    throw error;
  }
};

export const getPaymentInfo = async (paymentId: string) => {
  try {
    const payment = await mercadopago.payment.findById(Number(paymentId));
    return payment.body;
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    throw error;
  }
};
