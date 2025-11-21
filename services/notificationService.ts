import { Order, User } from "../types";

/**
 * Este serviço simula o envio de notificações transacionais.
 * 
 * IMPORTANTE PARA O BACKEND (Opus 4):
 * Os logs abaixo exibem a estrutura JSON EXATA que deve ser enviada
 * para as APIs da AWS SES (E-mail) e WhatsApp Cloud API (Meta).
 * Basta copiar a estrutura do payload e implementar a chamada HTTP/SDK.
 */

export const NotificationService = {
    sendWelcomeEmail: async (user: User) => {
        console.group('%c[AWS SES PAYLOAD - Welcome Email]', 'color: #ff9900; font-weight: bold');
        console.log('Simulando envio para AWS SES SDK (ses.sendEmail):');
        console.log({
            Source: "Edari <nao-responda@edari.com.br>",
            Destination: { 
                ToAddresses: [user.email] 
            },
            Message: {
                Subject: { 
                    Data: "Bem-vindo à EDARI! Confirme sua conta." 
                },
                Body: {
                    Html: { 
                        Data: `<html><body><h1>Olá ${user.name}</h1><p>Sua conta foi criada. <a href="https://edari.com.br/confirm?token=xyz">Clique aqui</a>.</p></body></html>` 
                    }
                }
            }
        });
        console.groupEnd();
    },

    sendOrderStatusUpdate: async (order: Order, oldStatus: string) => {
        const client = order.client;
        
        // Definição dos templates de mensagem
        let emailSubject = '';
        let emailBody = '';
        let whatsappTemplateName = '';
        let whatsappParams: string[] = [];

        switch (order.status) {
            case 'PENDING':
                // Orçamento Disponível
                emailSubject = `Orçamento Disponível - Pedido #${order.id}`;
                emailBody = `Olá ${client.name}, o orçamento para o serviço <strong>${order.service.name}</strong> já está disponível. Valor: R$ ${order.total}.`;
                
                whatsappTemplateName = 'orcamento_disponivel';
                whatsappParams = [client.name.split(' ')[0], order.id, `R$ ${order.total}`];
                break;

            case 'IN_PROGRESS':
                // Pagamento Confirmado
                emailSubject = `Pagamento Confirmado - Pedido #${order.id}`;
                emailBody = `Recebemos seu pagamento! Um analista já está cuidando do seu caso.`;
                
                whatsappTemplateName = 'pagamento_confirmado';
                whatsappParams = [client.name.split(' ')[0], order.id];
                break;

            case 'COMPLETED':
                // Concluído
                emailSubject = `Pedido Concluído - Pedido #${order.id}`;
                emailBody = `Boas notícias! Seu pedido foi concluído. Acesse a plataforma para baixar seus documentos.`;
                
                whatsappTemplateName = 'pedido_concluido';
                whatsappParams = [client.name.split(' ')[0], order.id];
                break;

            default:
                return;
        }

        // 1. Simulação AWS SES
        console.group('%c[AWS SES PAYLOAD - Status Update]', 'color: #ff9900; font-weight: bold');
        console.log({
            Source: "Edari <notificacoes@edari.com.br>",
            Destination: { ToAddresses: [client.email] },
            Message: {
                Subject: { Data: emailSubject },
                Body: { Html: { Data: `<html><body><p>${emailBody}</p></body></html>` } }
            }
        });
        console.groupEnd();

        // 2. Simulação WhatsApp Cloud API (Meta)
        if (client.phone) {
            // Formatar telefone (remover caracteres e adicionar DDI 55 se necessário)
            const cleanPhone = client.phone.replace(/\D/g, '');
            const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

            console.group('%c[WHATSAPP CLOUD API PAYLOAD]', 'color: #25D366; font-weight: bold');
            console.log('POST https://graph.facebook.com/v17.0/YOUR_PHONE_ID/messages');
            console.log({
                messaging_product: "whatsapp",
                to: formattedPhone,
                type: "template",
                template: {
                    name: whatsappTemplateName,
                    language: { code: "pt_BR" },
                    components: [
                        {
                            type: "body",
                            parameters: whatsappParams.map(text => ({ type: "text", text }))
                        }
                    ]
                }
            });
            console.groupEnd();
        } else {
            console.warn(`[WHATSAPP SKIPPED] Usuário ${client.name} sem telefone.`);
        }
    }
};