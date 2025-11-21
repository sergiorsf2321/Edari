
import { Order, User } from "../types";

/**
 * Este serviço simula o envio de notificações transacionais.
 * No Backend Real, isso seria substituído por integrações com:
 * - E-mail: SendGrid, AWS SES, Resend, etc.
 * - WhatsApp: Twilio, Z-API, WPPConnect, etc.
 */

export const NotificationService = {
    sendWelcomeEmail: async (user: User) => {
        console.log(`%c[EMAIL SIMULATION]`, 'color: blue; font-weight: bold');
        console.log(`To: ${user.email}`);
        console.log(`Subject: Bem-vindo à EDARI!`);
        console.log(`Body: Olá ${user.name}, sua conta foi criada com sucesso. Clique no link para confirmar seu e-mail.`);
        // Aqui entraria a chamada real para a API de e-mail
    },

    sendOrderStatusUpdate: async (order: Order, oldStatus: string) => {
        const client = order.client;
        
        // Mensagem baseada no novo status
        let subject = '';
        let messageBody = '';
        let whatsAppMessage = '';

        switch (order.status) {
            case 'PENDING':
                subject = `Orçamento Disponível - Pedido #${order.id}`;
                messageBody = `Olá ${client.name}, o orçamento para o serviço "${order.service.name}" já está disponível em seu painel. Valor: R$ ${order.total}.`;
                whatsAppMessage = `Olá ${client.name}! O orçamento do seu pedido EDARI #${order.id} está pronto. Acesse o painel para conferir: https://edari.com.br`;
                break;
            case 'IN_PROGRESS':
                subject = `Pagamento Confirmado - Pedido #${order.id}`;
                messageBody = `Recebemos seu pagamento! Um analista já está cuidando do seu caso.`;
                whatsAppMessage = `Edari Informa: Pagamento do pedido #${order.id} confirmado! Já iniciamos os trabalhos.`;
                break;
            case 'COMPLETED':
                subject = `Pedido Concluído - Pedido #${order.id}`;
                messageBody = `Boas notícias! Seu pedido foi concluído. Acesse a plataforma para baixar seus documentos.`;
                whatsAppMessage = `Olá ${client.name}! Seu processo na Edari (Pedido #${order.id}) foi concluído com sucesso! Acesse seu painel para ver os detalhes.`;
                break;
            default:
                return; // Não notificar outros status por enquanto
        }

        // Simula envio de E-mail
        console.log(`%c[EMAIL UPDATE]`, 'color: blue; font-weight: bold');
        console.log(`To: ${client.email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${messageBody}`);

        // Simula envio de WhatsApp (se tiver telefone)
        if (client.phone) {
            console.log(`%c[WHATSAPP UPDATE]`, 'color: green; font-weight: bold');
            console.log(`To: ${client.phone}`);
            console.log(`Message: ${whatsAppMessage}`);
        } else {
            console.warn(`[WHATSAPP FAILED] Usuário ${client.name} não possui telefone cadastrado.`);
        }
    }
};
