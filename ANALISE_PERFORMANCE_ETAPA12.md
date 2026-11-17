# Análise de Performance — Etapa 12 (Lighthouse)

Base: medianas de 3 medições por página/perfil (relatórios em `nft-marketplace/lighthouse-reports/`).
Ambiente de auditoria: build otimizado (`npm run build`, `VITE_ENABLE_MOCKS=true`), preview SPA de `dist`, Chrome headless, Lighthouse 12.8.2.

## Resultado atual (medianas)

| Página | Perfil | Perf | A11y | BP | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| home (`/`) | mobile | 57 | 93 | 100 | 92 | 6123.5 | 0.000 | 284.4 |
| home (`/`) | desktop | 91 | 92 | 100 | 92 | 1596.8 | 0.000 | 13.0 |
| detail (`/nfts/nft_1`) | mobile | 59 | 96 | 100 | 92 | 6636.5 | 0.000 | 186.5 |
| detail (`/nfts/nft_1`) | desktop | 90 | 96 | 100 | 92 | 1572.5 | 0.000 | 11.0 |

Metas: Performance ≥ 90, A11y ≥ 95, BP ≥ 95, SEO ≥ 90.
Performance falha só no mobile; A11y falha só na home (pequena margem).

---

## 1) Item "Imagens/Fontes/LCP" — causas identificadas

### 1.1 Portão do MSW antes da renderização (causa principal do LCP alto)
- `src/main.tsx` faz `await enableMocking()` **antes** de `ReactDOM.createRoot(...).render(...)`.
- Em builds com mocks (`VITE_ENABLE_MOCKS=true`), a aplicação não pinta nada até o service worker do MSW ser registrado/ativado.
- Sob throttling mobile do Lighthouse isso empurra o LCP para ~6.1–6.6s.
- LCP no home = parágrafo de texto que só existe após `useNFTs` resolver (depende do round-trip mock); LCP no detail = imagem principal que depende de dados do NFT.
- Em produção real (mocks desligados) esse portão desaparece — mas a auditoria e o demo publicado rodam com mocks.

### 1.2 LCP depende de dados remotos antes de pintar
- Não há skeleton/placeholder com dimensões estáveis na região do LCP (hero do home, imagem do detail) que pinte imediatamente; o conteúdo só aparece após fetch.
- `fetchPriority="high"` já estava no detail; faltava no hero do home (corrigido).

### 1.3 Imagens remotas (Unsplash) sem otimização
- `imageUrl` aponta para `images.unsplash.com` com `w=800` para tiles de 258px e hero de 450px → bytes excessivos.
- Sem `width`/`height` explícitos → risco de CLS (medido 0, mas frágil).
- Sem `srcset`/`sizes` → navegador baixa o maior tamanho sempre.
- Sem preconnect à origem das imagens (adicionado).
- Sem formatos modernos dedicados (WebP/AVIF) — o Unsplash entrega via `auto=format`, mas não há controle.

### 1.4 Fonte render-blocking
- `index.html` carrega `Roboto+Mono` (4 pesos) via stylesheet do Google Fonts sem preload; é render-blocking (auditoria: "Eliminate render-blocking resources", ~150–300ms).
- `font-display=swap` já está na URL (bom), mas não há `<link rel="preload">` da fonte.
- Self-hosting + subset reduziria o bloqueio.

### 1.5 Compressão de texto (auditoria: ~3.1s)
- `uses-text-compression` aponta 3.1s porque o preview local (`vite preview`) não gzipa. Em produção (Vercel/Netlify) a compressão é automática; não é um problema de código, mas afeta a medição local.

---

## 2) Item "Componentes/Listas Pesadas" — causas identificadas

### 2.1 Bundle inicial grande (603KB) com 257KB não utilizados no home
- `manualChunks` só separa `react` e `tanstack`; todo o resto (lucide 74 ícones, radix dialog, socket.io-client, decimal.js, react-hook-form+zod, etc.) cai no chunk `index`.
- Lighthouse: "Reduce unused JavaScript" = 1.65s; "Script Evaluation" = 1.95s no mobile.
- Auto code splitting do router divide rotas, mas o chunk principal acumula dependências compartilhadas.

### 2.2 Sem memoização de componentes de lista
- `NftCard` não era memoizado → re-render de todos os cards a cada mudança de estado do pai (filtros, slider de preço, realtime).
- Cada card instancia `useAuth()` e `useFavoriteToggle()` (useMutation) → N hooks por grid; mudanças no contexto de auth re-renderizam todos os cards.
- Corrigido com `React.memo` (impacto limitado enquanto os props `nft` mudarem por realtime).

### 2.3 Re-render por identidade de props/estado
- Home dispara `useNFTs` duas vezes (filtros + `allCatalog` para contagens).
- Sliders de preço usam `useState` local sincronizado com URL via `useEffect` → re-renders em cascata.
- Listas (6 cards home, 5 "mais desta coleção", 4 blog, 5 "colecionadores também viram") não têm virtualização — aceitável pelo tamanho, mas combinadas com memo ausente causam TBT moderado (186–284ms mobile).

### 2.4 Cenários de tempo real
- Eventos `nft.updated` atualizam o cache do TanStack Query → re-render de grids; sem `React.memo`/selectors isso é custoso.
- Deduplicação por `id`/`version` existe, mas o re-render da lista inteira não é evitado.

---

## 3) Correções aplicadas nesta análise

- `src/features/catalog/components/NftCard.tsx`: envolvido em `React.memo` (import de `React` ajustado).
- `src/routes/index.tsx`: `fetchPriority="high"` na imagem do hero.
- `index.html`: preconnect à origem `https://images.unsplash.com`.
- `src/shared/ui/navbar.tsx`: botão "Entrar" 100×35 (conclusão da etapa de reestilo).
- `tailwind.config.js`: `maxWidth.container` 1248px (consistência com tokens).

## 4) Recomendações priorizadas (não aplicadas — alto impacto, maior risco)

1. **Remover o portão do MSW da renderização inicial**: renderizar a árvore imediatamente e ativar mocks em paralelo, ou desativar mocks no build de produção (`VITE_ENABLE_MOCKS=false`). Isso sozinho deve derrubar o LCP mobile de ~6s para <2s.
2. **Adicionar manualChunks** para `socket.io-client`, `decimal.js`, `react-hook-form`+`zod`, `lucide-react` (ou importar ícones por caminho) — reduz parse/eval do chunk principal e melhora cache.
3. **Imagens**: usar `srcset`/`sizes`, `width`/`height`, tamanhos menores do Unsplash (`w=450`/`w=258`), e considerar self-hosting dos assets críticos com formatos modernos.
4. **Fonte**: self-host do Roboto Mono (ou preload + `media="print"` swap) para eliminar o render-blocking.
5. **Memoização mais fina**: `React.memo` em `CartItemRow`, thumbs do detail e cards de blog/promo; usar seletores no contexto de auth para evitar re-render em massa.
6. **Estabilizar listas**: virtualizar listas longas se crescerem (react-virtual) e evitar `useNFTs` duplicado no home (combinar contagens no mesmo resultado).
7. **Compressão**: garantir gzip/brotli no host (Vercel/Netlify) — já coberto por padrão.

## 5) Observação sobre medição

Os números de Lighthouse foram coletados com mocks ativos e preview sem compressão. Em produção (mocks off + compressão on), o LCP esperado cai substancialmente, mas o TBT por bundle grande permanece e deve ser tratado via code splitting.