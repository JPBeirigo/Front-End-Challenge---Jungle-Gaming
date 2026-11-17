# NFT Marketplace (Projeto Finalizado)

Aplicação web de marketplace de NFTs desenvolvida como entrega do Front End Challenge, com foco em fidelidade visual, fluxos funcionais completos (catálogo, autenticação, favoritos, carrinho, checkout, pedidos, perfil e carteiras), atualização em tempo real, testes E2E e auditoria de performance.

> **Stack:** React + Vite + TypeScript, Tailwind CSS + shadcn/ui, TanStack Router/Query, React Hook Form + Zod, Axios, `decimal.js`, MSW, Socket.IO (cliente real com transporte WebSocket mockado via MSW) e Playwright.

## Visão geral

- **App:** `nft-marketplace/`
- **Mocks ativos por padrão** para desenvolvimento, preview e demonstração (`VITE_ENABLE_MOCKS=true`)
- **Persistência mockada:** `localStorage` (usuário, carrinho, favoritos, carteiras, perfil, pedidos/cenários conforme implementação dos handlers)
- **Tempo real:** eventos `nft.updated` e `order.updated` consumidos pelo cliente Socket.IO, com sincronização/reconciliação no app
- **Precisão monetária (ETH):** valores tratados como string decimal e cálculos com `decimal.js` (sem `number` para ETH)

## Pré-requisitos

- **Node.js** (recomendado LTS recente; validado localmente com Node `v26.13.1`)
- **npm** (validado com `11.20.0`)
- Navegador Chromium/Chrome para Playwright/Lighthouse (Playwright pode usar browsers instalados no cache; Lighthouse usou Chrome local no ambiente de auditoria)

## Setup

```bash
cd nft-marketplace
npm install
```

### Variáveis de ambiente

Arquivo de exemplo: `.env.example`

```env
# Mocks ativados por padrão para desenvolvimento e demonstração (true | false)
VITE_ENABLE_MOCKS=true
```

- Para rodar com mocks (padrão recomendado): manter `VITE_ENABLE_MOCKS=true` (ou usar `npm run dev:mocks`).
- `VITE_ENABLE_MOCKS=false` desativa o bootstrap de mocks no app (`src/mocks/browser.ts`), o que exige backend real compatível com os contratos.

## Comandos disponíveis

Executar dentro de `nft-marketplace/`:

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Sobe o app em desenvolvimento (Vite) |
| `npm run dev:mocks` | Sobe o app em desenvolvimento com `VITE_ENABLE_MOCKS=true` |
| `npm run build` | Type-check (`tsc -b`) + build de produção (Vite) |
| `npm run preview` | Serve o build de produção (Vite preview) |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |
| `npm run lint` | ESLint (`--max-warnings 0`) |
| `npm run test:e2e` | Executa testes Playwright (E2E + capturas visuais nos specs existentes) |
| `npm run test:e2e:ui` | Executa Playwright em modo UI |
| `npm run lighthouse` | Executa auditoria Lighthouse automatizada (3 medições por página/perfil, relatórios e sumários) |

> Observação: também existem scripts equivalentes na raiz do repositório que delegam para `nft-marketplace/`.

## Credenciais fictícias (mocks)

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Alexandre Silveira (User 1) | `alexandre@example.com` | `password123` |
| Beatriz Santos (User 2) | `beatriz@example.com` | `password123` |

Na tela de login há atalhos de preenchimento rápido para esses usuários (ambiente de demonstração com mocks).

## Seleção e reset de cenários (mocks)

Os cenários simulam latência, falhas HTTP/rede, expiração de sessão, conflitos, erros de cupom, alterações de preço/estoque no checkout e estados de pedido/pagamento.

### Cenários disponíveis

- `default` — operação normal
- `empty_catalog` — catálogo vazio
- `variable_latency` — latência variável/fora de ordem
- `network_failure` — falha de rede
- `http_500` — erro interno transitório
- `session_expired` — sessão expirada (401)
- `unauthorized` — acesso não autorizado (403)
- `register_conflict` — e-mail já cadastrado (409)
- `validation_error` — erro de validação
- `coupon_invalid` — cupom inválido
- `coupon_expired` — cupom expirado
- `price_changed_during_checkout` — preço alterado no checkout
- `edition_sold_out` — edição esgotada no checkout
- `order_timeout` — timeout no pedido (idempotência/retry)
- `payment_confirmed` — pagamento confirmado
- `payment_declined` — pagamento recusado
- `order_pending` — pedido pendente (confirmação posterior)

### Como selecionar

- **Query string:** adicionar `?scenario=<id>` na URL (ex.: `/?scenario=http_500`, `/?scenario=order_timeout`)
- **Persistência local:** o cenário ativo é armazenado no `localStorage` (`nft_mock_active_scenario`) e reaplicado
- **Seletor de cenário (UI):** disponível no app para alternar cenários durante a navegação (útil em demo)
- **Endpoint de controle (MSW):** `POST /api/mocks/scenario` com `{ "scenario": "<id>" }`

### Como resetar

- **Reset completo do banco mock + cenário:** `POST /api/mocks/reset`
- **Reset de cenário para padrão:** usar seletor/UI (quando aplicável) ou limpar `nft_mock_active_scenario` e recarregar
- **Reset de estado do navegador:** limpar `localStorage/sessionStorage` (os testes E2E fazem isso automaticamente antes de cada caso)

## Como reproduzir fluxos de falha (com mocks)

> Inicie a aplicação com mocks (`npm run dev:mocks` ou `npm run dev` com `VITE_ENABLE_MOCKS=true`).

### 1. Catálogo vazio
- Acesse `/?scenario=empty_catalog`
- Resultado esperado: estado vazio no catálogo/listagem.

### 2. Latência variável e estados de carregamento (skeletons)
- Acesse `/?scenario=variable_latency`
- Resultado esperado: skeletons/shimmer durante carregamento e renderização dos cards após resposta.

### 3. Falha de conexão / erro 500 com recuperação
- Acesse `/?scenario=network_failure` ou `/?scenario=http_500`
- Resultado esperado: feedback de erro no carregamento do catálogo e possibilidade de retry/recuperação (conforme fluxo da tela).

### 4. Sessão expirada
- Faça login com um usuário de teste.
- Aplique `session_expired` (query string, seletor ou endpoint de cenário).
- Navegue para rota privada (ex.: `/wallets`, `/profile`, `/checkout`).
- Resultado esperado: redirecionamento para login/reautenticação e tratamento de sessão expirada.

### 5. Conflito de cadastro
- Aplique `?scenario=register_conflict` e tente cadastrar.
- Resultado esperado: erro de e-mail já cadastrado (409) exibido no formulário.

### 6. Erros de validação
- Tente submeter formulários com dados inválidos (login/cadastro/perfil/senha/carteira) ou aplique `validation_error`.
- Resultado esperado: mensagens de validação acessíveis associadas aos campos e erros retornados pela API mockada quando aplicável.

### 7. Cupom inválido/expirado
- Adicione item ao carrinho e aplique cupom com cenário `coupon_invalid` ou `coupon_expired`.
- Resultado esperado: feedback de rejeição do cupom e resumo consistente com a cotação.

### 8. Alteração de preço/disponibilidade durante checkout
- Adicione um NFT ao carrinho e vá para `/checkout`.
- Aplique `price_changed_during_checkout` (ou `edition_sold_out`) antes da confirmação final/revalidação.
- Resultado esperado: interface informa divergência/cotação desatualizada e impede confirmação com dados antigos; usuário deve aceitar nova cotação/condição quando aplicável.

### 9. Pagamento recusado (falha terminal)
- Adicione item ao carrinho e vá ao checkout.
- Aplique `payment_declined` e confirme o pedido.
- Resultado esperado: tela de falha/transação não autorizada; carrinho preservado para nova tentativa.

### 10. Timeout no pedido com idempotência/retry
- Adicione item ao carrinho e aplique `order_timeout`.
- Confirme o pedido no checkout.
- Resultado esperado: erro de timeout com opção de reenvio usando a **mesma chave de idempotência**; ao recuperar, o pedido pode ser concluído sem duplicação.

### 11. Pedido pendente com atualização em tempo real
- Aplique `order_pending` e finalize o checkout.
- Resultado esperado: pedido entra em estado pendente e pode transicionar para confirmado via evento `order.updated` (tempo real) ou reconciliação/refresh, conforme implementação.

## Testes (Playwright)

- Configuração: `playwright.config.ts`
  - `testDir: ./e2e`
  - Projetos: `desktop-chromium` (1440x900) e `mobile-chromium` (390x844)
  - `webServer`: inicia `npm run dev -- --host 127.0.0.1 --port 3000` com `VITE_ENABLE_MOCKS=true`
  - Relatórios/diagnóstico: HTML (`playwright-report/`), `trace` e `screenshot/video` em falhas (`test-results/`)
- Specs principais: `e2e/01` a `e2e/13` + `e2e/smoke.spec.ts`
- Execução:

```bash
cd nft-marketplace
npm run test:e2e
# ou por projeto
npx playwright test --project=desktop-chromium
npx playwright test --project=mobile-chromium
```

## Performance e Lighthouse (Etapa 12)

- Runner automatizado: `scripts/run-lighthouse.mjs`
  - Build/preview SPA de `dist` com mocks
  - 3 medições por página/perfil
  - Saída em `lighthouse-reports/` (HTML/JSON por run + `summary.json` + `summary.md`)
- Páginas auditadas: `/` (Início) e `/nfts/nft_1` (Detalhe do NFT)
- Perfis: mobile e desktop
- Ferramenta: Lighthouse 12.8.2 (execução registrada)

### Resultados (medianas, 3 medições) — 2026-11-17T15:06:54.121Z

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| home | mobile | 56 | 97 | 100 | 100 | 7018.3 | 0.000 | 218.5 |
| home | desktop | 93 | 97 | 100 | 100 | 1492.3 | 0.000 | 8.0 |
| detail-nft | mobile | 55 | 100 | 100 | 100 | 7204.3 | 0.000 | 301.7 |
| detail-nft | desktop | 93 | 100 | 100 | 100 | 1421.0 | 0.017 | 6.5 |

**Observações:** metas atingidas em desktop (performance) e em várias categorias; mobile performance ficou abaixo da meta principalmente por LCP alto sob simulação mobile do Lighthouse. Justificativas e detalhes constam em `PLANO_IMPLEMENTACAO.md` (Etapa 12) e nos relatórios em `lighthouse-reports/`.

## Deploy

Para publicação (ex.: Vercel/Netlify/Cloudflare Pages):

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Variável de ambiente:** `VITE_ENABLE_MOCKS=true` (para demo com mocks no ambiente publicado)
- **SPA rewrite:** configurar fallback para `index.html` para suportar refresh/acesso direto em rotas (ex.: `/nfts/:id`, `/orders/:id`, `/checkout`, `/profile`, `/wallets`)

> **URL pública (Vercel):** https://nft-marketplace-pi-ashy.vercel.app  
> Deploy realizado via Vercel CLI (conta autenticada). Acesso direto e refresh de rotas validados. Mocks e Socket.IO (transporte WebSocket mockado) funcionando.

## Documentação complementar

- `ARCHITECTURE.md` — arquitetura, contratos REST/eventos, decisões de estado, sessão, carrinho, idempotência, realtime e acessibilidade/responsividade
- `../PLANO_IMPLEMENTACAO.md` — plano de implementação por etapas e status
- `../README(1).md` — enunciado/requisitos do desafio
- `lighthouse-reports/` — relatórios Lighthouse (HTML/JSON) e sumários gerados na Etapa 12
- `playwright-report/` e `test-results/` — artefatos de execução dos testes Playwright (quando gerados)

## Estrutura (resumo)

```text
nft-marketplace/
├── e2e/                    # Testes Playwright
├── lighthouse-reports/     # Relatórios e sumários Lighthouse
├── public/                 # Assets públicos e service worker do MSW
├── scripts/                # Scripts utilitários (Lighthouse, preview SPA)
├── src/
│   ├── features/           # Domínios (auth, catalog, cart, checkout, profile, wallets)
│   ├── mocks/              # MSW (handlers, db, fixtures, scenarios, socket)
│   ├── routes/             # Rotas TanStack Router
│   └── shared/             # API, realtime, types, ui, utils
├── playwright.config.ts
└── vite.config.ts
```
