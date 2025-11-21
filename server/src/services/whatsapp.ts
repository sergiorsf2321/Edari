import axios from 'axios';

export const sendWhatsAppMessage = async (phone: string, templateName: string, parameters: string[]) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId || !phone) {
      console.log(`[SIMULAÇÃO WHATSAPP] Para: ${phone} | Template: ${templateName}`);
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
    await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`[WhatsApp] Mensagem enviada para ${cleanPhone}`);
  } catch (error: any) {
    console.error("[WhatsApp] Erro:", error.response?.data || error.message);
  }
};