import { test, expect } from '@playwright/test';
import { resetBrowserStorage, loginAsAlexandre, emitMockOrderUpdated, setMockScenario, addItemToCart, gotoProtectedAsAlexandre, connectWalletIfNeeded } from './test-helpers';

test.describe('Cenário 10: Resiliência Socket.IO, Deduplicação e Reconexão', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
    await loginAsAlexandre(page);
  });

  test('deve atualizar pedido pendente para confirmado em tempo real via evento order.updated', async ({ page }) => {
    await addItemToCart(page, 'nft_1');
    await setMockScenario(page, 'order_pending');
    await gotoProtectedAsAlexandre(page, '/checkout');
    await page.waitForLoadState('networkidle');

    await connectWalletIfNeeded(page);
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /Revisar pedido/i }).click();
    await expect(page.getByRole('heading', { name: /Seus NFTs/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Confirmar compra/i }).click();

    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 15000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Aguardando Confirmação na Blockchain/i, { timeout: 10000 });

    const url = page.url();
    const orderId = url.split('/orders/')[1];
    await emitMockOrderUpdated(page, {
      orderId,
      status: 'confirmed',
      transactionHash: '0xabc123789456def...confirmed',
    });

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Compra confirmada/i, { timeout: 10000 });
  });

  test('deve recuperar o status do pedido pendente após refresh do navegador', async ({ page }) => {
    await addItemToCart(page, 'nft_1');
    await setMockScenario(page, 'order_pending');
    await gotoProtectedAsAlexandre(page, '/checkout');
    await page.waitForLoadState('networkidle');

    await connectWalletIfNeeded(page);
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /Revisar pedido/i }).click();
    await expect(page.getByRole('heading', { name: /Seus NFTs/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Confirmar compra/i }).click();

    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 15000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Aguardando Confirmação na Blockchain/i, { timeout: 10000 });

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Aguardando Confirmação na Blockchain/i, { timeout: 10000 });
  });
});
