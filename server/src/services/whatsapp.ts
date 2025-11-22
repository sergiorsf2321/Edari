import axios from 'axios';

export const sendWhatsAppMessage = async (phone: string, templateName: string, parameters: string[]) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId || !phone) {
      console.log(`[WhatsApp Simulado] Para: ${phone} | Template: ${templateName}`);
      return;
  }

  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length <= 11) cleanPhone = `55${cleanPhone}`;

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "pt_BR" },
      components: [
        {
          type: "body",
          parameters: parameters.map(param => ({ type: "text", text: param }))
        }
      ]
    }
  };

  try {
    await axios.post(url, body, { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
    });
    console.log(`[WhatsApp Success] Mensagem enviada para ${cleanPhone}`);
  } catch (error: any) {
    const apiError = error.response?.data?.error?.message || error.message;
    console.error(`[WhatsApp Error] Falha no envio: ${apiError}`);
  }
};
