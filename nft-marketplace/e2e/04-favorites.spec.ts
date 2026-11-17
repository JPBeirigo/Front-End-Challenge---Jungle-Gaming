import { test, expect } from '@playwright/test';
import { resetBrowserStorage, loginAsAlexandre, setMockScenario } from './test-helpers';

test.describe('Cenário 4: Favoritos, Atualização Otimista e Rollback', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
  });

  test('deve exigir login para favoritar e persistir favoritos para usuário autenticado', async ({ page }) => {
    // 1. Visitante tenta favoritar um NFT dentro da lista visível do catálogo
    await page.goto('/');
    // Aguarda os NFTs carregarem
    const catalogList = page.getByLabel('Lista de NFTs');
    await expect(catalogList.locator('article').first()).toBeVisible({ timeout: 10000 });

    const favoriteButton = catalogList.locator('button[aria-label*="Favoritar"]').first();
    await expect(favoriteButton).toBeVisible();
    await favoriteButton.click();

    // Deve redirecionar para login
    await expect(page).toHaveURL(/\/login/);

    // 2. Faz login como Alexandre (pode retornar ao redirect anterior)
    await loginAsAlexandre(page);

    // 3. Na página inicial autenticado, clica para favoritar
    await page.goto('/');
    const authCatalog = page.getByLabel('Lista de NFTs');
    await expect(authCatalog.locator('article').first()).toBeVisible({ timeout: 10000 });

    const favBtn = authCatalog.locator('button[aria-label*="Favoritar"]').first();
    await expect(favBtn).toBeVisible({ timeout: 10000 });
    await favBtn.click();

    // Estado otimista: aria-label muda para "Remover ... dos favoritos"
    await expect(authCatalog.locator('button[aria-label*="dos favoritos"]').first()).toBeVisible({ timeout: 10000 });

    // 4. Recarrega a página (refresh) para garantir persistência no banco mock
    await page.reload();
    if (page.url().includes('/login')) {
      await loginAsAlexandre(page);
      await page.goto('/');
    }
    await expect(page.getByLabel('Lista de NFTs').locator('article').first()).toBeVisible({ timeout: 10000 });
    const reloadedCatalog = page.getByLabel('Lista de NFTs');
    await expect(reloadedCatalog.locator('button[aria-label*="dos favoritos"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('deve realizar rollback otimista quando a mutation de favoritos falhar (HTTP 500)', async ({ page }) => {
    // 1. Faz login e carrega o catálogo com sucesso
    await loginAsAlexandre(page);
    await page.goto('/');
    const catalogList = page.getByLabel('Lista de NFTs');
    // Aguarda os NFTs carregarem
    await expect(catalogList.locator('article').first()).toBeVisible({ timeout: 10000 });

    // Alexandre já possui 2 favoritos nas fixtures; o rollback deve restaurar esse estado.
    const favoriteButtons = catalogList.locator('button[aria-label*="dos favoritos"]');
    const initialFavoriteCount = await favoriteButtons.count();

    const favBtn = catalogList.locator('button[aria-label*="Favoritar"]').first();
    await expect(favBtn).toBeEnabled();

    // 2. Ativa cenário de erro no servidor (HTTP 500) para interceptar a mutation
    await setMockScenario(page, 'http_500');

    // 3. Clica para favoritar: a UI tenta atualizar otimisticamente
    await favBtn.click();

    // 4. Após a falha do endpoint (HTTP 500), a UI deve reverter para o estado original (Rollback)
    // O botão deve voltar para o estado "Favoritar" (rollback)
    await expect(catalogList.locator('button[aria-label*="Favoritar"]').first()).toBeVisible({ timeout: 10000 });

    // Verifica que o número de favoritos voltou ao estado original (rollback completo)
    // Aguarda estabilizar após o rollback
    await page.waitForTimeout(2000);
    await expect(favoriteButtons).toHaveCount(initialFavoriteCount, { timeout: 5000 });
  });
});
