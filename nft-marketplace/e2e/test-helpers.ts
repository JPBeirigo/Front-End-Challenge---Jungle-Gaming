import { Page, expect } from '@playwright/test';

/**
 * Reseta o estado local do navegador, localStorage/sessionStorage e banco mock MSW.
 */
export async function resetBrowserStorage(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    try {
      await fetch('/api/mocks/reset', { method: 'POST' });
    } catch { /* ignore */ }
  });
}

/**
 * Define o cenário ativo no mock MSW através do fetch interceptado pelo Service Worker.
 */
export async function setMockScenario(page: Page, scenario: string) {
  await page.evaluate(async (sc) => {
    localStorage.setItem('nft_mock_active_scenario', sc);
    try {
      await fetch('/api/mocks/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: sc }),
      });
    } catch { /* ignore */ }
  }, scenario);
}

/**
 * Emite evento 'nft.updated' via backend mock MSW através do Service Worker.
 */
export async function emitMockNftUpdated(
  page: Page,
  data: { nftId: string; priceEth?: string; totalAvailable?: number }
) {
  return await page.evaluate(async (payload) => {
    const res = await fetch('/api/mocks/emit-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'nft.updated',
        data: payload,
      }),
    });
    return await res.json();
  }, data);
}

/**
 * Emite evento 'order.updated' via backend mock MSW através do Service Worker.
 */
export async function emitMockOrderUpdated(
  page: Page,
  data: {
    orderId: string;
    status: 'pending' | 'confirmed' | 'failed';
    transactionHash?: string;
    failureReason?: string;
  },
  targetUserId?: string
) {
  return await page.evaluate(
    async ({ eventData, userId }) => {
      const res = await fetch('/api/mocks/emit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'order.updated',
          targetUserId: userId,
          data: eventData,
        }),
      });
      return await res.json();
    },
    { eventData: data, userId: targetUserId }
  );
}

/**
 * Realiza login informando diretamente as credenciais da conta de exemplo.
 */
export async function loginWithCredentials(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /Entrar/i }).click();
  await expect(page.locator('#user-menu-button')).toBeVisible({ timeout: 15000 });
  await expect
    .poll(async () => page.evaluate(() => !!localStorage.getItem('nft_marketplace_auth_token')))
    .toBe(true);
}

/**
 * Realiza login rápido com credenciais válidas conhecidas (Alexandre).
 */
export async function loginAsAlexandre(page: Page) {
  await loginWithCredentials(page, 'alexandre@example.com', 'password123');
}

/**
 * Realiza login rápido com o usuário 2 (Beatriz).
 */
export async function loginAsBeatriz(page: Page) {
  await loginWithCredentials(page, 'beatriz@example.com', 'password123');
}

/**
 * Garante que o usuário está autenticado como Alexandre antes de acessar rota protegida.
 */
export async function ensureAlexandreSession(page: Page) {
  const token = await page.evaluate(() => localStorage.getItem('nft_marketplace_auth_token'));
  if (!token) {
    await loginAsAlexandre(page);
  }
}

/**
 * Navega para uma rota protegida garantindo sessão autenticada de Alexandre.
 */
export async function gotoProtectedAsAlexandre(page: Page, path: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await ensureAlexandreSession(page);
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    if (page.url().includes('/login')) {
      await loginAsAlexandre(page);
      continue;
    }
    // Aguarda possível restauração/validação de sessão que pode redirecionar para login
    try {
      await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 });
    } catch {
      if (page.url().includes('/login')) {
        await loginAsAlexandre(page);
        continue;
      }
    }
    if (!page.url().includes('/login')) return;
  }
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

/**
 * Garante que a carteira de pagamento está conectada no checkout.
 * Usa correspondência exata para não confundir "Conectar carteira" com
 * "Desconectar carteira", e verifica o badge "Conectada" (texto exato).
 */
export async function connectWalletIfNeeded(page: Page) {
  const connectedBadge = page.getByText('Conectada', { exact: true });
  if (await connectedBadge.isVisible()) return;
  await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click();
  await expect(connectedBadge).toBeVisible({ timeout: 10000 });
}

/**
 * Realiza uma busca no catálogo via campo de busca do cabeçalho.
 * O campo só é exibido após clicar no botão "Buscar NFTs".
 */
export async function searchCatalog(page: Page, term: string) {
  await page.getByRole('button', { name: 'Buscar NFTs' }).click();
  const input = page.getByRole('searchbox', { name: /Buscar NFTs/i });
  await input.fill(term);
  await input.press('Enter');
}

/**
 * Adiciona um NFT ao carrinho e navega sincronizadamente até /cart.
 */
export async function addItemToCart(page: Page, nftId: string = 'nft_1') {
  await page.goto(`/nfts/${nftId}`);
  const buyBtn = page.getByRole('button', { name: /Comprar/i });
  await buyBtn.click();
  await expect(page).toHaveURL('/cart');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Carrinho');
}
