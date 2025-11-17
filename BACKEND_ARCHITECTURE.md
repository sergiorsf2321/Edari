# Instrução de Trabalho: Backend da Plataforma EDARI

## Visão Geral

Este documento é o guia definitivo para a construção e implantação do backend da plataforma EDARI. O objetivo é criar uma API **robusta, segura e escalável** que servirá como a espinha dorsal para todas as operações do frontend, garantindo uma integração perfeita e uma experiência de usuário fluida.

Este projeto será construído na plataforma **Render**, que hospedará tanto a aplicação backend quanto o banco de dados PostgreSQL.

## 1. Stack Tecnológico

A arquitetura do backend será baseada em tecnologias modernas e consolidadas no mercado, garantindo performance e manutenibilidade.

-   **Linguagem:** **TypeScript** com **Node.js**.
-   **Framework:** **Express.js** para a criação da API RESTful.
-   **Banco de Dados:** **PostgreSQL**, hospedado na **Render**.
-   **ORM:** **Prisma** para uma interação segura e tipada com o banco de dados.
-   **Autenticação:** **JWT** (JSON Web Tokens) para proteger as rotas.
-   **Hashing de Senhas:** **bcrypt** para armazenar senhas de forma segura.
-   **Ferramentas de Desenvolvimento:** O desenvolvimento será auxiliado por ferramentas de IA de ponta, como o **Google Cloud Opus 4**, para otimização de código, geração de testes e aceleração da lógica de negócios.

---

## 2. Configuração da Infraestrutura na Render

A Render será a única plataforma de nuvem utilizada.

### Passo 2.1: Criar o Banco de Dados (Render Postgres)

1.  No dashboard da Render, clique em **"New +"** e selecione **"PostgreSQL"**.
2.  Dê um nome para a instância (ex: `edari-db`), escolha a região mais próxima de seus usuários e a versão mais recente do Postgres.
3.  Após a criação, copie a string de conexão da aba **"Info"** -> **"Internal Connection URL"**. Esta é a URL que a aplicação usará para se conectar ao banco de dados.

### Passo 2.2: Deploy do Backend (Render Web Service)

1.  Clique em **"New +"** e selecione **"Web Service"**.
2.  Conecte o repositório do seu backend.
3.  **Configurações do Serviço:**
    -   **Name:** `edari-api`.
    -   **Environment:** Node.
    -   **Build Command:** `npm install && npx prisma generate && npm run build` (Assumindo que `npm run build` compila o TypeScript para JavaScript).
    -   **Start Command:** `npx prisma migrate deploy && npm start`. O `migrate deploy` garante que as migrações sejam aplicadas a cada novo deploy.
4.  **Variáveis de Ambiente (em "Environment"):**
    -   `DATABASE_URL`: Cole a **"Internal Connection URL"** do seu banco de dados.
    -   `JWT_SECRET`: Crie um segredo forte e único para assinar os tokens JWT.
    -   `MERCADO_PAGO_ACCESS_TOKEN`: Seu token de produção do Mercado Pago.

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
  features    Json     // Armazena a lista de features como um JSON array
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
  orderId  String

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

## 4. Seeding de Dados Iniciais

A tabela `Service` **deve ser populada** com os dados dos serviços oferecidos. Crie um script de seed do Prisma (`prisma/seed.ts`) para inserir os dados iniciais. **A fonte da verdade para os dados dos serviços (nomes, preços, descrições, etc.) é o arquivo `constants.ts` do frontend.** Garanta que o seu script de seed reflita fielmente os dados deste arquivo, incluindo todas as atualizações de preços e novos serviços.

**Exemplo (`prisma/seed.ts`):**
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// IMPORTANTE: Os dados abaixo devem ser mantidos em sincronia com 'frontend/constants.ts'
const services = [
  {
    serviceId: 'qualified_search',
    name: 'Pesquisa Qualificada',
    description: 'Localizamos imóveis em nome de pessoas físicas ou jurídicas...',
    price: 49.90,
    duration: 'Até 5 dias úteis',
    features: [
      'Busca por CPF ou CNPJ',
      'Retorna até 10 matrículas por pesquisa',
      // ...
    ]
  },
  // ... adicione todos os outros serviços aqui
];

async function main() {
  console.log('Start seeding...');
  for (const service of services) {
    const s = await prisma.service.upsert({
      where: { serviceId: service.serviceId },
      update: service, // Garante que os dados sejam atualizados se já existirem
      create: service,
    });
    console.log(`Upserted service ${s.name}`);
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
```
Adicione `"prisma": { "seed": "ts-node prisma/seed.ts" }` ao seu `package.json`.

---

## 5. Guia de Implementação dos Endpoints da API

Crie rotas claras e protegidas por um middleware de autenticação JWT (exceto para rotas públicas de login/registro).

### Autenticação (`/api/auth`)

-   `POST /register`: Cria um novo cliente. Hash da senha com `bcrypt`.
-   `POST /login`: Autentica um usuário. Retorna um JWT.
-   `POST /google-signin`:
    -   **Recebe:** `{ "googleToken": "..." }`.
    -   **Ação:** Valide o token usando `google-auth-library`. Busque o usuário pelo e-mail. Se não existir, crie um novo (`role: CLIENT`, `isVerified: true`). Gere e retorne um JWT da **sua aplicação**.
-   `POST /apple-signin`:
    -   **Recebe:** `{ "appleToken": "..." }`.
    -   **Ação:** Valide o token contra as chaves públicas da Apple. Extraia o e-mail. Busque o usuário. Se não existir, crie um novo. Gere e retorne um JWT da **sua aplicação**.

### Outros Endpoints

-   **Serviços (`/api/services`):** `GET /` para listar todos.
-   **Pedidos (`/api/orders`):**
    -   `POST /`: Criar novo pedido (requer JWT de cliente).
    -   `GET /`: Listar pedidos. A rota deve suportar query parameters para filtragem, como `?status=IN_PROGRESS` e `?search=ORD-001`. Clientes veem apenas os seus pedidos, enquanto analistas e administradores podem ver todos (ou os atribuídos, no caso dos analistas). A busca por `search` deve ser uma busca parcial (case-insensitive) no ID do pedido.
    -   `GET /:id`: Obter detalhes de um pedido.
    -   `PUT /:id`: Atualizar um pedido (ex: atribuir analista, mudar status).
-   **Mensagens (`/api/orders/:id/messages`):**
    -   `POST /`: Enviar uma nova mensagem em um pedido.
-   **Pagamentos (`/api/payments`):**
    -   `POST /pix`: Cria uma ordem de pagamento PIX no Mercado Pago e retorna os dados.
    -   `POST /card`: Processa um pagamento com cartão (recebendo o `card_token` do frontend).
    -   `POST /webhook`: Rota para receber webhooks do Mercado Pago e atualizar o status do pedido no banco de dados.

**Este documento serve como a versão final de requisitos para o desenvolvimento do backend. Qualquer dúvida, consulte a equipe de frontend.**