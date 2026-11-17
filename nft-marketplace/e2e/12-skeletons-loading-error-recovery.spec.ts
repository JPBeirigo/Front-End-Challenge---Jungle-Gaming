import { test, expect } from '@playwright/test';
import { resetBrowserStorage, setMockScenario } from './test-helpers';

test.describe('Cenário 12: Skeletons Shimmer, Feedback de Falha e Recuperação', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
  });

  test('deve renderizar skeletons com efeito shimmer durante carregamento lento', async ({ page }) => {
    // 1. Navega para a página inicial com cenário de latência ativado via query param
    await page.goto('/?scenario=variable_latency');

    // 2. Verifica presença de skeletons dentro do catálogo visível
    const catalogList = page.getByLabel('Lista de NFTs');
    const skeletons = catalogList.locator('.skeleton-shimmer');
    await expect(skeletons.first()).toBeVisible();

    // 3. Ao concluir, os cards finais de NFTs devem aparecer
    await expect(catalogList.locator('article').first()).toBeVisible({ timeout: 12000 });
  });

  test('deve exibir feedback de falha de conexão e permitir recuperação com retry', async ({ page }) => {
    // 1. Navega com cenário de falha HTTP 500
    await page.goto('/?scenario=http_500');

    // 2. Deve exibir mensagem amigável de falha ao carregar o catálogo
    await expect(page.getByRole('heading', { name: /Falha ao carregar o catálogo/i })).toBeVisible({ timeout: 8000 });
    const retryBtn = page.getByRole('button', { name: /Tentar novamente/i });
    await expect(retryBtn).toBeVisible();

    // 3. Reseta o cenário para padrão (sucesso)
    await setMockScenario(page, 'default');

    // 4. Clica em "Tentar novamente"
    await retryBtn.click();

    // 5. O catálogo deve carregar com sucesso
    const catalogList = page.getByLabel('Lista de NFTs');
    await expect(catalogList.locator('article').first()).toBeVisible({ timeout: 8000 });
  });
});
