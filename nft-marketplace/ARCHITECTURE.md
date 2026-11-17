# Arquitetura Técnica — NFT Marketplace

Este documento registra as decisões arquiteturais, contratos de interface (REST e WebSocket), estratégias de estado e políticas de consistência da aplicação.

---

## 1. Visão Geral e Estrutura de Pastas

A arquitetura adota o modelo **Feature-Driven** combinado com uma camada compartilhada (`shared`) e uma camada de simulação independente (`mocks`).

```text
src/
├── features/               # Domínios de negócio com componentes, hooks e rotas específicas
│   ├── auth/              # Login, cadastro, sessão e guardas de rota
│   ├── catalog/           # Catálogo, destaques, filtros, ordenação e detalhe do NFT
│   ├── cart/              # Carrinho persistente, edição de quantidades e cupons
│   ├── checkout/          # Formulário de colecionador, seleção de carteira e envio de pedido
│   ├── profile/           # Edição de perfil, avatar e alteração de senha
│   └── wallets/           # Gerenciamento de carteiras principal e secundária
├── shared/                 # Código transversal e reutilizável
│   ├── api/               # Cliente Axios, serviços REST tipados e interceptors
│   ├── realtime/          # Cliente Socket.IO, providers e reconciliadores
│   ├── types/             # Contratos TypeScript de domínio
│   ├── ui/                # Componentes base shadcn/ui e utilitários de tema
│   └── utils/             # Helpers de precisão decimal (ETH) e idempotência
├── mocks/                  # Camada de simulação com MSW
│   ├── fixtures/          # Dados determinísticos (NFTs, usuários, carteiras)
│   ├── handlers/          # Handlers REST por recurso
│   ├── scenarios/         # Cenários de rede/falhas configuráveis
│   └── socket/            # Emulação de eventos Socket.IO sobre MSW
└── routes/                 # Definição de rotas tipadas (TanStack Router)
```

---

## 2. Decisão de Precisão Numérica (ETH)

> [!IMPORTANT]
> **Nunca utilizar o tipo primitivo `number` do JavaScript para armazenar ou calcular valores em ETH.**
> O IEEE 754 de ponto flutuante introduz erros de arredondamento (ex: `0.1 + 0.2 !== 0.3`).

- **Transporte e Estado:** Todos os valores em ETH trafegam na rede e residem no estado exclusivamente como **`string` decimal** (ex: `"0.4500"`, `"1.2000"`).
- **Operações Aritméticas:** Todas as somas, subtrações e multiplicações utilizam a biblioteca `decimal.js` configurada com precisão de 28 dígitos e arredondamento half-up via utilitário em `src/shared/utils/currency.ts`:
  - `addEth(a, b)`
  - `subtractEth(a, b)`
  - `multiplyEth(price, quantity)`
  - `calculateDiscountEth(value, percentage)`
  - `compareEth(a, b)`
  - `formatEthDisplay(value)`

---

## 3. Especificação dos Contratos REST

A URL base padrão é `/api`. Todas as respostas de erro seguem o formato padronizado:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Descrição amigável do erro",
  "status": 400,
  "details": {
    "email": ["Formato de e-mail inválido"]
  },
  "retryable": false
}
```

### 3.1. Sessão e Autenticação

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/auth/register` | Cria uma nova conta de colecionador | 201 | 400, 409 (E-mail em uso) |
| `POST` | `/api/auth/login` | Autentica com e-mail e senha | 200 | 400, 401 (Credenciais inválidas) |
| `GET` | `/api/auth/session` | Retorna a sessão ativa a partir do token Bearer | 200 | 401 (Expirada / Inválida) |
| `POST` | `/api/auth/logout` | Invalida a sessão no servidor | 200 | - |

### 3.2. Catálogo e NFTs

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/nfts` | Listagem com busca, filtros (`category`, `minPrice`, `maxPrice`), ordenação e paginação | 200 | 400 |
| `GET` | `/api/nfts/:id` | Detalhes completos do NFT e suas edições | 200 | 404 (NFT inexistente) |

### 3.3. Favoritos

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/favorites` | Lista os NFTs favoritados pelo usuário autenticado | 200 | 401 |
| `POST` | `/api/favorites/:nftId` | Adiciona aos favoritos (suporta atualização otimista) | 200 | 401, 404 |
| `DELETE` | `/api/favorites/:nftId` | Remove dos favoritos | 200 | 401, 404 |

### 3.4. Carrinho de Compras

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/cart` | Retorna os itens do carrinho e cupom aplicado | 200 | - |
| `POST` | `/api/cart/items` | Adiciona item/edição ao carrinho | 200 | 400, 409 (Esgotado) |
| `PUT` | `/api/cart/items` | Atualiza quantidade do item | 200 | 400, 409 (Estoque insuficiente) |
| `DELETE` | `/api/cart/items/:nftId/:editionId` | Remove item do carrinho | 200 | - |
| `POST` | `/api/cart/coupon` | Aplica cupom de desconto | 200 | 400 (Inválido/Expirado) |
| `DELETE` | `/api/cart/coupon` | Remove cupom aplicado | 200 | - |

### 3.5. Cotação (Quote)

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/quote` | Revalida preços, estoque, cupom e calcula taxas | 200 | 400, 409 (Preço alterado/Esgotado) |

### 3.6. Pedidos (Checkout) & Idempotência

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/orders` | Criação idempotente do pedido (`Idempotency-Key` no header) | 201 (Novo) / 200 (Recuperado) | 400, 401, 409 (Conflito de chave / Dados divergentes) |
| `GET` | `/api/orders/:id` | Retorna o recibo com o **snapshot imutável** do pedido | 200 | 401, 404 |

### 3.7. Perfil do Colecionador

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/profile` | Dados do perfil do usuário autenticado | 200 | 401 |
| `PUT` | `/api/profile` | Atualiza nome, bio e avatar | 200 | 400, 401 |
| `POST` | `/api/profile/change-password` | Atualiza a senha | 200 | 400 (Senha atual incorreta), 401 |

### 3.8. Carteiras (Wallets)

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/wallets` | Lista carteiras do usuário | 200 | 401 |
| `POST` | `/api/wallets` | Cadastra nova carteira (principal ou secundária) | 201 | 400, 401 |
| `PUT` | `/api/wallets/:id` | Edita nome, tipo ou torna padrão | 200 | 400, 401, 404 |

---

## 4. Política de Idempotência em Pedidos

Para impedir cobranças repetidas causadas por duplo clique ou reenvios após timeout:
1. O cliente gera um UUID v4 via `generateIdempotencyKey()` e o anexa ao cabeçalho `Idempotency-Key` e no corpo do pedido.
2. O servidor (ou mock do MSW) armazena a chave atrelada ao `payloadFingerprint` gerado.
3. Se a **mesma chave** for reenviada com os **mesmos dados**, o servidor retorna o pedido já existente sem reexecutar a transação (Status 200).
4. Se a **mesma chave** for reutilizada com **dados divergentes**, o servidor rejeita imediatamente com `HTTP 409 Conflict`.

---

## 5. Contratos de Tempo Real (Socket.IO)

Todos os eventos WebSocket transportam identidade estável e versão incremental:

```typescript
export interface RealtimeEventPayload<T> {
  id: string;              // Identificador estável do evento
  resource: 'nft' | 'order';
  version: number;         // Versão sequencial do recurso
  userId?: string;         // Isolamento por usuário quando aplicável
  timestamp: string;
  data: T;
}
```

### 5.1. Transporte Utilizado e Limitações no Ambiente de Mocks

- **Transporte Utilizado:**
  - O cliente utiliza a biblioteca oficial `socket.io-client` configurada estritamente com `transports: ['websocket']`.
  - A camada de simulação intercepta conexões WebSocket no Service Worker através do módulo `ws` do MSW (`ws.link(/.*\/socket\.io\/.*/)`) combinado com o `@mswjs/socket.io-binding`.
  - Os pacotes trocados seguem fielmente o protocolo Engine.IO e Socket.IO (handshake inicial, ping/pong e frames `42["evento", payload]`).
  - O emissor em memória (`mockSocketEmitter`) transmite os eventos diretamente aos clientes conectados e reflete qualquer mutação ocorrida no banco de dados (`mockDb`), garantindo 100% de coerência entre as consultas REST e as notificações em tempo real.

- **Limitações no Ambiente de Mocks:**
  1. *Foco em WebSocket Puro:* O fallback legado via HTTP long-polling (`xhr-polling`) não é utilizado no mock, exigindo que o cliente se conecte com `transports: ['websocket']`.
  2. *Escopo de Conexões:* No navegador, os clientes conectados compartilham a instância do Service Worker. Em testes paralelos isolados pelo Playwright, cada aba do navegador opera seu próprio contexto limpo.
  3. *Reconexão e Desconexão:* Quedas de conexão e restabelecimento são controlados via `socket.disconnect()` e `socket.connect()` ou por interrupção do Service Worker nos testes E2E.
  4. *Sem Servidor Externo:* Graças à interceptação via Service Worker, o deploy de demonstração (Vercel/Netlify) executa Socket.IO client-side com total fidelidade sem depender de um servidor Node.js com portas TCP abertas na nuvem.

---

## 6. Estratégia de Cache e Isolamento Multi-Usuário

- **Chaves de Cache com `userId`:**
  Todas as queries de dados privados levam o identificador do usuário logado:
  `['favorites', userId]`, `['cart', userId]`, `['wallets', userId]`, `['profile', userId]`.
- **Limpeza no Logout:**
  No momento do logout ou troca de usuário, o cliente invoca `queryClient.clear()`, limpa o token de autenticação e encerra a conexão socket para evitar vazamento de memória ou dados entre contas.

---

## 7. Fluxo de Checkout e Máquina de Estados do Pedido

### 7.1. Etapas do Checkout (`/checkout`)
1. **Identificação e Carteira:** Coleta e validação dos dados do colecionador (nome, e-mail, telefone) e seleção de carteira/rede com verificação de saldo em ETH.
2. **Revisão:** Apresentação consolidada dos itens, valores, carteira e dados de emissão.
3. **Revalidação Pré-Envio:** Antes de autorizar o pedido, uma cotação nova é solicitada à API. Caso ocorra alteração de preços ou esgotamento de edições (`QuoteResponse.itemsVerified[i].changed`), o modal `PriceChangeModal` exige consentimento explícito do usuário antes do envio.

### 7.2. Máquina de Estados do Pedido
- **`pending`:** O pedido foi transmitido aos nós da rede. O cliente exibe status animado de processamento e aguarda a confirmação de bloco em tempo real via evento WebSocket `order.updated` ou polling redundante.
- **`confirmed` (Terminal):** Transação minerada e liquidada com sucesso. Gera recibo oficial com **snapshot imutável** das obras, transação e valores em ETH, e remove apenas os itens comprados do carrinho.
- **`failed` (Terminal):** Transação rejeitada na rede (ex: saldo insuficiente, taxa de gás ou recusa). A interface apresenta o motivo da recusa (`failureReason`) e **preserva integralmente os itens no carrinho** para nova tentativa.

### 7.3. Tratamento de Timeout e Resiliência
- Se a rede retornar `HTTP 408 Timeout` (cenário `order_timeout`), a chave de idempotência permanece intacta no cliente. O usuário pode clicar em "Tentar Novamente (Mesma Chave)" para recuperar ou finalizar o mesmo pedido de forma transparente, sem risco de cobrança duplicada.

---

## 8. Gestão de Perfil do Colecionador e Carteiras

### 8.1. Perfil e Identidade Visual (`/profile`)
- **Edição de Perfil:** Atualização de nome e biografia com validação de limites via Zod e persistência em `localStorage` através do mock MSW.
- **Seleção e Upload de Avatar:** Galeria de 5 avatares temáticos curados, suporte a URL externa e simulação de upload local via `FileReader` gerando Data URL.
- **Sincronização Global da Identidade:** Ao atualizar o perfil (`PUT /api/profile`), o método `updateUser()` do `AuthContext` propaga a alteração imediatamente para a `Navbar`, menus suspensos e cabeçalhos em toda a aplicação.
- **Segurança e Senha:** Validação de senha atual contra o banco mock, exigência de confirmação e verificação de diferença entre senha nova e senha antiga.

### 8.2. Carteiras de Custódia (`/wallets`)
- **Classificação:** Suporte a carteiras com classificação `primary` (Principal) e `secondary` (Secundária) em múltiplas redes blockchain.
- **Carteira Padrão (`isDefault`):** Ao eleger uma carteira como padrão, o mock e o cliente ajustam automaticamente as demais carteiras para `isDefault: false`.
- **Validação de Endereço:** Validação regex de formato de endereço público Ethereum (`0x...`).
- **Persistência das Alterações:** Todas as mutações (`POST /api/wallets` e `PUT /api/wallets/:id`) são gravadas no mock com persistência local e sobrevivem a refresh da aplicação.

---

## 9. Diretrizes de Responsividade e Acessibilidade (WCAG 2.1 AA)

### 9.1. Responsividade Multi-Dispositivo
- **Viewports de Avaliação:**
  - **Mobile (390px):** Layouts em coluna única, navegação lateral expansível (drawer), inputs com altura mínima de 44px para facilidade de toque, tabelas e resumos adaptados sem overflow horizontal (`overflow-x: hidden` e `max-width: 100vw`).
  - **Tablet (768px):** Grids em duas colunas, cabeçalhos compactos e filtros expansíveis.
  - **Desktop (1440px):** Composição completa fiel ao Figma, colunas duplas fixas (sticky) para resumos financeiros e catálogo em grid de 3 a 4 colunas.
- **Suporte a Zoom:** Todo o layout suporta zoom de até 200% sem quebra de conteúdo ou sobreposição de textos.

### 9.2. Acessibilidade e Semântica
- **Navegação por Teclado:** Foco visível consistente através de `:focus-visible` com anel de contraste (`outline: 2px solid hsl(var(--primary))`).
- **Atalho de Salto (Skip Link):** Link oculto "Pular para o conteúdo principal" ativado na primeira tabulação para acesso direto ao `<main id="main-content">`.
- **Controle de Diálogos e Modais:** Gerenciamento de foco, fechamento via tecla `Escape` e retenção de foco (`aria-modal="true"`) em modais de carteiras, drawer do carrinho e alertas de variação de cotação.
- **Formulários Acessíveis:** Todos os campos possuem labels vinculadas, estados `aria-invalid` e descrição de erros associada via `aria-describedby`.
- **Tempo Real e Feedback:** Banners de atualização em tempo real utilizam `role="status"` e `aria-live="polite"` para anúncio não-intrusivo em leitores de tela.
- **Movimento Reduzido:** Skeletons com efeito shimmer respeitam `prefers-reduced-motion: reduce`, desabilitando transições e animações contínuas.
