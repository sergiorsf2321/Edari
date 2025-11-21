# Manual Técnico de Desenvolvimento Backend - Edari (vFinal)

Este documento serve como a **Verdade Única (Source of Truth)** para o desenvolvimento da API da Edari. A equipe Opus 4 deve seguir estas especificações rigorosamente para garantir integração imediata com o Frontend.

---

## 1. Stack Tecnológica & Infraestrutura

*   **Runtime:** Node.js v18+ (LTS).
*   **Framework:** NestJS (Recomendado p/ Enterprise) ou Express (Clean Arch).
*   **Linguagem:** TypeScript (Strict Mode).
*   **Database:** PostgreSQL 15+.
*   **ORM:** Prisma IO.
*   **Storage:** AWS S3 (Armazenamento de PDFs e Imagens).
*   **Email:** AWS SES (Simple Email Service).
*   **Mensageria:** WhatsApp Cloud API (Meta).
*   **Pagamentos:** Mercado Pago SDK.

### 1.1 Dockerfile Sugerido (Deploy)
Para garantir o "Go Live" sem surpresas, a aplicação deve ser containerizada.

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

---

## 2. Padrão de Resposta da API (Contrato)

Todas as rotas devem seguir este padrão JSON para facilitar o tratamento no Frontend.

### Sucesso (HTTP 200/201)
```json
{
  "data": { ...objeto ou array... },
  "meta": { "page": 1, "total": 100 } // Opcional, para listas
}
```

### Erro (HTTP 4xx/5xx)
```json
{
  "error": true,
  "code": "INVALID_INPUT", // Código legível por máquina
  "message": "O CPF informado é inválido." // Mensagem legível por humano
}
```

---

## 3. Modelagem de Dados (Prisma Schema)

Copie este schema para `prisma/schema.prisma`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  CLIENT
  ANALYST
  ADMIN
}

enum OrderStatus {
  AWAITING_QUOTE // Cliente solicitou, aguarda preço do analista
  PENDING        // Preço definido, aguarda pagamento do cliente
  IN_PROGRESS    // Pago, analista trabalhando
  COMPLETED      // Finalizado
  CANCELED       // Cancelado
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String?   // Null se for login social
  name          String
  role          Role      @default(CLIENT)
  
  cpf           String?   // Validar formato 000.000.000-00
  phone         String?   // Obrigatório para WhatsApp (E.164)
  address       String?
  
  isVerified    Boolean   @default(false)
  googleId      String?   @unique
  appleId       String?   @unique
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  orders        Order[]   @relation("ClientOrders")
  workedOrders  Order[]   @relation("AnalystOrders")
}

model Service {
  id          String  @id
  name        String
  basePrice   Decimal? // Se null, inicia como AWAITING_QUOTE
}

model Order {
  id              String      @id @default(uuid())
  readableId      Int         @default(autoincrement()) // Ex: Pedido #1050
  
  clientId        String
  client          User        @relation("ClientOrders", fields: [clientId], references: [id])
  
  serviceId       String
  service         Service     @relation(fields: [serviceId], references: [id])
  
  analystId       String?
  analyst         User?       @relation("AnalystOrders", fields: [analystId], references: [id])
  
  status          OrderStatus @default(AWAITING_QUOTE)
  totalAmount     Decimal     @default(0.00)
  
  // JSONB contendo os dados dinâmicos (Validar com Zod no Controller)
  details         Json        
  
  description     String?     @db.Text
  
  // Integração Mercado Pago
  paymentId       String?     @unique
  paymentMethod   String?     // 'pix', 'credit_card'
  paymentConfirmedAt DateTime?
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  documents       Document[]
  messages        Message[]
}

model Document {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  
  name      String
  s3Key     String   // Caminho no Bucket S3 (ex: orders/123/doc.pdf)
  mimeType  String
  size      Int
  
  isReport  Boolean  @default(false) // Se true, é o documento final entregue
}

model Message {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  
  senderId  String
  sender    User     @relation(fields: [senderId], references: [id])
  
  content   String   @db.Text
  createdAt DateTime @default(now())
  
  attachmentId String? // Link opcional para um Document
}
```

---

## 4. Mapa de API (Endpoints)

### Autenticação (`/auth`)
| Método | Rota | Payload | Resposta | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/login` | `{email, password}` | `{token, user}` | Login tradicional. |
| POST | `/register` | `{name, email, cpf, phone...}` | `{user}` | Cadastro. **Disparar e-mail de boas-vindas.** |
| POST | `/social` | `{provider, token}` | `{token, user}` | Login Google/Apple. |

### Pedidos (`/orders`)
| Método | Rota | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| GET | `/` | Auth | Lista pedidos. (Admin vê tudo, Client vê os seus). |
| GET | `/:id` | Auth | Detalhes, mensagens e documentos do pedido. |
| POST | `/` | Client | Cria pedido. **Payload `details` deve ser validado conforme o serviço.** |
| POST | `/:id/upload` | Auth | **Multipart/Form-Data**. Sobe arquivo p/ S3 e cria registro na tabela Document. |
| PATCH | `/:id/quote` | Admin | `{ price: number }`. Define preço e muda status para `PENDING`. **Notificar Cliente.** |
| PATCH | `/:id/assign` | Admin | `{ analystId: string }`. Atribui analista e muda p/ `IN_PROGRESS`. |
| POST | `/:id/messages`| Auth | `{ content: string }`. Envia mensagem. |

### Pagamentos & Webhooks
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| POST | `/payments` | Gera preferência no Mercado Pago e retorna `qrCode` + `copyPaste`. |
| POST | `/webhooks/mp` | **Recebe notificação do Mercado Pago.** |

---

## 5. Lógica de Negócio Crítica

### 5.1. Webhook do Mercado Pago (Segurança)
O endpoint `/webhooks/mp` será chamado publicamente pelo Mercado Pago.
1.  **Validar:** Verificar se a notificação é real consultando a API do MP pelo ID da transação (`GET /v1/payments/{id}`).
2.  **Status:** Se `status === 'approved'`, buscar o `Order` pelo `external_reference`.
3.  **Atualizar:** Mudar `Order.status` para `IN_PROGRESS` (ou `COMPLETED` se for automático).
4.  **Notificar:** Enviar e-mail e WhatsApp confirmando pagamento.

### 5.2. Validação de Formulários Dinâmicos (Zod)
O campo `details` varia por serviço. Use schemas Zod no controller:

**Ex: Certidão de Nascimento**
```typescript
const NascimentoSchema = z.object({
  certificateType: z.literal('nascimento'),
  fullName: z.string().min(3),
  birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/), // DD/MM/AAAA
  registry: z.string(),
  filiacao1: z.string(),
  filiacao2: z.string().optional()
});
```

---

## 6. Integração de Notificações (Templates)

Use os payloads abaixo para integrar com os provedores.

### 6.1. AWS SES (E-mail)
Configurar credenciais AWS no `.env`.
```javascript
// Exemplo de chamada SDK v3
const command = new SendEmailCommand({
  Source: "Edari <nao-responda@edari.com.br>",
  Destination: { ToAddresses: [userEmail] },
  Message: {
    Subject: { Data: "Atualização do seu pedido" },
    Body: { Html: { Data: "<h1>Seu pedido mudou de status...</h1>" } }
  }
});
```

### 6.2. WhatsApp Cloud API
Necessário criar um App na Meta for Developers e aprovar templates.
**Endpoint:** `POST https://graph.facebook.com/v17.0/{PHONE_ID}/messages`
**Header:** `Authorization: Bearer {WHATSAPP_TOKEN}`
**Body:**
```json
{
  "messaging_product": "whatsapp",
  "to": "5511999998888",
  "type": "template",
  "template": {
    "name": "status_update_br",
    "language": { "code": "pt_BR" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "João" },
          { "type": "text", "text": "Aprovado" }
        ]
      }
    ]
  }
}
```

---

## 7. Seed Inicial (Primeiro Acesso)

Crie um script `prisma/seed.ts` para criar o Administrador inicial, pois o sistema de cadastro público cria apenas Clientes.

```typescript
async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@edari.com.br' },
    update: {},
    create: {
      email: 'admin@edari.com.br',
      name: 'Super Admin',
      role: 'ADMIN',
      passwordHash: '...hash_bcrypt...', 
      isVerified: true
    },
  });
}
```

---

## 8. Variáveis de Ambiente (.env)

```env
# App
PORT=3000
NODE_ENV=production
JWT_SECRET=sua_chave_secreta_super_segura

# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"

# AWS (S3 & SES)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=edari-uploads

# Mercado Pago
MP_ACCESS_TOKEN=...
MP_WEBHOOK_SECRET=...

# WhatsApp
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...
```
