import { test, expect } from '@playwright/test';
import { resetBrowserStorage, loginAsAlexandre } from './test-helpers';

test.describe('Cenário 5: Carrinho, Cupons e Persistência', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
  });

  test('deve adicionar item, alterar quantidade, remover e persistir após refresh', async ({ page }) => {
    // 1. Acessa o detalhe do NFT 1
    await page.goto('/nfts/nft_1');

    // 2. Clica em adicionar ao carrinho e aguarda o feedback de sucesso
    const addToCartBtn = page.getByRole('button', { name: /Adicionar ao Carrinho/i });
    await addToCartBtn.click();
    await expect(page.getByText(/Item adicionado ao carrinho/i)).toBeVisible();

    // 3. Navega para o carrinho
    await page.goto('/cart');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Carrinho');
    await expect(page.getByText('Ether Sentinel #01').first()).toBeVisible();

    // 4. Aumenta a quantidade
    const plusBtn = page.getByRole('button', { name: /Aumentar quantidade/i });
    await plusBtn.click();
    const itemArticle = page.locator('article[aria-label^="Item:"]').first();
    await expect(itemArticle.locator('span[aria-live="polite"]')).toHaveText('2');

    // 5. Recarrega a página (refresh) e verifica que o carrinho foi preservado
    await page.reload();
    await expect(page.getByText('Ether Sentinel #01').first()).toBeVisible();
    await expect(itemArticle.locator('span[aria-live="polite"]')).toHaveText('2');

    // 6. Remove o item do carrinho
    const removeBtn = page.getByRole('button', { name: /Remover .* do carrinho/i });
    await removeBtn.click();

    // Deve exibir estado de carrinho vazio
    await expect(page.getByText(/Seu carrinho está vazio/i)).toBeVisible();
  });

  test('deve aplicar cupom com desconto, remover cupom e exibir erro para cupom inválido/expirado', async ({ page }) => {
    // 1. Adiciona um item ao carrinho usando "Comprar Agora" para redirecionar diretamente
    await page.goto('/nfts/nft_1');
    await page.getByRole('button', { name: /Comprar/i }).click();

    // 2. Aguarda redirecionamento para o carrinho com itens
    await expect(page).toHaveURL('/cart');
    await expect(page.getByText('Ether Sentinel #01').first()).toBeVisible();

    // 3. Testa cupom inválido
    const couponInput = page.getByPlaceholder(/Código do cupom/i);
    const applyBtn = page.getByRole('button', { name: /Aplicar/i });

    await couponInput.fill('CUPOM_FALSO');
    await applyBtn.click();
    await expect(page.getByRole('alert')).toContainText(/inválido/i);

    // 4. Testa cupom expirado
    await couponInput.fill('EXPIRED50');
    await applyBtn.click();
    await expect(page.getByRole('alert')).toContainText(/expirado/i);

    // 5. Aplica cupom válido DISCOUNT10 (10% de desconto)
    await couponInput.fill('DISCOUNT10');
    await applyBtn.click();
    await expect(page.getByText(/DISCOUNT10 \(10% OFF\)/i)).toBeVisible();

    // 6. Remove o cupom
    const removeCouponBtn = page.getByRole('button', { name: /Remover cupom/i });
    await removeCouponBtn.click();
    await expect(page.getByPlaceholder(/Código do cupom/i)).toBeVisible();
  });

  test('deve preservar o carrinho do visitante e mesclar (merge) após login', async ({ page }) => {
    // 1. Usuário anônimo/visitante adiciona um item ao carrinho via Comprar Agora
    await page.goto('/nfts/nft_1');
    await page.getByRole('button', { name: /Comprar/i }).click();

    // 2. Verifica carrinho como visitante
    await expect(page).toHaveURL('/cart');
    await expect(page.getByText('Ether Sentinel #01').first()).toBeVisible();

    // 3. Faz login como Alexandre
    await loginAsAlexandre(page);

    // 4. Retorna ao carrinho: o item selecionado como visitante deve ter sido preservado/mesclado
    await page.goto('/cart');
    if (page.url().includes('/login')) {
      await loginAsAlexandre(page);
      await page.goto('/cart');
    }
    await expect(page.getByText('Ether Sentinel #01').first()).toBeVisible({ timeout: 10000 });
  });
});
