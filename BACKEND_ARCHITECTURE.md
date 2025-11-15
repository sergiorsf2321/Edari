# Projeto Arquitetônico do Backend da EDARI

Este documento serve como um guia completo para construir um backend moderno, seguro e escalável, pronto para ser conectado ao frontend que já foi desenvolvido para a plataforma EDARI.

## 1. Tecnologias Recomendadas (O "Stack")

Para máxima produtividade e compatibilidade com o ecossistema moderno, a seguinte stack de tecnologia é recomendada:

-   **Linguagem:** **TypeScript**. Garante segurança de tipos, o que reduz bugs e facilita a manutenção do código a longo prazo.
-   **Ambiente de Execução:** **Node.js**. Rápido, eficiente e permite o uso da mesma linguagem do frontend (JavaScript/TypeScript), unificando o conhecimento necessário.
-   **Framework:** **Express.js**. Simples, flexível, poderoso e o padrão de mercado para criar APIs em Node.js.
-   **Banco de Dados:** **PostgreSQL**. Um sistema de banco de dados relacional robusto, confiável e excelente para dados estruturados como os da EDARI (pedidos, usuários, mensagens, etc.).
-   **ORM (Mapeamento Objeto-Relacional):** **Prisma**. Facilita drasticamente a comunicação com o banco de dados, gera tipos TypeScript automaticamente a partir do schema e previne erros comuns de SQL, aumentando a segurança e a velocidade de desenvolvimento.

## 2. Estrutura de Pastas do Projeto

Uma boa organização é fundamental para a manutenibilidade do projeto. A estrutura abaixo é recomendada:

```plaintext
/edari-backend
|
├── prisma/
|   └── schema.prisma      # Definição das tabelas do banco de dados (o "Schema")
|
├── src/
|   ├── api/
|   |   ├── auth/          # Rotas e controllers de autenticação (login, registro)
|   |   ├── orders/        # Rotas e controllers de pedidos (criar, listar, detalhar)
|   |   └── payments/      # Rotas e controllers de pagamentos (gerar PIX, webhook)
|   |
|   ├── services/
|   |   ├── auth.service.ts    # Lógica de negócio para usuários e autenticação
|   |   ├── order.service.ts   # Lógica de negócio para pedidos e status
|   |   └── payment.service.ts # Lógica para integrar com a API do Mercado Pago
|   |
|   ├── middlewares/
|   |   └── auth.middleware.ts # Middleware para verificar se o usuário está logado (JWT)
|   |
|   └── server.ts            # Ponto de entrada da aplicação (configuração do Express)
|
├── .env                     # Arquivo para variáveis de ambiente e segredos (NÃO ENVIAR PARA O GITHUB)
├── .gitignore               # Arquivo para ignorar pastas como node_modules e .env
├── package.json
└── tsconfig.json
```

## 3. Guia de Implementação

### Passo A: Definição do Banco de Dados (`prisma/schema.prisma`)

O Prisma utiliza um arquivo de schema para definir todo o banco de dados. Este schema é uma tradução direta dos tipos que já temos no frontend (`types.ts`).

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id       String  @id @default(cuid())
  email    String  @unique
  name     String
  password String // A senha será armazenada de forma criptografada (hash)
  role     Role    @default(CLIENT)
  orders   Order[] @relation("ClientOrders")
  assignedOrders Order[] @relation("AnalystOrders")
  messages Message[]
}

model Order {
  id          String      @id @default(cuid())
  serviceName String
  description String
  status      OrderStatus @default(AWAITING_QUOTE)
  total       Float       @default(0)
  documents   Json?       // Para armazenar uma lista de URLs de documentos
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  client      User        @relation("ClientOrders", fields: [clientId], references: [id])
  clientId    String

  analyst     User?       @relation("AnalystOrders", fields: [analystId], references: [id])
  analystId   String?
  
  messages    Message[]
}

model Message {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  
  order     Order    @relation(fields: [orderId], references: [id])
  orderId   String

  sender    User     @relation(fields: [senderId], references: [id])
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

### Passo B: Criação dos Endpoints da API

O frontend precisará "conversar" com o backend. Faremos isso através de endpoints REST.

-   **Autenticação (`/api/auth`)**
    -   `POST /register`: Cria um novo cliente. Recebe `name`, `email`, `password`.
    -   `POST /login`: Autentifica um usuário. Recebe `email`, `password`. Retorna um token de segurança (JWT).

-   **Pedidos (`/api/orders`)**
    -   `POST /`: Cliente cria um novo pedido. Recebe `serviceId`, `description`, `files`. Requer autenticação.
    -   `GET /`: Lista os pedidos. Clientes veem só os seus, Admins/Analistas veem os relevantes. Requer autenticação.
    -   `GET /:id`: Busca os detalhes de um pedido específico. Requer autenticação e permissão.
    -   `POST /:id/messages`: Envia uma mensagem em um pedido. Requer autenticação.
    -   `PUT /:id/assign`: Admin atribui um analista. Recebe `analystId`. Requer autenticação de Admin.
    -   `POST /:id/quote`: Admin envia um orçamento. Recebe `total`. Requer autenticação de Admin.

-   **Pagamentos (`/api/payments`)**
    -   `POST /create-pix`: Gera um PIX para um pedido. Recebe `orderId`. Requer autenticação.
    -   `POST /webhook/mercado-pago`: Endpoint **público** que o Mercado Pago usará para notificar que um pagamento foi confirmado.

### Passo C: Lógica de Segurança e Integrações

-   **Senhas:** **Nunca** salve senhas em texto puro. Use uma biblioteca como `bcrypt` para criptografá-las antes de salvar no banco.
-   **Autenticação:** Use **JWT (JSON Web Tokens)**. Após o login, o backend gera um token que o frontend envia em cada requisição para provar que o usuário está logado. O `auth.middleware.ts` irá verificar a validade desse token antes de permitir o acesso a rotas protegidas.
-   **Integração com Mercado Pago:** No backend, instale o SDK oficial do Mercado Pago. As chaves de API (`ACCESS_TOKEN`) devem ficar no arquivo `.env`. O backend fará as chamadas seguras para a API do Mercado Pago.
-   **Upload de Arquivos:** Para os documentos, a melhor prática é não salvá-los no servidor do backend. Use um serviço de armazenamento de objetos em nuvem como **Amazon S3**, **Google Cloud Storage** ou **Cloudinary**. O backend receberá o arquivo do frontend e o enviará de forma segura para um desses serviços, salvando apenas o link de acesso no banco de dados.

## 4. Como Hospedar (Deploy)

Para colocar o backend online:

1.  **Crie o Repositório no GitHub:** Inicie um novo repositório e envie o código do backend para ele.
2.  **Escolha uma Plataforma:** Recomendo a **Render.com**. Ela possui planos gratuitos generosos, é muito fácil de usar e suporta Node.js e PostgreSQL nativamente. Alternativas são Heroku ou Vercel.
3.  **Configure na Plataforma (Ex: Render):**
    -   **Crie um Banco de Dados:** Na Render, crie um novo serviço "PostgreSQL". Ela fornecerá uma URL de conexão (`DATABASE_URL`).
    -   **Crie o Serviço Web:** Crie um novo "Web Service" e conecte-o ao seu repositório do GitHub.
    -   **Configure o Ambiente:**
        -   **Comando de Build:** `npm install && npx prisma generate`
        -   **Comando de Início:** `npm start`
        -   **Variáveis de Ambiente:** Copie todas as variáveis do seu arquivo `.env` (como `DATABASE_URL`, `JWT_SECRET`, `MERCADO_PAGO_ACCESS_TOKEN`) para a seção "Environment" na Render.
4.  **Deploy Automático:** A Render irá automaticamente baixar seu código do GitHub, instalar as dependências, construir o projeto e colocá-lo no ar. A cada novo `git push` para a branch principal, ela fará o deploy da nova versão automaticamente.
