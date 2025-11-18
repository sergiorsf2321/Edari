# Guia Completo de Arquitetura e Desenvolvimento do Backend - Edari

## 1. Visão Geral e Arquitetura

Este documento é um roteiro completo para o desenvolvimento, implantação e manutenção da API RESTful para a aplicação Edari. O backend será a fonte autoritativa de dados, lógica de negócio e segurança.

**Componentes da Arquitetura:**
-   **Aplicação:** Node.js + Express com TypeScript.
-   **Banco de Dados:** PostgreSQL, gerenciado pelo Prisma ORM.
-   **Armazenamento de Arquivos:** Amazon S3 para armazenamento permanente e escalável.
-   **Gateway de Pagamento:** Mercado Pago (simulado, mas com arquitetura real).
-   **Hospedagem do Backend:** Render (Web Service).
-   **Hospedagem do Frontend:** Vercel ou Netlify (Static Site).

**Por que a Amazon S3 é necessária?**
Plataformas como o Render possuem um "sistema de arquivos efêmero". Isso significa que qualquer arquivo que você enviar diretamente para o servidor (como um PDF de um cliente) será **apagado** toda vez que a aplicação for reiniciada ou redimensionada. Para garantir que os documentos dos clientes sejam armazenados de forma permanente e segura, usamos um serviço de "armazenamento de objetos" como o Amazon S3. O fluxo é: o frontend envia o arquivo para o backend, que por sua vez o transmite para um "bucket" no S3 e salva apenas a URL de acesso no banco de dados.

---

## 2. Pré-requisitos

-   **Node.js** (versão 18 ou superior) e **npm**.
-   Conta no [**Render**](https://render.com/).
-   Conta na [**Amazon Web Services (AWS)**](https://aws.amazon.com/free/).
-   Conta de desenvolvedor no [**Mercado Pago**](https://www.mercadopago.com.br/developers).
-   Um editor de código (VS Code) e um cliente de API (Postman/Thunder Client).

---

## 3. Roteiro de Desenvolvimento Passo a Passo

### Passo 1: Configuração Inicial do Projeto (Node.js + TypeScript + Express)
*Esta seção permanece como no guia anterior, cobrindo a inicialização do projeto, instalação de dependências, configuração do `tsconfig.json` e criação do servidor Express inicial.*

1.  **Crie e inicie o projeto:**
    ```bash
    mkdir edari-backend && cd edari-backend
    npm init -y
    ```

2.  **Instale as dependências:**
    ```bash
    # Framework e tipos
    npm install express dotenv cors
    npm install --save-dev typescript @types/express @types/node ts-node nodemon @types/cors

    # Segurança e Validação
    npm install helmet express-rate-limit zod
    ```

3.  **Configure o TypeScript (`tsconfig.json`):**
    ```bash
    npx tsc --init
    # Ajuste "rootDir": "./src", "outDir": "./dist", etc.
    ```
4.  **Crie `src/server.ts` e adicione scripts `dev`, `build`, `start` no `package.json`.**

### Passo 2: Configuração do Banco de Dados com Prisma e Render
*Esta seção permanece como no guia anterior, detalhando a criação do banco PostgreSQL no Render, instalação e configuração do Prisma, e a execução da primeira migração.*

1.  **Crie um PostgreSQL no Render** e copie a "Internal Connection URL".
2.  **Instale e inicie o Prisma:**
    ```bash
    npm install prisma @prisma/client
    npx prisma init
    ```
3.  **Configure `.env`** com a `DATABASE_URL` do Render.
4.  **Defina o `schema.prisma`** (modelo de dados abaixo).
5.  **Execute a migração:** `npx prisma migrate dev --name init`.
6.  **Gere o client:** `npx prisma generate`.

### Passo 3: Configuração do Amazon S3 para Armazenamento de Arquivos
*Esta seção permanece como no guia anterior, um passo a passo detalhado para criar um bucket, um usuário IAM com permissões restritas e implementar o serviço de upload.*

1.  **Crie um Bucket no S3**, desmarcando o bloqueio de acesso público.
2.  **Crie um Usuário IAM** com uma política JSON personalizada que permite apenas as ações `PutObject`, `GetObject`, `DeleteObject`, `PutObjectAcl` no seu bucket específico.
3.  **Guarde as credenciais (Access Key ID e Secret Access Key)** e adicione-as, junto com o nome do bucket e a região, ao arquivo `.env`.
4.  **Instale o SDK da AWS e o Multer:**
    ```bash
    npm install @aws-sdk/client-s3 multer
    npm install --save-dev @types/multer
    ```
5.  **Implemente um `s3Service.ts`** para lidar com a lógica de upload e um endpoint que use o `multer` para receber o arquivo.

### Passo 4: Integração de Pagamentos com Gateway (ex: Mercado Pago)

**NUNCA armazene dados de cartão de crédito no seu servidor.** O fluxo correto é usar a SDK do gateway no frontend para criar um "token" que representa o cartão de forma segura.

1.  **Instale a SDK do Mercado Pago:**
    ```bash
    npm install mercadopago
    ```
2.  **Configure a SDK:** Adicione seu `MERCADOPAGO_ACCESS_TOKEN` ao `.env`.
    ```typescript
    // Em um arquivo de configuração, ex: src/config/mercadopago.ts
    import mercadopago from 'mercadopago';
    
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
    
    export default mercadopago;
    ```

3.  **Crie um Endpoint para Gerar a Preferência de Pagamento:**
    ```typescript
    // Em um controller de pagamento
    import mercadopago from '../config/mercadopago';

    export const createPaymentPreference = async (req, res) => {
      const { orderId, amount, description, userEmail } = req.body;
      const preference = {
        items: [{
          title: description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount,
        }],
        payer: { email: userEmail },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/order/success`,
          failure: `${process.env.FRONTEND_URL}/order/failure`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/api/payments/webhook/mercadopago`,
      };

      try {
        const response = await mercadopago.preferences.create(preference);
        res.json({ preferenceId: response.body.id });
      } catch (error) {
        res.status(500).send({ message: "Erro ao criar preferência de pagamento." });
      }
    };
    ```

4.  **Crie um Endpoint de Webhook para Receber Confirmações:**
    ```typescript
    // Em uma rota de pagamento
    router.post('/webhook/mercadopago', async (req, res) => {
      if (req.query.type === 'payment') {
        const paymentId = req.query['data.id'];
        
        try {
          // Busca os detalhes do pagamento na API do Mercado Pago
          const payment = await mercadopago.payment.findById(Number(paymentId));
          
          if (payment.body.status === 'approved') {
            const orderId = payment.body.external_reference; // Você deve passar o ID do seu pedido aqui
            // ATUALIZE O STATUS DO PEDIDO NO SEU BANCO DE DADOS
            // Ex: await prisma.order.update({ where: { id: orderId }, data: { status: 'IN_PROGRESS' } });
            console.log(`Pagamento aprovado para o pedido ${orderId}`);
          }
        } catch (error) {
          console.error('Erro no webhook:', error);
        }
      }
      res.sendStatus(200); // Responda sempre com 200 OK para o Mercado Pago
    });
    ```

### Passo 5: Implantação e Hospedagem

**Backend (Render):**
1.  **Faça o commit do seu código** para um repositório GitHub/GitLab.
2.  **Crie um "Web Service" no Render** e conecte seu repositório.
3.  **Configure o serviço:**
    -   **Region:** `South America (São Paulo)`
    -   **Build Command:** `npm install && npx prisma generate && npm run build`
    -   **Start Command:** `npm start`
4.  **Adicione as Variáveis de Ambiente:** Na aba "Environment", adicione **TODAS** as chaves do seu arquivo `.env` (`DATABASE_URL`, `JWT_SECRET`, `AWS_ACCESS_KEY_ID`, etc.).
5.  **Crie o serviço.** O Render irá fazer o deploy. A URL será algo como `edari-backend.onrender.com`.

**Frontend (Vercel/Netlify):**
1.  **Faça o commit do seu código frontend** para outro repositório.
2.  **Crie um novo projeto no Vercel/Netlify** e conecte o repositório.
3.  **Configure o projeto:** A plataforma geralmente detecta o React e configura os comandos automaticamente:
    -   **Build Command:** `npm run build`
    -   **Publish directory:** `dist` ou `build`
4.  **Adicione as Variáveis de Ambiente:** Adicione a URL do seu backend (`https://edari-backend.onrender.com`) como uma variável de ambiente (ex: `VITE_API_URL` ou `REACT_APP_API_URL`) para que o frontend saiba para onde enviar as requisições.
5.  **Faça o deploy.**

### Passo 6: Configuração de Domínio e DNS

1.  **Compre um domínio** (ex: `edari.com.br`) em um registrador como Registro.br ou GoDaddy.
2.  **Aponte o domínio principal para o Frontend:**
    -   No Vercel/Netlify, adicione seu domínio personalizado (`edari.com.br` e `www.edari.com.br`).
    -   Ele fornecerá os registros DNS (geralmente um `A` record e um `CNAME` record) que você precisa configurar no seu registrador de domínio.
3.  **Aponte um subdomínio para o Backend:**
    -   No Render, adicione um domínio personalizado ao seu Web Service (ex: `api.edari.com.br`).
    -   O Render fornecerá um valor para um registro `CNAME`.
    -   No seu registrador de domínio, crie um novo registro `CNAME` com o host `api` e aponte-o para o valor fornecido pelo Render.

---

## 4. Boas Práticas de Segurança

-   **HTTPS/SSL:** Render e Vercel/Netlify fornecem certificados SSL gratuitos e ativam HTTPS automaticamente. Sempre use `https://`.
-   **CORS (Cross-Origin Resource Sharing):** No seu `server.ts`, configure o CORS para ser restritivo em produção:
    ```typescript
    const whitelist = ['https://edari.com.br', 'https://www.edari.com.br'];
    const corsOptions = {
      origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    };
    app.use(cors(corsOptions));
    ```
-   **Validação de Entrada:** Valide **TUDO** que chega do cliente para prevenir injeção de SQL e outros ataques. Use uma biblioteca como o `zod`.
    ```typescript
    // Exemplo de validação com Zod
    import { z } from 'zod';
    
    const registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(3),
    });

    // Em uma rota/middleware:
    try {
      registerSchema.parse(req.body);
    } catch (error) {
      return res.status(400).json(error.errors);
    }
    ```
-   **Helmet:** Use o Helmet para configurar headers HTTP de segurança importantes.
    ```typescript
    import helmet from 'helmet';
    app.use(helmet());
    ```
-   **Rate Limiting:** Proteja seus endpoints de login e outras rotas sensíveis contra ataques de força bruta.
    ```typescript
    import rateLimit from 'express-rate-limit';

    const loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 10, // Limita cada IP a 10 requisições por janela
      standardHeaders: true,
      legacyHeaders: false,
    });
    
    app.use('/api/auth/login', loginLimiter);
    ```
-   **Variáveis de Ambiente:** **NUNCA** comite senhas, chaves de API ou segredos no código. Use sempre variáveis de ambiente (`process.env`) e configure-as diretamente na plataforma de hospedagem.

---

## 5. Modelagem do Banco de Dados (`schema.prisma`)
*Esta seção permanece como no guia anterior, contendo o schema completo do Prisma.*

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ... (schema completo aqui)
model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String?   // Nulo para login social
  role         Role      @default(CLIENT)
  picture      String?
  isVerified   Boolean   @default(false)
  cpf          String?   @unique
  birthDate    String?
  address      String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  ordersAsClient  Order[]   @relation("ClientOrders")
  ordersAsAnalyst Order[]   @relation("AnalystOrders")
  sentMessages    Message[]
}

model Service {
  id          String   @id @unique
  name        String
  description String
  price       Float?
  duration    String
  features    String[]
  orders      Order[]
}

model Order {
  id                 String       @id @default(cuid())
  status             OrderStatus  @default(PENDING)
  isUrgent           Boolean      @default(false)
  propertyType       String
  total              Float        @default(0)
  description        String       @db.Text
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  paymentConfirmedAt DateTime?

  clientId String
  client   User   @relation("ClientOrders", fields: [clientId], references: [id])

  serviceId String
  service   Service @relation(fields: [serviceId], references: [id])

  analystId String?
  analyst   User?   @relation("AnalystOrders", fields: [analystId], references: [id])

  documents Document[]
  messages  Message[]
}

model Document {
  id      String   @id @default(cuid())
  name    String
  size    Float
  type    String
  url     String // URL do arquivo no S3

  orderId String
  order   Order  @relation(fields: [orderId], references: [id])

  messageId String?  @unique
  message   Message?
}

model Message {
  id        String   @id @default(cuid())
  content   String   @db.Text
  createdAt DateTime @default(now())

  senderId String
  sender   User   @relation(fields: [senderId], references: [id])

  orderId String
  order   Order  @relation(fields: [orderId], references: [id])

  attachment   Document? @relation(fields: [attachmentId], references: [id])
  attachmentId String?   @unique
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

## 6. Definição de Endpoints da API (Rotas)
*Esta seção permanece como no guia anterior, listando as rotas da API.*

### Autenticação (`/api/auth`)
-   `POST /register`: Cria um novo usuário.
-   `POST /login`: Autentica um usuário e retorna um JWT.
-   `POST /login/google`: Autentica com o token do Google.
-   `POST /login/apple`: Autentica com o token da Apple.
-   `GET /me`: (Protegido) Retorna os dados do usuário logado.

### Pedidos (`/api/orders`)
-   `GET /`: (Protegido) Lista pedidos.
-   `POST /`: (Protegido: CLIENT) Cria um novo pedido.
-   `GET /:id`: (Protegido) Busca detalhes de um pedido específico.
-   `PATCH /:id/assign`: (Protegido: ADMIN) Atribui um analista a um pedido.
-   `PATCH /:id/status`: (Protegido: ADMIN, ANALYST) Atualiza o status de um pedido.

### Pagamentos (`/api/payments`)
-   `POST /create-preference`: (Protegido) Cria uma preferência de pagamento no gateway.
-   `POST /webhook/mercadopago`: (Público) Recebe notificações do gateway.

### Uploads (`/api/uploads`)
-   `POST /`: (Protegido) Recebe um arquivo, envia para o S3 e retorna os detalhes.
