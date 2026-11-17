import { test, expect } from '@playwright/test';
import { resetBrowserStorage } from './test-helpers';

test.describe('Cenário 2: Detalhes do NFT e Recurso Inexistente (404)', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
  });

  test('deve acessar o detalhe do NFT diretamente por URL e selecionar edições', async ({ page }) => {
    // 1. Acesso direto ao NFT 1
    await page.goto('/nfts/nft_1');
    await expect(page).toHaveTitle(/Ether Sentinel/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ether Sentinel #01');

    // 2. Preço e informações visíveis
    await expect(page.getByText(/0.8500 ETH/i).first()).toBeVisible();
    await expect(page.getByText('Studio Nebula')).toBeVisible();

    // 3. Seletor de edições
    const edition3 = page.getByRole('button', { name: /Edição #3/i });
    if (await edition3.isVisible()) {
      await edition3.click();
      await expect(edition3).toHaveAttribute('aria-pressed', 'true');
    }

    // 4. Alteração de quantidade
    const plusButton = page.getByRole('button', { name: /Aumentar quantidade/i });
    if (await plusButton.isVisible() && await plusButton.isEnabled()) {
      await plusButton.click();
      await expect(page.getByText('2', { exact: true })).toBeVisible();
    }
  });

  test('deve exibir tela de 404 ao acessar NFT com identificador inexistente', async ({ page }) => {
    await page.goto('/nfts/nft_inexistente_9999');

    // Mensagem amigável de recurso inexistente
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/NFT não encontrado/i);
    await expect(page.getByText(/A obra que você procura pode ter sido removida/i)).toBeVisible();

    // Link para retornar ao catálogo
    const backLink = page.getByRole('link', { name: /Voltar para o Catálogo/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL('/');
  });
});
