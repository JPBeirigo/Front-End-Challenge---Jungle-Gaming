import { test, expect } from '@playwright/test';
import { resetBrowserStorage, loginAsAlexandre, setMockScenario, addItemToCart, gotoProtectedAsAlexandre, connectWalletIfNeeded } from './test-helpers';

test.describe('Cenário 7: Falhas de Pagamento, Idempotência e Timeout', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
    await loginAsAlexandre(page);
  });

  test('deve tratar pagamento recusado, exibir tela de falha e preservar itens no carrinho', async ({ page }) => {
    // 1. Adiciona NFT ao carrinho
    await addItemToCart(page, 'nft_1');

    // 2. Define cenário de pagamento recusado
    await setMockScenario(page, 'payment_declined');

    // 3. Vai para o checkout
    await gotoProtectedAsAlexandre(page, '/checkout');

    await page.waitForLoadState('networkidle');

    await connectWalletIfNeeded(page);

    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Revisar pedido/i }).click();
    await expect(page.getByRole('heading', { name: /Seus NFTs/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Confirmar compra/i }).click();

    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 15000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Transação Não Autorizada/i);
    await expect(page.getByText(/Seu carrinho foi preservado/i)).toBeVisible();

    await page.getByRole('link', { name: /Voltar ao Carrinho/i }).click();
    await expect(page).toHaveURL('/cart');
    await expect(page.getByText('Ether Sentinel #01')).toBeVisible();
  });

  test('deve tratar timeout de rede e permitir recuperação transparente com a mesma chave de idempotência', async ({ page }) => {
    // 1. Adiciona item ao carrinho
    await addItemToCart(page, 'nft_1');

    // 2. Define cenário de timeout
    await setMockScenario(page, 'order_timeout');

    // 3. Vai ao checkout e avança até revisão
    await gotoProtectedAsAlexandre(page, '/checkout');

    await page.waitForLoadState('networkidle');

    await connectWalletIfNeeded(page);

    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Revisar pedido/i }).click();
    await expect(page.getByRole('heading', { name: /Seus NFTs/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Confirmar compra/i }).click();
    await expect(page.getByText(/Tempo Limite Excedido/i)).toBeVisible({ timeout: 15000 });
    const retryBtn = page.getByRole('button', { name: /Tentar novamente/i });
    await expect(retryBtn).toBeVisible();

    await retryBtn.click();
    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 15000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Compra confirmada/i);
  });
});
