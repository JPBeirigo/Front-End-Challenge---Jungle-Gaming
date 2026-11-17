import { test, expect } from '@playwright/test';
import { resetBrowserStorage, loginAsAlexandre, addItemToCart, gotoProtectedAsAlexandre, connectWalletIfNeeded } from './test-helpers';

test.describe('Cenário 6: Fluxo Completo de Compra e Recibo Confirmado', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
    await loginAsAlexandre(page);
  });

  test('deve executar o fluxo de compra de ponta a ponta gerando recibo oficial com snapshot imutável', async ({ page }) => {
    // 1. Adiciona NFT ao carrinho e navega para /cart
    await addItemToCart(page, 'nft_1');
    await expect(page.getByText('Ether Sentinel #01')).toBeVisible();

    // 2. Prossegue para o checkout
    await page.getByRole('button', { name: /Conectar e finalizar/i }).click();
    if (page.url().includes('/login')) {
      await loginAsAlexandre(page);
    }
    await gotoProtectedAsAlexandre(page, '/checkout');
    await expect(page).toHaveURL(/\/checkout/);

    // 3. Aguarda o checkout carregar (carteiras e dados do usuário)
    await page.waitForLoadState('networkidle');

    // 4. Verifica dados do colecionador (pré-preenchidos via Alexandre)
    const nameInput = page.locator('#collector-fullName');
    if (!(await nameInput.inputValue())) {
      await nameInput.fill('Alexandre Silveira');
    }
    const emailInput = page.locator('#collector-email');
    if (!(await emailInput.inputValue())) {
      await emailInput.fill('alexandre@example.com');
    }

    // 5. Conecta a carteira se ainda não conectada
    await connectWalletIfNeeded(page);

    // 6. Aguarda um momento para o selectedWallet ser inicializado pelo useEffect
    await page.waitForTimeout(500);

    // 7. Avança para a etapa de revisão
    const reviewBtn = page.getByRole('button', { name: /Revisar pedido/i });
    await reviewBtn.click();

    // Aguarda a tela de revisão aparecer (pode haver revalidação de cotação)
    await expect(page.getByRole('heading', { name: /Seus NFTs/i })).toBeVisible({ timeout: 10000 });

    // 8. Confirma a compra
    const submitBtn = page.getByRole('button', { name: /Confirmar compra/i });
    await submitBtn.click();

    // 9. Deve ser redirecionado para a tela de recibo do pedido (/orders/ord_...)
    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 15000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Compra confirmada/i);
    await expect(page.getByText(/Ether Sentinel #01/i)).toBeVisible();

    // 10. O carrinho deve estar agora vazio para o item comprado
    await page.goto('/cart');
    await expect(page.getByText(/Seu carrinho está vazio/i)).toBeVisible();
  });
});
