import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const sendEmail = async (to: string, subject: string, htmlBody: string) => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.log(`[Email Simulado] Para: ${to} | Assunto: ${subject}`);
      return;
  }

  const command = new SendEmailCommand({
    Source: "Edari <edari.docs@gmail.com>",
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: htmlBody } },
    },
  });

  try {
    await sesClient.send(command);
    console.log(`[SES Success] Email enviado para ${to}`);
  } catch (error: any) {
    console.error(`[SES Error] Falha ao enviar email para ${to}:`, error.message);
  }
};
