# Guia Completo de Arquitetura e Desenvolvimento do Backend - Edari

## 1. Visão Geral

Este documento descreve a API RESTful necessária para alimentar a aplicação Edari. O frontend foi atualizado para consumir endpoints reais.

**URL Base (Desenvolvimento):** `http://localhost:3000/api`
**URL Base (Produção - Render):** `https://api.edari.com.br/api`

---

## 2. Contrato de API (Endpoints Obrigatórios)

O backend deve implementar as seguintes rotas para que o frontend funcione corretamente.

### Autenticação (`/auth`)

*   **`POST /auth/login`**
    *   **Body:** `{ email: string, role: string, password: string }`
    *   **Response:** `{ token: string, user: UserObject }`
    *   **Obs:** Deve retornar JWT Token.

*   **`POST /auth/register`**
    *   **Body:** `{ name, email, cpf, birthDate, address, password }`
    *   **Response:** `201 Created`

*   **`GET /auth/me`**
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `UserObject` (Dados do usuário atual)

*   **`POST /auth/verify-email`**
    *   **Body:** `{ email: string }`
    *   **Action:** Marcar usuário como `isVerified: true`.

*   **`POST /auth/google` e `/auth/apple`**
    *   **Body:** `{ token: string }`
    *   **Action:** Validar token com provedor, criar/buscar usuário, retornar JWT Edari.

### Usuários (`/users`)

*   **`PATCH /users/:id`**
    *   **Auth:** Required
    *   **Body:** `{ cpf?: string, address?: string, ... }`
    *   **Response:** `UserObject` (atualizado)

### Pedidos (`/orders`)

*   **`GET /orders`**
    *   **Auth:** Required
    *   **Behavior:**
        *   Se `Role === CLIENT`: Retorna apenas pedidos do usuário.
        *   Se `Role === ANALYST`: Retorna pedidos atribuídos + pedidos sem analista.
        *   Se `Role === ADMIN`: Retorna todos.
    *   **Response:** `Array<OrderObject>`

*   **`POST /orders`**
    *   **Auth:** Required (Client)
    *   **Body:** `{ serviceId, description, isUrgent, propertyType, ... }`
    *   **Response:** `OrderObject`

*   **`PUT /orders/:id`**
    *   **Auth:** Required (Analyst/Admin/Client)
    *   **Body:** Campos a atualizar (status, total, messages).
    *   **Response:** `OrderObject`

*   **`POST /orders/:id/messages`**
    *   **Body:** `{ content: string, attachmentId?: string }`
    *   **Action:** Adiciona mensagem ao pedido.

### Pagamentos (`/payments`)

*   **`POST /payments/pix`**
    *   **Body:** `{ serviceId, amount, userId }`
    *   **Integration:** Mercado Pago API (Criar PIX).
    *   **Response:** `{ qrCodeUrl: string, pixCopyPaste: string }`

*   **`POST /payments/card`**
    *   **Body:** `{ cardToken, amount, installments, payerEmail, serviceId }`
    *   **Integration:** Mercado Pago API (Processar Cartão).
    *   **Response:** `{ success: true, orderId: string }`

### Cartórios (`/registries`)

*   **`GET /registries`**
    *   **Query Params:** `?city=X&state=Y&type=civil|imoveis`
    *   **Response:** `{ registries: ["Cartório 1", "Cartório 2"] }`
    *   **Logic:** Consultar base de dados interna ou API externa de cartórios.

### Uploads (`/uploads`)

*   **`POST /uploads`**
    *   **Body:** `Multipart/Form-Data` (campo `file`)
    *   **Action:** Upload para Amazon S3 bucket `edari-docs`.
    *   **Response:** `{ id, name, size, type, url }`

---

## 3. Tecnologias Recomendadas

-   **Runtime:** Node.js + Express
-   **Language:** TypeScript
-   **Database:** PostgreSQL + Prisma ORM
-   **Storage:** AWS S3
-   **Payment:** Mercado Pago SDK
-   **Deploy:** Render.com

