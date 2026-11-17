import { test, expect } from '@playwright/test';
import { resetBrowserStorage, loginAsAlexandre, emitMockNftUpdated, addItemToCart, gotoProtectedAsAlexandre, connectWalletIfNeeded } from './test-helpers';

test.describe('Cenário 9: Tempo Real via Socket.IO — Alteração de Preço no Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
    await loginAsAlexandre(page);
  });

  test('deve atualizar o preço em tempo real e exibir aviso quando o NFT tiver preço alterado', async ({ page }) => {
    await addItemToCart(page, 'nft_1');
    await expect(page.getByText('Ether Sentinel #01')).toBeVisible();

    await emitMockNftUpdated(page, {
      nftId: 'nft_1',
      priceEth: '1.5000',
    });

    await expect(page.getByText(/1.5000 ETH/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('deve exibir modal de variação de cotação no checkout impedindo envio desatualizado', async ({ page }) => {
    await addItemToCart(page, 'nft_1');
    await gotoProtectedAsAlexandre(page, '/checkout');
    await page.waitForLoadState('networkidle');

    await emitMockNftUpdated(page, {
      nftId: 'nft_1',
      priceEth: '1.9900',
    });
    await page.waitForTimeout(1000);

    await connectWalletIfNeeded(page);
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /Revisar pedido/i }).click();
    await expect(page.getByRole('heading', { name: /Seus NFTs/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Confirmar compra/i }).click();

    await expect(page.getByText(/Cotação Atualizada Durante a Compra/i)).toBeVisible({ timeout: 10000 });
    const acceptBtn = page.getByRole('button', { name: /Aceitar nova cotação/i });
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();
    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 15000 });
  });
});
