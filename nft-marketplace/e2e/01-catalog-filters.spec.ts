import { test, expect } from '@playwright/test';
import { resetBrowserStorage, searchCatalog } from './test-helpers';

test.describe('Cenário 1: Catálogo, Busca, Filtros Combinados e Histórico', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
    await page.goto('/');
  });

  test('deve filtrar por categoria, busca textual e refletir na URL', async ({ page }) => {
    // 1. Filtra por categoria "Colecionáveis"
    const collectiblesButton = page.getByRole('button', { name: /Colecionáveis/i });
    await collectiblesButton.click();
    await expect(page).toHaveURL(/category=collectibles/);

    // 2. Realiza busca textual pelo campo do cabeçalho
    await searchCatalog(page, 'Cyber');
    await expect(page).toHaveURL(/search=Cyber/);

    // 3. Verifica se os cards do catálogo refletem o filtro
    const catalogList = page.getByLabel('Lista de NFTs');
    const cards = catalogList.locator('article[aria-label^="NFT:"]');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText(/Cyber/i);
  });

  test('deve ordenar itens por preço e reiniciar paginação ao mudar filtro', async ({ page }) => {
    // 1. Seleciona ordenação por Menor preço
    const sortSelect = page.getByRole('combobox', { name: /Ordenar por/i });
    await sortSelect.selectOption('price_asc');
    await expect(page).toHaveURL(/sortBy=price_asc/);

    // 2. Se houver paginação e avançar de página
    const nextPageButton = page.getByRole('button', { name: /Próxima/i });
    if (await nextPageButton.isVisible() && await nextPageButton.isEnabled()) {
      await nextPageButton.click();
      await expect(page).toHaveURL(/page=2/);

      // Ao mudar de categoria, a paginação deve reiniciar para 1
      const artButton = page.getByRole('button', { name: /Arte Digital/i });
      await artButton.click();
      await expect(page).toHaveURL(/page=1/);
    }
  });

  test('deve restaurar estado de busca e filtros ao navegar pelo histórico (voltar e avançar)', async ({ page }) => {
    // 1. Inicia sem filtros
    await page.goto('/');

    // 2. Clica na categoria Fotografia
    await page.getByRole('button', { name: /Fotografia/i }).click();
    await expect(page).toHaveURL(/category=photography/);

    // 3. Aplica busca "Nebula"
    await searchCatalog(page, 'Nebula');
    await expect(page).toHaveURL(/search=Nebula/);

    // 4. Volta pelo histórico do navegador
    await page.goBack();
    // Deve retornar ao estado de apenas categoria photography
    await expect(page).toHaveURL(/category=photography/);

    // 5. Volta mais uma vez para o início sem filtros
    await page.goBack();
    await expect(page).not.toHaveURL(/category=/);

    // 6. Avança pelo histórico
    await page.goForward();
    await expect(page).toHaveURL(/category=photography/);
  });
});
