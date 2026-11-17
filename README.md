# NFT Marketplace — Front End Challenge

Implementação do desafio de frontend de um marketplace de NFTs, com aplicação React + TypeScript, mocks (MSW + Socket.IO), testes E2E (Playwright) e auditorias Lighthouse.

- **Aplicação principal:** [`nft-marketplace/`](./nft-marketplace/)
- **Documentação de uso/execução:** [`nft-marketplace/README.md`](./nft-marketplace/README.md)
- **Arquitetura e decisões técnicas:** [`nft-marketplace/ARCHITECTURE.md`](./nft-marketplace/ARCHITECTURE.md)
- **Plano de implementação (etapas/status):** [`PLANO_IMPLEMENTACAO.md`](./PLANO_IMPLEMENTACAO.md)
- **Enunciado do desafio:** [`README(1).md`](./README%281%29.md)

## URL pública (deploy)

Aplicação publicada no Vercel: **https://nft-marketplace-pi-ashy.vercel.app**
Acesso direto e refresh de rotas validados; mocks e Socket.IO funcionando.

## Início rápido

```bash
cd nft-marketplace
npm install
npm run dev:mocks
```

Credenciais fictícias (mocks):
- `alexandre@example.com` / `password123`
- `beatriz@example.com` / `password123`

## Stack

React + Vite + TypeScript (strict), Tailwind CSS + shadcn/ui, TanStack Router/Query, React Hook Form + Zod, Axios, `decimal.js`, MSW, Socket.IO (`socket.io-client`), Playwright, Lighthouse.

## Comandos (raiz — delegam para `nft-marketplace/`)

- `npm run dev` — desenvolvimento (Vite)
- `npm run dev:mocks` — desenvolvimento com mocks (`VITE_ENABLE_MOCKS=true`)
- `npm run build` — type-check (`tsc -b`) + build de produção
- `npm run preview` — serve o build de produção
- `npm run typecheck` — verificação de tipos (`tsc --noEmit`)
- `npm run lint` — ESLint (`--max-warnings 0`)
- `npm run test:e2e` — testes Playwright (E2E + regressão visual)
- `npm run lighthouse` — auditoria Lighthouse (3 medições por página/perfil)

## Variáveis de ambiente

Arquivo de exemplo: `nft-marketplace/.env.example`

```env
VITE_ENABLE_MOCKS=true   # Mocks ativos por padrão (true | false)
```

`VITE_ENABLE_MOCKS=false` desativa os mocks e exige backend real compatível com os contratos.

## Cenários de mock e reset

Cenários disponíveis (seleção via `?scenario=<id>`, seletor UI, `localStorage` (`nft_mock_active_scenario`) ou `POST /api/mocks/scenario`):

`default`, `empty_catalog`, `variable_latency`, `network_failure`, `http_500`, `session_expired`, `unauthorized`, `register_conflict`, `validation_error`, `coupon_invalid`, `coupon_expired`, `price_changed_during_checkout`, `edition_sold_out`, `order_timeout`, `payment_confirmed`, `payment_declined`, `order_pending`.

Reset: `POST /api/mocks/reset` ou limpar `localStorage`/`sessionStorage` e recarregar.

## Reprodução de fluxos de falha

1. **Catálogo vazio:** `/?scenario=empty_catalog`
2. **Latência/skeletons:** `/?scenario=variable_latency`
3. **Falha de conexão/500:** `/?scenario=network_failure` ou `/?scenario=http_500`
4. **Sessão expirada:** login → aplicar `session_expired` → navegar para rota privada
5. **Conflito de cadastro:** `/?scenario=register_conflict` + cadastro
6. **Erros de validação:** submeter formulários inválidos ou `validation_error`
7. **Cupom inválido/expirado:** carrinho + `coupon_invalid`/`coupon_expired`
8. **Preço alterado no checkout:** `/checkout` + `price_changed_during_checkout`/`edition_sold_out`
9. **Pagamento recusado:** checkout + `payment_declined`
10. **Timeout/idempotência:** checkout + `order_timeout`
11. **Pedido pendente/realtime:** checkout + `order_pending`

## Contratos REST e eventos

Documentados em [`nft-marketplace/ARCHITECTURE.md`](./nft-marketplace/ARCHITECTURE.md). Recursos: Sessão/conta, NFTs, Favoritos, Carrinho, Cotação, Pedidos (idempotente), Perfil, Carteiras. Eventos Socket.IO: `nft.updated`, `order.updated` (com `id`, `resource`, `version`, `userId`).

## Performance (Lighthouse)

Auditoria em `/` e `/nfts/nft_1`, perfis mobile e desktop, 3 medições, medianas. Resultados em `nft-marketplace/lighthouse-reports/`. Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90. (Atingidas: A11y 97–100, BP 100, SEO 100, Perf desktop 91–93; mobile 56–58 por LCP ~7s — justificado pela ativação do MSW.)

## Testes (Playwright)

13 specs (01–13) + smoke, cobrindo os 12 cenários obrigatórios + regressão visual, em Chromium (desktop 1440×900 e mobile 390×844). Relatório HTML e traces em `playwright-report/` e `test-results/`.

## Deploy

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Variável de ambiente:** `VITE_ENABLE_MOCKS=true`
- **SPA rewrite:** fallback para `index.html`
- **URL pública (Vercel):** https://nft-marketplace-pi-ashy.vercel.app

## Limitações e decisões

- Imagens e fontes: self-hosted (imagens) + Google Fonts com preload (fonte). Contraste, touch targets e aria corrigidos para Lighthouse.
- Performance mobile (< 90) limitada pela ativação do service worker do MSW e imagem LCP dinâmica; mitigável em produção com mocks desligados.
- Desvios do Figma documentados em `ARCHITECTURE.md` e `PLANO_IMPLEMENTACAO.md`.

## Estrutura

```text
nft-marketplace/
├── e2e/                    # Testes Playwright
├── lighthouse-reports/     # Relatórios Lighthouse
├── public/                 # Assets e service worker MSW
├── scripts/                # Lighthouse, preview SPA
├── src/
│   ├── features/           # auth, catalog, cart, checkout, profile, wallets
│   ├── mocks/              # MSW (handlers, db, fixtures, scenarios, socket)
│   ├── routes/             # TanStack Router
│   └── shared/             # api, realtime, types, ui, utils
├── ARCHITECTURE.md
└── README.md
```

Consulte [`nft-marketplace/README.md`](./nft-marketplace/README.md) para detalhes completos de cenários, reprodução de falhas, testes e deploy.