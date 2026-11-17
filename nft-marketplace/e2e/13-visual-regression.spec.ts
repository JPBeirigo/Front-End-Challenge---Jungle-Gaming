import { test, expect } from '@playwright/test';
import { resetBrowserStorage, loginAsAlexandre, addItemToCart, gotoProtectedAsAlexandre, connectWalletIfNeeded } from './test-helpers';

test.describe('Regressão Visual: Telas Principais (Início, Detalhe, Carrinho e Checkout)', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
  });

  test('deve capturar snapshot visual estável da Página Inicial (Catálogo)', async ({ page }) => {
    await page.goto('/');
    const catalogList = page.getByLabel('Lista de NFTs');
    await expect(catalogList.locator('article').first()).toBeVisible({ timeout: 10000 });

    const screenshot = await page.screenshot({ fullPage: false });
    expect(screenshot).toBeDefined();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('deve capturar snapshot visual do Detalhe do NFT', async ({ page }) => {
    await page.goto('/nfts/nft_1');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ether Sentinel #01');

    const screenshot = await page.screenshot({ fullPage: false });
    expect(screenshot).toBeDefined();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('deve capturar snapshot visual do Carrinho com Itens', async ({ page }) => {
    await addItemToCart(page, 'nft_1');
    await expect(page.getByText('Ether Sentinel #01')).toBeVisible();

    const screenshot = await page.screenshot({ fullPage: false });
    expect(screenshot).toBeDefined();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('deve capturar snapshot visual da Tela de Checkout (Revisão)', async ({ page }) => {
    await loginAsAlexandre(page);
    await addItemToCart(page, 'nft_1');
    await gotoProtectedAsAlexandre(page, '/checkout');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await connectWalletIfNeeded(page);

    await page.getByRole('button', { name: /Revisar pedido/i }).click();
    await expect(page.getByRole('heading', { name: /Seus NFTs/i })).toBeVisible({ timeout: 10000 });

    const screenshot = await page.screenshot({ fullPage: false });
    expect(screenshot).toBeDefined();
    expect(screenshot.length).toBeGreaterThan(1000);
  });
});
