# Projeto Arquitetônico do Backend da EDARI (Versão 2.0)

Este documento é o guia definitivo para a construção de um backend moderno, seguro e escalável para a plataforma EDARI, garantindo uma integração perfeita com o frontend existente.

## 1. Tecnologias Recomendadas (O "Stack")

-   **Linguagem:** **TypeScript**.
-   **Ambiente de Execução:** **Node.js**.
-   **Framework:** **Express.js**.
-   **Banco de Dados:** **PostgreSQL**.
-   **ORM (Mapeamento Objeto-Relacional):** **Prisma**.

## 2. Hospedagem e Banco de Dados com Vercel

A Vercel, ideal para o frontend, também pode hospedar o backend e o banco de dados através dos seus serviços integrados.

**Guia Rápido para Vercel Postgres:**

1.  **Criação do Banco:** No dashboard do seu projeto Vercel, vá para a aba **Storage**.
2.  Clique em **Create Database** e selecione **Postgres**. Siga as instruções para criar sua instância.
3.  **Variáveis de Ambiente:** A Vercel automaticamente disponibilizará as variáveis de conexão (como `POSTGRES_URL`, `POSTGRES_PRISMA_URL`) para o seu projeto. Você só precisa garantir que o seu `schema.prisma` as utilize.
4.  **Configuração do Schema:** Em `prisma/schema.prisma`, na seção `datasource`, certifique-se de que a URL é lida do ambiente:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("POSTGRES_PRISMA_URL") // Use a variável específica para Prisma fornecida pela Vercel
    }
    ```
5.  **Migrations (Atualizações do Banco):** Para aplicar suas mudanças de schema em produção, modifique o comando de `build` no seu `package.json`:
    ```json
    "scripts": {
      "build": "npx prisma migrate deploy && next build" // Exemplo para Next.js, adapte para seu build
    }
    ```
    Isso garante que, a cada deploy, o banco de dados seja atualizado para corresponder ao seu `schema.prisma`.

## 3. Schema Completo do Banco de Dados (`prisma/schema.prisma`)

Este schema foi atualizado para corresponder a todas as estruturas de dados utilizadas no frontend.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
}

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String
  password       String?
  picture        String?
  role           Role      @default(CLIENT)
  orders         Order[]   @relation("ClientOrders")
  assignedOrders Order[]   @relation("AnalystOrders")
  messages       Message[]
}

model Service {
  id          String   @id @default(cuid())
  serviceId   String   @unique // Corresponde ao ServiceId do frontend, ex: 'qualified_search'
  name        String
  description String
  price       Float?
  duration    String
  features    Json
  orders      Order[]
}

model Order {
  id           String      @id @default(cuid())
  description  String
  status       OrderStatus @default(AWAITING_QUOTE)
  total        Float       @default(0)
  isUrgent     Boolean     @default(false)
  propertyType String?
  documents    Json[]      // Lista de objetos de documentos {name, url, size, type}
  report       Json?       // Objeto do relatório final
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  client       User        @relation("ClientOrders", fields: [clientId], references: [id])
  clientId     String

  analyst      User?       @relation("AnalystOrders", fields: [analystId], references: [id])
  analystId    String?
  
  service      Service     @relation(fields: [serviceId], references: [id])
  serviceId    String

  messages     Message[]
}

model Message {
  id         String   @id @default(cuid())
  content    String
  createdAt  DateTime @default(now())
  attachment Json?    // Objeto do anexo {name, url, size, type}
  
  order      Order    @relation(fields: [orderId], references: [id])
  orderId    String

  sender     User     @relation(fields: [senderId], references: [id])
  senderId   String
}

enum Role {
  CLIENT
  ANALYST
  ADMIN
}

enum OrderStatus {
  AWAITING_QUOTE
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELED
}
```

## 4. Guia Detalhado dos Endpoints da API

### Autenticação (`/api/auth`)

-   `POST /register`: Cria um novo cliente com email/senha. Usa `bcrypt` para hash da senha.
-   `POST /login`: Autentica um usuário (cliente ou colaborador). Retorna um JWT.
-   `POST /google-signin`:
    -   **Recebe:** `{ "googleToken": "..." }`
    -   **Processo:**
        1.  Usa `google-auth-library` para verificar o token.
        2.  Busca o usuário pelo email. Se não existir, cria um novo com `role: CLIENT`.
        3.  Gera um JWT da **nossa aplicação** para o usuário.
    -   **Retorna:** `{ "appToken": "NOSSO_JWT_SEGURO", "user": { ... } }`

### Serviços (`/api/services`)

-   `GET /`: Lista todos os serviços disponíveis (para a página de contratação).

### Pedidos (`/api/orders`)

-   `POST /`: Cliente cria um novo pedido. Requer JWT.
-   `GET /`: Lista pedidos com base no JWT do usuário (cliente vê os seus, analista os atribuídos, admin todos).
-   `GET /:id`: Detalhes de um pedido. Verifica a permissão do usuário.
-   `POST /:id/messages`: Envia uma mensagem.
-   `PUT /:id/assign`: Admin atribui um analista.
-   `POST /:id/quote`: Admin envia um orçamento.
-   `PUT /:id/status`: Muda o status do pedido (ex: para `CANCELED`).

## 5. Guia Passo a Passo: Integração de Pagamentos

A integração será feita com o **Mercado Pago**, priorizando a segurança (sem tocar em dados de cartão).

**Passo 1: Configuração**
-   Obtenha seu `ACCESS_TOKEN` do Mercado Pago e adicione-o às variáveis de ambiente (`MERCADO_PAGO_ACCESS_TOKEN`).
-   Instale o SDK oficial: `npm install mercadopago`.

**Passo 2: Geração de PIX (`POST /api/payments/pix`)**

1.  **Endpoint recebe:** `{ "orderId": "..." }`.
2.  **Backend:**
    -   Verifica se o usuário logado é o dono do pedido.
    -   Busca o valor (`total`) do pedido no banco.
    -   Usa o SDK do Mercado Pago para criar a intenção de pagamento.
    ```typescript
    // Exemplo de código no backend
    import mercadopago from 'mercadopago';
    
    mercadopago.configure({ access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
    
    const response = await mercadopago.payment.create({
      transaction_amount: order.total,
      description: order.service.name,
      payment_method_id: 'pix',
      payer: { email: user.email, /* ... */ }
    });
    
    const qrCodeBase64 = response.body.point_of_interaction.transaction_data.qr_code_base64;
    const pixCopyPaste = response.body.point_of_interaction.transaction_data.qr_code;
    ```
3.  **Backend retorna:** `{ qrCodeUrl, pixCopyPaste }` para o frontend.

**Passo 3: Pagamento com Cartão de Crédito (`POST /api/payments/card`)**

1.  **Frontend:** Usa o SDK `MercadoPago.js V2` no navegador para coletar os dados do cartão e gerar um `cardToken` seguro. **Este é o passo mais importante para a segurança PCI.**
2.  **Endpoint recebe:** `{ "orderId": "...", "token": "CARD_TOKEN_GERADO", "installments": 1, "payment_method_id": "visa", ... }`.
3.  **Backend:**
    -   Verifica a posse do pedido.
    -   Usa o SDK para processar o pagamento usando o `token`. **NUNCA os dados do cartão.**
    ```typescript
    const paymentResponse = await mercadopago.payment.create({
      transaction_amount: order.total,
      token: req.body.token,
      installments: req.body.installments,
      // ... outros dados
    });
    ```
4.  Se o `paymentResponse.body.status` for `approved`, o backend atualiza o status do pedido no banco para `IN_PROGRESS` e retorna sucesso ao frontend.

**Passo 4: Webhooks para Confirmação (`POST /api/webhooks/mercado-pago`)**

O webhook é essencial para confirmar pagamentos que não são instantâneos (como PIX pago depois ou boletos).

1.  **Configuração:** No painel do Mercado Pago, configure um endpoint de webhook apontando para esta rota.
2.  **Endpoint recebe:** Uma notificação do Mercado Pago, ex: `{ "type": "payment", "data": { "id": "12345" } }`.
3.  **Backend:**
    -   Recebe a notificação.
    -   **NÃO CONFIE na notificação.** Imediatamente, use o `data.id` para fazer uma chamada GET segura de volta para a API do Mercado Pago e obter o status real do pagamento: `mercadopago.payment.findById(data.id)`.
    -   Se o status do pagamento obtido for `approved`, o backend encontra o pedido associado e atualiza seu status no banco para `IN_PROGRESS`.
    -   Responde ao Mercado Pago com um status `200 OK`.

## 6. Estratégia de Upload de Arquivos (Segura e Escalável)

Usaremos **URLs Pré-Assinadas** com um serviço como **AWS S3** ou compatível (Cloudflare R2, Google Cloud Storage).

**Fluxo:**

1.  **Frontend:** Antes de fazer o upload, o cliente (navegador) pede uma URL segura ao nosso backend.
    -   `POST /api/orders/:id/generate-upload-url` com o body `{ "fileName": "matricula.pdf", "fileType": "application/pdf" }`.

2.  **Backend:**
    -   Verifica a permissão do usuário para o pedido.
    -   Usa o SDK do serviço de nuvem (ex: `aws-sdk`) para gerar uma URL de upload de curta duração (ex: 5 minutos) que permite uma requisição `PUT` para um local específico no bucket de armazenamento.
    -   Retorna `{ "uploadUrl": "https://s3...", "fileUrl": "https://public..." }` ao frontend.

3.  **Frontend:**
    -   Recebe a `uploadUrl`.
    -   Faz uma requisição `PUT` diretamente para essa URL com o corpo do arquivo. O upload vai direto do navegador para o S3, sem passar pelo nosso servidor.

4.  **Associação do Arquivo:**
    -   Após o upload ser bem-sucedido, o frontend envia a `fileUrl` recebida no passo 2 para o nosso backend, por exemplo, ao enviar uma nova mensagem:
    -   `POST /api/orders/:id/messages` com o body `{ "content": "Segue o anexo", "attachment": { "name": "...", "url": "https://public...", "size": 12345, "type": "..." } }`.
    -   O backend então salva essa informação no banco, associada à mensagem e à lista de documentos do pedido.
