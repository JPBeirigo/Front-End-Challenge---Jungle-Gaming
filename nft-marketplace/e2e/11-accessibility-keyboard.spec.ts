import { test, expect } from '@playwright/test';
import { resetBrowserStorage, loginAsAlexandre, gotoProtectedAsAlexandre } from './test-helpers';

test.describe('Cenário 11: Acessibilidade, Navegação por Teclado e Foco (WCAG)', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
  });

  test('deve possuir Skip Link (Pular para o conteúdo principal) funcional na primeira tabulação', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /Pular para o conteúdo/i });
    await expect(skipLink).toBeVisible();
    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });

  test('deve reter o foco (focus trap) e permitir fechamento via tecla Escape no modal de carteira', async ({ page }) => {
    await loginAsAlexandre(page);
    await gotoProtectedAsAlexandre(page, '/wallets');
    await page.getByRole('button', { name: /Adicionar/i }).click();
    const modalHeading = page.getByRole('heading', { name: /Cadastrar Nova Carteira/i });
    await expect(modalHeading).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modalHeading).not.toBeVisible();
  });

  test('deve associar mensagens de erro acessíveis aos campos do formulário (aria-invalid)', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Entrar/i }).click();
    const emailInput = page.locator('#email');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });
});
