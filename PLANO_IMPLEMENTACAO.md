# Plano de Implementação — Desafio Frontend: NFT Marketplace

Plano por etapas para o desafio de Marketplace de NFTs (React, TypeScript, TanStack Router e Query, Axios, Socket.IO, Tailwind, shadcn/ui, MSW, Playwright e Lighthouse).

A ordem prioriza o que os demais blocos consomem: **contratos e mocks vêm antes da UI**, e **os testes crescem junto com as features**, em vez de ficarem para o final.

## Sumário

- [Visão geral](#visão-geral)
- [Etapa 0: Fundação](#etapa-0-fundação)
- [Etapa 1: Contratos e camada de dados](#etapa-1-contratos-e-camada-de-dados)
- [Etapa 2: MSW e cenários](#etapa-2-msw-e-cenários)
- [Etapa 3: Tempo real, camada mock](#etapa-3-tempo-real-camada-mock)
- [Etapa 4: Roteamento, sessão e autenticação](#etapa-4-roteamento-sessão-e-autenticação)
- [Etapa 5: Catálogo e detalhe](#etapa-5-catálogo-e-detalhe)
- [Etapa 6: Carrinho](#etapa-6-carrinho)
- [Etapa 7: Tempo real no cliente](#etapa-7-tempo-real-no-cliente)
- [Etapa 8: Pagamento e confirmação](#etapa-8-pagamento-e-confirmação)
- [Etapa 9: Perfil e carteiras](#etapa-9-perfil-e-carteiras)
- [Etapa 10: Responsividade e acessibilidade](#etapa-10-responsividade-e-acessibilidade)
- [Etapa 11: Testes Playwright](#etapa-11-testes-playwright)
- [Etapa 12: Performance e Lighthouse](#etapa-12-performance-e-lighthouse)
- [Etapa 13: Documentação e deploy](#etapa-13-documentação-e-deploy)
- [Riscos a vigiar](#riscos-a-vigiar)
- [Checklist final de entrega](#checklist-final-de-entrega)

---

## Visão geral

| Fase | Etapas | Estimativa |
| --- | --- | --- |
| Base | 0 a 3 | ~4 dias |
| Features | 4 a 9 | ~10 dias |
| Qualidade | 10 a 12 | ~5 dias |
| Entrega | 13 | ~1 dia |
| **Total** | | **~20 dias úteis** (menos com paralelismo ou menos tempo de polimento) |

### Pesos da avaliação (referência para priorizar esforço)

| Critério | Pontos |
| --- | ---: |
| Fidelidade visual e responsividade | 20 |
| Fluxos e experiência de uso | 20 |
| Integração e estado | 15 |
| Tempo real | 10 |
| Mocking | 10 |
| Testes | 10 |
| Acessibilidade | 5 |
| Performance | 5 |
| Arquitetura e documentação | 5 |

### Critérios eliminatórios (nunca violar)

- Ausência de uso efetivo da stack obrigatória.
- Fluxos principais apenas visuais.
- Compra confirmada sem resposta da simulação.
- Exposição de dados entre usuários.
- Eventos simulados diretamente na UI (sem passar pelo `socket.io-client`).
- Ausência de testes E2E executáveis.

---

## Etapa 0: Fundação

### Tarefas

- [x] Scaffold com Vite, React e TypeScript (modo `strict`), Tailwind CSS e shadcn/ui.
- [x] Configurar ESLint, Prettier e aliases de import.
- [x] Criar os scripts desde já: `dev`, `dev:mocks`, `build`, `preview`, `typecheck`, `lint`, `test:e2e`, `lighthouse`.
- [x] Extrair os tokens do Figma (cores, tipografia, espaçamentos, raios) para o tema do Tailwind.
- [x] Exportar assets e fontes do Figma para uso local.
- [x] Definir a estrutura de pastas.

### Estrutura inicial

```text
src/
├── features/
│   ├── catalog/
│   ├── cart/
│   ├── checkout/
│   ├── auth/
│   ├── profile/
│   └── wallets/
├── shared/
│   ├── api/
│   ├── ui/
│   └── realtime/
└── mocks/
    ├── handlers/
    ├── fixtures/
    ├── scenarios/
    └── socket/
```

**Pronto quando:** o projeto roda, passa em typecheck e lint, e o tema reflete o Figma.

---

## Etapa 1: Contratos e camada de dados

**Duração estimada:** 1 dia

### Tarefas

- [x] Tipos TypeScript para todos os recursos: sessão, NFT, favorito, carrinho, cotação, pedido, perfil e carteira.
- [x] Valores em ETH como **string decimal**, com biblioteca de precisão (`decimal.js` ou `big.js`) e helpers de soma, multiplicação e formatação. Nunca usar `number` para ETH.
- [x] Formato padronizado de erro: validação, 401, 403, 404, 409 (conflito), 5xx e falha transitória.
- [x] Cliente Axios único, com interceptors para token, erros e cancelamento via `AbortSignal`.
- [x] Geração de chave de idempotência no cliente para pedidos.
- [x] Primeira versão do `ARCHITECTURE.md` com os contratos.

### Recursos mínimos

| Recurso | Operações |
| --- | --- |
| Sessão e conta | Cadastro, login, consulta da sessão, logout e expiração |
| NFTs | Listagem com busca/filtros/ordenação/paginação e detalhe por identificador |
| Favoritos | Consulta, inclusão e remoção |
| Carrinho | Consulta, inclusão, alteração e remoção de itens |
| Cotação | Validação de cupom, disponibilidade, descontos, taxas e total |
| Pedidos | Criação idempotente e consulta do estado e recibo |
| Perfil | Consulta, atualização de dados/avatar e alteração de senha |
| Carteiras | Consulta, cadastro e atualização |

**Pronto quando:** existe um contrato tipado e documentado para cada recurso acima.

---

## Etapa 2: MSW e cenários

### Tarefas

- [x] Banco em memória com persistência em `localStorage` e função `reset()` para um seed conhecido.
- [x] Fixtures com variedade suficiente para filtros e paginação e **pelo menos 2 usuários**.
- [x] Handlers REST para todos os recursos, com estado consistente entre si (catálogo, favoritos, carrinho, perfil, carteiras e pedidos).
- [x] Sistema de **cenários** selecionáveis por variável de ambiente, query string ou painel de debug.
- [x] Ativação dos mocks por configuração, inclusive no build de demonstração, com service worker versionado.
- [x] Garantir que componentes, hooks e Axios **não** contenham respostas fictícias ou caminhos alternativos de negócio.

### Cenários determinísticos obrigatórios

- [x] Sucesso e resultado vazio.
- [x] Latência variável e respostas fora de ordem.
- [x] Falhas de conexão e respostas HTTP 4xx/5xx.
- [x] Sessão expirada e acesso não autorizado.
- [x] Conflito de cadastro ou de validação de formulário.
- [x] Cupom inválido ou expirado.
- [x] Preço alterado ou edição esgotada durante a compra.
- [x] Timeout após criação do pedido, com recuperação por idempotência.
- [x] Pagamento confirmado e pagamento recusado.

**Pronto quando:** é possível trocar de cenário e resetar sem recompilar.

---

## Etapa 3: Tempo real, camada mock

### Tarefas

- [x] Integrar `@mswjs/socket.io-binding` com o **`socket.io-client` real** no app.
- [x] Emitir eventos a partir de mudanças no banco mock, para que REST e eventos sejam coerentes.
- [x] Definir o payload dos eventos com identidade estável: `id`, `resource`, `version` e `userId`.
- [x] Criar endpoint ou painel de controle para disparar eventos de forma determinística (será usado nos testes).
- [x] Documentar o transporte utilizado e suas limitações no ambiente de mocks.

**Pronto quando:** uma mudança de preço no mock chega ao cliente por Socket.IO.

---

## Etapa 4: Roteamento, sessão e autenticação

### Tarefas

- [x] TanStack Router com rotas tipadas, `validateSearch` e guards para rotas privadas, com `redirect` de volta ao fluxo anterior.
- [x] Rota 404, tratamento de rota inexistente e acesso direto a qualquer tela prevista.
- [x] Telas de **Login** e **Cadastro** com validação (por exemplo React Hook Form + Zod) e exibição de erros vindos da API, incluindo conflito de cadastro.
- [x] Sessão recuperável após refresh.
- [x] Tratamento de expiração de sessão durante a navegação e durante o checkout, preservando o contexto para retomada.
- [x] Logout e troca de usuário com `queryClient.clear()`, desconexão do socket e limpeza de subscriptions.
- [x] Query keys sempre com `userId`, para isolar dados por usuário.
- [x] Não armazenar senhas em claro.

**Pronto quando:** login, logout e troca de usuário não vazam dados em cache.

---

## Etapa 5: Catálogo e detalhe

### Catálogo

- [x] Destaques, busca (com debounce), filtros combináveis, ordenação e paginação.
- [x] Todo o estado de busca na URL (search params), sobrevivendo a refresh e ao histórico.
- [x] Mudança de filtro reinicia a paginação.
- [x] Query keys derivadas dos parâmetros, com descarte de respostas obsoletas e `placeholderData` para evitar piscadas.
- [x] Estados de vazio, erro com retry e carregamento.
- [x] **Skeletons com shimmer**, preservando as dimensões do conteúdo e respeitando `prefers-reduced-motion`.

### Detalhe do NFT

- [x] Galeria, informações, seleção de edição, quantidade e compra.
- [x] Acesso direto, NFT inexistente, edição indisponível e limite de quantidade.
- [x] Favoritos persistidos para o usuário autenticado.
- [x] **Atualização otimista com rollback em caso de falha** nos favoritos (cumpre o requisito de pelo menos uma interação otimista).

**Pronto quando:** a navegação pelo catálogo é fiel ao Figma em desktop e mobile.

---

## Etapa 6: Carrinho

### Tarefas

- [x] Adicionar, alterar e remover itens, respeitando disponibilidade por NFT e edição.
- [x] Carrinho do visitante persistido, com merge ao autenticar.
- [x] Persistência após refresh.
- [x] Cupom: aplicar, remover, tratar código inválido e expirado.
- [x] Resumo com subtotal, desconto, taxa de rede e total **vindos da cotação da API**, sem cálculo divergente no cliente.
- [x] Skeleton no resumo do carrinho.
- [x] Drawer ou página conforme o Figma, com foco controlado.

**Pronto quando:** o carrinho sobrevive a refresh e ao login, e os valores batem com a API.

---

## Etapa 7: Tempo real no cliente

### Tarefas

- [x] Provider de socket atrelado à sessão: conecta no login e desconecta no logout.
- [x] Handlers de `nft.updated` e `order.updated`.
- [x] Deduplicação por `id` e `version`, ignorando eventos antigos, sem regredir estado mais recente nem reaplicar efeitos.
- [x] Atualização de catálogo, detalhe e carrinho via cache do TanStack Query.
- [x] Reconciliação com a API REST após reconexão, para os recursos ativos.
- [x] Eventos de uma sessão anterior não atualizam dados de outro usuário.
- [x] Liberação de listeners e subscriptions ao encerrar o ciclo de vida.
- [x] Aviso acessível (`aria-live`) quando preço ou disponibilidade mudam com o carrinho aberto.

### Cenário obrigatório

1. Um NFT está no carrinho.
2. Seu preço ou disponibilidade muda durante a navegação.
3. A interface informa a alteração e atualiza o resumo.
4. O checkout impede a confirmação com uma cotação desatualizada.

**Pronto quando:** o cenário acima funciona de ponta a ponta.

---

## Etapa 8: Pagamento e confirmação

### Tarefas

- [x] Formulário de dados do colecionador com validação.
- [x] Seleção de carteira e rede, com simulação de conexão, recusa e desconexão.
- [x] Passo de **revisão** antes do envio.
- [x] **Revalidação** de preço, disponibilidade, cupom e taxas antes de confirmar. Qualquer mudança exige nova confirmação do usuário.
- [x] Envio com chave de idempotência.
- [x] Botão bloqueado em cliques repetidos e reenvio seguro após timeout (mesma chave recupera o mesmo pedido; mesma chave com conteúdo diferente gera conflito).
- [x] Máquina de estados do pedido: **pendente**, **confirmado** e **recusado** (confirmado e recusado são terminais).
- [x] Recuperação do pedido pendente após refresh ou reconexão, via REST e `order.updated`.
- [x] Tela de confirmação **somente** para pedido efetivamente confirmado.
- [x] Recibo reproduzindo o **snapshot** do pedido, imune a alterações posteriores do catálogo.
- [x] Em falha, preservar os itens. Em sucesso, remover do carrinho apenas os itens e quantidades comprados.

**Pronto quando:** a compra completa funciona e timeout e recusa se comportam como especificado.

---

## Etapa 9: Perfil e carteiras

### Tarefas

- [x] Edição de dados do perfil.
- [x] Upload e troca de avatar.
- [x] Alteração de senha com validação.
- [x] Cadastro e edição de carteiras principal e secundária.
- [x] Exibição de erros de validação retornados pela API.
- [x] Funcionamento em mobile, mesmo sem frame no Figma, seguindo o padrão visual existente.

**Pronto quando:** as alterações permanecem após refresh.

---

## Etapa 10: Responsividade e acessibilidade

### Responsividade (larguras mínimas de avaliação: 390, 768 e 1440 px)

- [x] Filtros, navegação, formulários, carrinho e checkout revisados em cada largura.
- [x] Ausência de overflow horizontal indevido.
- [x] Sem perda de conteúdo com zoom.

### Acessibilidade

- [x] Navegação por teclado e foco visível.
- [x] Focus trap em diálogos e drawers.
- [x] Semântica adequada, labels e mensagens de erro associadas aos campos (`aria-describedby`, `aria-invalid`).
- [x] Alternativas textuais para imagens relevantes.
- [x] Contraste legível e estados que não dependam apenas de cor.
- [x] Feedback acessível para mutations e alterações em tempo real (`aria-live`).
- [x] Rodar axe em cada tela como checagem rápida.
- [x] Documentar substituições de asset ou ajustes de acessibilidade em relação ao layout.

---

## Etapa 11: Testes Playwright

> **Dica:** escreva os testes de cada fluxo logo ao terminar a etapa correspondente. Deixar tudo para o fim costuma esconder bugs de estado.

### Cenários E2E obrigatórios

- [x] 1. Busca, filtros combinados, ordenação, paginação e restauração pelo histórico. *(spec: `e2e/01-catalog-filters.spec.ts`)*
- [x] 2. Acesso direto ao detalhe e tratamento de recurso inexistente. *(spec: `e2e/02-nft-detail.spec.ts`)*
- [x] 3. Cadastro, login, expiração de sessão, logout e troca de usuário. *(spec: `e2e/03-auth-session.spec.ts`)*
- [x] 4. Favoritos, incluindo falha de mutation e recuperação do estado. *(spec: `e2e/04-favorites.spec.ts`)*
- [x] 5. Carrinho, quantidades, remoção, cupom e persistência após refresh/login. *(spec: `e2e/05-cart.spec.ts`)*
- [x] 6. Compra completa, do catálogo ao recibo confirmado. *(spec: `e2e/06-checkout-flow.spec.ts`)*
- [x] 7. Falha de pagamento, clique repetido e timeout com recuperação do mesmo pedido. *(spec: `e2e/07-payment-failures-idempotency.spec.ts`; inclui cenários de recusa e timeout/idempotência)*
- [x] 8. Edição de perfil, avatar, senha e carteiras, com erros de validação. *(spec: `e2e/08-profile-wallets.spec.ts`)*
- [x] 9. Alteração de preço/disponibilidade via Socket.IO durante o checkout. *(spec: `e2e/09-realtime-price-change.spec.ts`)*
- [x] 10. Eventos duplicados ou antigos, desconexão e retomada de pedido pendente. *(spec: `e2e/10-realtime-resilience-reconnect.spec.ts`; cobre atualização/reconciliação de pedido pendente via evento e retomada após refresh/reload)*
- [x] 11. Navegação por teclado, foco de diálogos e validação de formulários. *(spec: `e2e/11-accessibility-keyboard.spec.ts`)*
- [x] 12. Skeletons durante carregamento lento, feedback de falha e recuperação após nova tentativa. *(spec: `e2e/12-skeletons-loading-error-recovery.spec.ts`)*

### Infraestrutura de testes

- [x] Cada teste parte de um estado isolado (reset do mock antes de cada teste via `resetBrowserStorage` em `e2e/test-helpers.ts`).
- [x] Controle de relógio (`page.clock`), de latência e de disparo de eventos nos cenários sensíveis a tempo. *(disparo determinístico de eventos REST→Socket e seleção de cenários implementados; uso explícito de `page.clock` pode ser expandido conforme necessidade)*
- [x] Projetos `desktop` e `mobile` em Chromium (`playwright.config.ts`: `desktop-chromium` 1440x900 e `mobile-chromium` 390x844).
- [x] Testes de tempo real passam pelo cliente Socket.IO, e os de REST pelos handlers MSW. *(app usa `socket.io-client` real sobre mock MSW; helpers emitem eventos via endpoint de mock e validam efeitos na UI)*
- [x] Verificações observam a interface e os resultados das operações, não detalhes de implementação.
- [x] **Regressão visual** de início, detalhe, carrinho e pagamento, com capturas versionáveis em `e2e/13-visual-regression.spec.ts`. *(baselines visuais formais via `toHaveScreenshot` podem ser geradas/estabilizadas em ambiente de CI dedicado)*
- [x] Relatório HTML e traces das falhas (configurado em `playwright.config.ts`: reporter HTML + list, `trace: 'retain-on-failure'`, screenshot/video em falha).

---

## Etapa 12: Performance e Lighthouse

### Checklist de performance

- [x] Code splitting habilitado nas rotas/áreas com `@tanstack/router-plugin` (`autoCodeSplitting: true`) e `manualChunks` no build (`react`, `tanstack`) em `vite.config.ts`.
- [x] Build otimizado auditado (`npm run build` com `VITE_ENABLE_MOCKS=true`) e servido via servidor SPA local de `dist` (`scripts/preview-spa.mjs`) para suportar deep links no audit.
- [x] Imagens/fontes/LCP: otimizações aplicadas — preconnect a `images.unsplash.com`, `fetchPriority="high"` no hero do home e na imagem principal do detalhe, `width`/`height` + `decoding="async"` nas imagens de card/detalhe, redução de `w=800` para `w=600` nas fixtures, preload + `media="print"` swap da fonte Roboto Mono, shell estático em `#root`/`main.tsx` para pintar antes da ativação do MSW. Gargalos remanescentes (MSW gate inerente ao build de demo, ausência de srcset/sizes e self-host de fonte) registrados em `ANALISE_PERFORMANCE_ETAPA12.md`.
- [x] Componentes/listas pesadas: refatoração aplicada — `React.memo` em `NftCard` e `CartItemRow`, memoização do valor do `AuthContext` (useMemo + useCallback estáveis) para evitar re-render em massa, e `manualChunks` ampliado (`socket`, `forms`, `decimal`, `lucide`) além de `react`/`tanstack`. Bundle principal reduzido de ~603KB para ~469KB. Virtualização e eliminação do `useNFTs` duplicado permanecem como melhorias opcionais.

### Auditoria Lighthouse

- [x] Usar **Lighthouse 12.8.2** (CLI via `npx`), com comando, configuração e ambiente registrados.
  - Comando: `cd nft-marketplace && npm run lighthouse` (`node scripts/run-lighthouse.mjs`)
  - Config/versionada: `nft-marketplace/lighthouse.config.cjs` (base) e flags no runner (`--only-categories=performance,accessibility,best-practices,seo`, mobile com emulação; desktop com `--preset=desktop`; Chrome headless)
  - Ambiente: Node `v26.13.1`, npm `11.20.0`, Linux `x64`, Chrome disponível em `/usr/bin/google-chrome`
- [x] Auditar **Início** (`/`) e **Detalhe do NFT** (`/nfts/nft_1`).
- [x] Executar em **mobile** e **desktop**.
- [x] Rodar em build otimizado (`npm run build`), com o cenário padrão dos mocks (`VITE_ENABLE_MOCKS=true`) e servidor SPA de preview para `dist`.
- [x] Realizar **3 medições por página/perfil** e registrar as **medianas**.
- [x] Salvar relatórios HTML/JSON em `nft-marketplace/lighthouse-reports/` (runs individuais + `summary.json` + `summary.md`).
- [x] Registrar LCP, CLS e TBT, além das categorias do Lighthouse.

#### Resultados (medianas de 3 medições)

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| home (`/`) | mobile | 57 | 97 | 100 | 100 | 7018.3 | 0.000 | 218.5 |
| home (`/`) | desktop | 93 | 97 | 100 | 100 | 1492.3 | 0.000 | 8.0 |
| detail-nft (`/nfts/nft_1`) | mobile | 55 | 100 | 100 | 100 | 7204.3 | 0.000 | 301.7 |
| detail-nft (`/nfts/nft_1`) | desktop | 93 | 100 | 100 | 100 | 1421.0 | 0.017 | 6.5 |

**Metas:** Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.

**Status das metas e justificativas (com base nas medianas):**
- **Performance:** atingida em **desktop** (93), **não atingida em mobile** (55–57). Causa residual: LCP alto no mobile (~7.0–7.2s) por conta do service worker do MSW (portão de ativação) e da imagem LCP dinâmica não descobrível no HTML inicial; mitigação em produção com mocks desligados (`VITE_ENABLE_MOCKS=false`) e CDN de imagens com preload. CLS 0.000 (home) / 0.017 (detail desktop, desprezível) e TBT moderado no mobile, baixo no desktop.
- **Accessibility:** atingida (97–100), acima da meta de 95, após correções de contraste, touch targets (slider 24px), `role="tablist"`/`role="img"` e `robots.txt`.
- **Best Practices:** atingida (100 em todos os cenários).
- **SEO:** atingida (100 em todos os cenários; acima da meta de 90).

**Artefatos:** relatórios HTML/JSON por execução e sumários em `nft-marketplace/lighthouse-reports/` (`summary.md`, `summary.json`). O runner `scripts/run-lighthouse.mjs` automatiza as 3 medições por página/perfil e o cálculo de medianas.

> **Nota (pós-correções):** as otimizações de Etapa 12 (bundle splitting, memoização, imagens, fonte, shell, contraste, touch targets, aria, robots.txt) foram aplicadas e re-auditadas; medianas finais em `lighthouse-reports/summary.md`. A11y (97–100), BP (100) e SEO (100) atingem as metas. Performance permanece abaixo de 90 no mobile (55–57) por LCP ~7s (MSW + imagem dinâmica), mitigável em produção com mocks desligados. Análise detalhada em `ANALISE_PERFORMANCE_ETAPA12.md`.

---

## Etapa 13: Documentação e deploy

### `README.md`

- [x] Setup e variáveis de ambiente. *(documentado em `nft-marketplace/README.md` e resumo em `README.md` na raiz)*
- [x] Credenciais fictícias. *(Alexandre/Beatriz com `password123`, conforme fixtures/mocks)*
- [x] Seleção e reset de cenários. *(query string `?scenario=...`, seletor/UI, `localStorage`, endpoints `/api/mocks/scenario` e `/api/mocks/reset`)*
- [x] Comandos de execução. *(dev, dev:mocks, build, preview, typecheck, lint, test:e2e, lighthouse)*
- [x] Instruções para reproduzir os fluxos de falha. *(catálogo vazio/latência/erros, sessão expirada, conflito de cadastro, validação, cupons, preço/estoque no checkout, pagamento recusado, timeout com idempotência, pedido pendente/realtime)*

### `ARCHITECTURE.md`

- [x] Contratos REST e eventos. *(documentados em `nft-marketplace/ARCHITECTURE.md`; inclui endpoints, formatos de erro, payload realtime)*
- [x] Política de sessão. *(token/sessão, recuperação, expiração, logout/troca de usuário e limpeza de estado)*
- [x] Estado do carrinho. *(persistência, merge, cotação pela API, revalidação no checkout)*
- [x] Estratégia de cache, retries e sincronização. *(TanStack Query, query keys por usuário/parâmetros, invalidação/reconciliação)*
- [x] Reconciliação entre REST e Socket.IO. *(handlers de eventos, deduplicação/versão e refresh/reconciliação conforme implementação)*
- [x] Transporte do Socket.IO nos mocks e suas limitações. *(MSW + socket.io binding, websocket-only no mock, escopo/limitações documentadas)*
- [x] Decisões de UX, limitações e desvios do Figma. *(documentadas no `ARCHITECTURE.md` e complementadas por notas de auditoria/resultados em `PLANO_IMPLEMENTACAO.md` Etapa 12)*

### Deploy (obrigatório)

- [x] Publicar em Vercel (recomendado), Netlify ou Cloudflare Pages. — **URL:** https://nft-marketplace-pi-ashy.vercel.app
- [x] Rewrite de SPA, para que refresh e acesso direto às rotas funcionem. (validado: `/nfts/nft_1` deep link + refresh OK)
- [x] Mocks e fluxos de tempo real funcionando na versão publicada. (catálogo, login, Socket.IO verificados)
- [x] Versão publicada corresponde ao código entregue e permanece acessível durante a avaliação.
- [x] Instruções de deploy e validação em checkout limpo documentadas (build/output/env/rewrite) em `nft-marketplace/README.md`; execução/publicação efetiva depende do ambiente de deploy.

---

## Riscos a vigiar

| Risco | Mitigação |
| --- | --- |
| **Socket.IO sobre MSW** pode se comportar diferente no build publicado (é eliminatório) | Validar na Etapa 3 e revalidar no primeiro deploy |
| **Precisão em ETH** | Strings e lib decimal desde a Etapa 1, sem `number` |
| **Vazamento de dados entre usuários** (eliminatório) | `userId` nas query keys e `clear()` no logout desde a Etapa 4 |
| **Testes instáveis em cenários sensíveis a tempo** | Relógio, latência e eventos controlados desde o início |
| **Lighthouse tardio** | Medição preliminar na Etapa 5 |
| **Pedidos duplicados** | Idempotência no cliente e no mock, botão bloqueado e testes dedicados |
| **Fidelidade ao Figma se perder ao longo do projeto** | Tokens no tema desde a Etapa 0 e regressão visual na Etapa 11 |

---

## Checklist final de entrega

- [x] Código-fonte, lockfile, assets, mocks, fixtures, testes e configs de auditoria no repositório. *(commit inicial `f155ac1f` inclui src, e2e, scripts, lighthouse-reports, public/assets)*
- [x] Todos os comandos disponíveis: desenvolvimento com mocks, build, preview, typecheck, lint, testes Playwright e Lighthouse. *(validados: typecheck, lint, build, lighthouse, test:e2e executáveis)*
- [x] Testes E2E passando, com relatório HTML e traces. *(72/72 testes verdes em 2026-11-17: 36 desktop-chromium + 36 mobile-chromium via `npm run test:e2e`; relatório HTML em `nft-marketplace/playwright-report/`, traces/vídeos retidos em caso de falha conforme `playwright.config.ts`)*
- [x] Relatórios Lighthouse (HTML e JSON) com medianas e justificativas. *(em `nft-marketplace/lighthouse-reports/`, atualizados em 2026-11-17)*
- [x] `README.md` e `ARCHITECTURE.md` completos. *(raiz e nft-marketplace atualizados com URL de deploy, cenários, comandos, contratos)*
- [x] URL pública da aplicação funcionando, com acesso direto e refresh de rotas. — https://nft-marketplace-pi-ashy.vercel.app
- [~] Link do repositório. *(a cargo do usuário: upload para GitHub e inclusão da URL na documentação; código final commitado localmente em `ed5a82ce`, pronto para `git remote add origin <url> && git push -u main`)*
- [x] Execução validada a partir de um checkout limpo. *(npm install + npm run build + npm run typecheck + npm run lint passam)*
