# Instrução de Trabalho: Backend da Plataforma EDARI

Este documento é o guia definitivo para a construção e implantação do backend da EDARI, garantindo uma integração perfeita com o frontend finalizado.

## 1. Stack Tecnológico

-   **Linguagem:** **TypeScript** com **Node.js**.
-   **Framework:** **Express.js** para a criação da API RESTful.
-   **Banco de Dados:** **PostgreSQL**, hospedado na Render.
-   **ORM:** **Prisma** para uma interação segura e tipada com o banco de dados.
-   **Autenticação:** **JWT** (JSON Web Tokens) para proteger as rotas.
-   **Hashing de Senhas:** **bcrypt** para armazenar senhas de forma segura.

---

## 2. Configuração da Infraestrutura na Render

A Render será utilizada para hospedar tanto o banco de dados quanto a aplicação backend.

### Passo 2.1: Criar o Banco de Dados (Render Postgres)

1.  No seu dashboard da Render, clique em **"New +"** e selecione **"PostgreSQL"**.
2.  Dê um nome para a sua instância (ex: `edari-db`), escolha a região e a versão do Postgres.
3.  Após a criação, a Render fornecerá várias strings de conexão na aba **"Info"** do seu banco de dados. Copie o valor de **"Internal Connection URL"**. Esta é a URL que sua aplicação usará para se conectar ao banco.

### Passo 2.2: Deploy do Backend (Render Web Service)

1.  Clique em **"New +"** e selecione **"Web Service"**.
2.  Conecte o repositório do seu backend (GitHub, GitLab, etc.).
3.  **Configurações do Serviço:**
    -   **Name:** Dê um nome para o serviço (ex: `edari-api`).
    -   **Environment:** Node.
    -   **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` (Ajuste `npm run build` se seu script de compilação TypeScript for diferente).
    -   **Start Command:** `npm start`.
4.  **Variáveis de Ambiente:**
    -   Vá para a aba **"Environment"**.
    -   Crie uma variável chamada `DATABASE_URL` (ou `POSTGRES_PRISMA_URL`, o que preferir) e cole a **"Internal Connection URL"** do seu banco de dados.
    -   Adicione outras variáveis necessárias, como `JWT_SECRET`, `MERCADO_PAGO_ACCESS_TOKEN`, etc.

---

## 3. Schema do Banco de Dados (`prisma/schema.prisma`)

Este schema é a fonte da verdade para a estrutura do banco de dados.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String
  password       String?   // Nulo para usuários de login social
  picture        String?
  role           Role      @default(CLIENT)
  isVerified     Boolean   @default(false)
  cpf            String?
  birthDate      String?
  address        String?

  orders         Order[]   @relation("ClientOrders")
  assignedOrders Order[]   @relation("AnalystOrders")
  messages       Message[]
}

model Service {
  id          String   @id @default(cuid())
  serviceId   String   @unique // 'qualified_search', 'digital_certificate', etc.
  name        String
  description String
  price       Float?
  duration    String
  features    Json
  orders      Order[]
}

model Order {
  id                 String      @id @default(cuid())
  description        String
  status             OrderStatus @default(AWAITING_QUOTE)
  total              Float       @default(0)
  isUrgent           Boolean     @default(false)
  propertyType       String?
  documents          Json[]      // [{ name, url, size, type }]
  report             Json?       // { name, url, size, type }
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
  paymentConfirmedAt DateTime?
  
  client    User   @relation("ClientOrders", fields: [clientId], references: [id])
  clientId  String

  analyst   User?  @relation("AnalystOrders", fields: [analystId], references: [id])
  analystId String?
  
  service   Service @relation(fields: [serviceId], references: [id])
  serviceId String

  messages  Message[]
}

model Message {
  id         String   @id @default(cuid())
  content    String
  createdAt  DateTime @default(now())
  attachment Json?    // { name, url, size, type }
  
  order     Order  @relation(fields: [orderId], references: [id])
  orderId   String

  sender    User   @relation(fields: [senderId], references: [id])
  senderId  String
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

---

## 4. Guia de Implementação dos Endpoints da API

Crie rotas claras e protegidas por um middleware de autenticação JWT (exceto para rotas de login/registro).

### Autenticação (`/api/auth`)

-   `POST /register`: Cria um novo cliente. Hash da senha com `bcrypt`.
-   `POST /login`: Autentica um usuário (cliente, analista, admin). Retorna um JWT.
-   `POST /google-signin`:
    -   **Recebe:** `{ "googleToken": "..." }`.
    -   **Ação:** Valide o token usando `google-auth-library`. Busque o usuário pelo e-mail. Se não existir, crie um novo (`role: CLIENT`, `isVerified: true`). Gere e retorne um JWT da **sua aplicação**.
-   `POST /apple-signin`:
    -   **Recebe:** `{ "appleToken": "..." }`.
    -   **Ação:** Valide o token contra as chaves públicas da Apple. Extraia o e-mail. Busque o usuário. Se não existir, crie um novo (`role: CLIENT`, `isVerified: true`). Gere e retorne um JWT da **sua aplicação**.

### Outros Endpoints

-   **Serviços (`/api/services`):** `GET /` para listar todos.
-   **Pedidos (`/api/orders`):**
    -   `POST /`: Criar novo pedido (requer JWT de cliente).
    -   `GET /`: Listar pedidos com base no perfil (cliente, analista, admin).
    -   `GET /:id`: Detalhes de um pedido (verificar permissão).
    -   `POST /:id/messages`: Enviar mensagem no chat do pedido.
    -   `PUT /:id/assign`: Admin atribui analista.
    -   `POST /:id/quote`: Admin/Analista envia orçamento.
    -   `PUT /:id/status`: Muda o status do pedido.

---

## 5. Instrução de Trabalho: Integração com Mercado Pago

Siga este fluxo para garantir segurança e conformidade.

**Passo 1: Configuração Inicial**
1.  Crie uma conta no Mercado Pago e obtenha seu **Access Token** de produção.
2.  Adicione o token às variáveis de ambiente do seu serviço na Render como `MERCADO_PAGO_ACCESS_TOKEN`.
3.  Instale o SDK oficial: `npm install mercadopago`.
4.  Configure o SDK no seu código:
    ```typescript
    import mercadopago from 'mercadopago';
    mercadopago.configure({ access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
    ```

**Passo 2: Pagamento com Cartão de Crédito (Seguro)**
O frontend é responsável por tokenizar os dados do cartão. O backend **NUNCA** deve receber o número do cartão.

1.  **Frontend:** Usa o SDK `MercadoPago.js V2` para coletar dados do cartão e gerar um `cardToken`.
2.  **Backend (`POST /api/payments/card`):**
    -   **Recebe:** `{ "orderId": "...", "token": "CARD_TOKEN_GERADO", "installments": 1, "payment_method_id": "visa", ... }`.
    -   **Ação:**
        -   Valide o `orderId` e verifique se o usuário logado é o dono.
        -   Chame a API do Mercado Pago usando o `token`:
          ```typescript
          const paymentResponse = await mercadopago.payment.create({
            transaction_amount: order.total,
            token: req.body.token,
            installments: req.body.installments,
            description: order.service.name,
            payer: { email: user.email }
          });
          ```
    -   **Se `paymentResponse.body.status === 'approved'`:**
        -   Atualize o status do pedido no seu banco para `IN_PROGRESS`.
        -   Atualize o campo `paymentConfirmedAt`.
        -   Retorne sucesso para o frontend.

**Passo 3: Pagamento com PIX**
1.  **Backend (`POST /api/payments/pix`):**
    -   **Recebe:** `{ "orderId": "..." }`.
    -   **Ação:**
        -   Valide o `orderId`.
        -   Crie a preferência de pagamento PIX:
          ```typescript
          const response = await mercadopago.payment.create({
            transaction_amount: order.total,
            description: order.service.name,
            payment_method_id: 'pix',
            payer: { email: user.email }
          });
          
          const qrCodeBase64 = response.body.point_of_interaction.transaction_data.qr_code_base64;
          const pixCopyPaste = response.body.point_of_interaction.transaction_data.qr_code;
          ```
    -   **Retorna:** `{ qrCodeUrl: `data:image/png;base64,${qrCodeBase64}`, pixCopyPaste }`.

**Passo 4: Webhooks (Essencial para Confirmação)**
Webhooks são cruciais para confirmar pagamentos que não são instantâneos (como PIX).

1.  **Configuração:** No painel do Mercado Pago, configure um endpoint de Webhook apontando para `https://sua-api.onrender.com/api/webhooks/mercado-pago`.
2.  **Backend (`POST /api/webhooks/mercado-pago`):**
    -   **Recebe:** Notificação do Mercado Pago, ex: `{ "type": "payment", "data": { "id": "12345" } }`.
    -   **Ação (IMPORTANTE):**
        1.  Receba a notificação e responda **imediatamente** com status `200 OK`.
        2.  **NÃO CONFIE no payload do webhook.** Apenas extraia o ID do pagamento (`data.id`).
        3.  Faça uma chamada GET segura de volta à API do Mercado Pago para obter o status real: `mercadopago.payment.findById(data.id)`.
        4.  Se o status retornado for `approved`, encontre o pedido no seu banco de dados e atualize seu status para `IN_PROGRESS` e `paymentConfirmedAt`.

---

## 6. Instrução de Trabalho: Upload de Arquivos

Utilize **URLs Pré-Assinadas** com um serviço de armazenamento de objetos como **AWS S3** ou **Cloudflare R2** (alternativa mais barata e compatível).

**Fluxo de Upload:**

1.  **Frontend:** Antes de fazer upload, solicita uma URL segura ao backend.
    -   `POST /api/orders/:id/generate-upload-url` com `{ "fileName": "matricula.pdf", "fileType": "application/pdf" }`.

2.  **Backend:**
    -   Verifica se o usuário tem permissão para o pedido.
    -   Usa o SDK do serviço de nuvem (ex: `aws-sdk`) para gerar uma URL de upload de curta duração (ex: 5 minutos) que permite uma requisição `PUT`.
    -   Retorna `{ uploadUrl: "https://s3-ou-r2...", fileUrl: "https://caminho-publico..." }`.

3.  **Frontend:**
    -   Recebe a `uploadUrl`.
    -   Faz uma requisição `PUT` **diretamente para essa URL** com o arquivo como corpo da requisição. O upload vai do navegador para o S3/R2, sem sobrecarregar seu servidor.

4.  **Backend (Associação do Arquivo):**
    -   Após o upload, o frontend informa ao backend que o arquivo está disponível. Isso pode ser feito ao enviar uma nova mensagem no chat.
    -   `POST /api/orders/:id/messages` com `{ "content": "Segue o anexo", "attachment": { "name": "...", "url": "https://caminho-publico...", ... } }`.
    -   O backend salva a `url` do arquivo no banco de dados, associada à mensagem e/ou ao pedido.