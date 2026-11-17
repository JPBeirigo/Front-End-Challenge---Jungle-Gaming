import { test, expect } from '@playwright/test';

test.describe('Smoke Test - Fundação', () => {
  test('deve carregar a página inicial com o título correto', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/KURIO/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/arte que existe/i);
  });
});
