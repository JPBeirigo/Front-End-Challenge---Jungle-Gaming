import { test, expect } from '@playwright/test';
import { resetBrowserStorage, loginAsAlexandre, gotoProtectedAsAlexandre } from './test-helpers';

test.describe('Cenário 8: Edição de Perfil, Avatar, Senha e Carteiras', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
    await loginAsAlexandre(page);
  });

  test('deve atualizar dados do perfil e refletir na aplicação após refresh', async ({ page }) => {
    await gotoProtectedAsAlexandre(page, '/profile');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Perfil do colecionador/i);

    const nameInput = page.locator('#profile-name');
    await nameInput.fill('Alexandre Silveira Atualizado');
    const bioInput = page.locator('#profile-bio');
    await bioInput.fill('Colecionador experiente de arte generativa e NFTs raros.');

    await page
      .locator('section[aria-labelledby="profile-details-heading"]')
      .getByRole('button', { name: 'Salvar' })
      .click();
    await expect(page.getByText(/Dados do perfil atualizados com sucesso/i)).toBeVisible();

    await page.reload();
    await expect(nameInput).toHaveValue('Alexandre Silveira Atualizado');
    await expect(bioInput).toHaveValue('Colecionador experiente de arte generativa e NFTs raros.');
  });

  test('deve exibir erro de validação ao tentar alterar senha com senha atual incorreta', async ({ page }) => {
    await gotoProtectedAsAlexandre(page, '/profile');
    await page.locator('#current-password').fill('senhaCompletamenteErrada');
    await page.locator('#new-password').fill('novaSenhaSegura123');
    await page.locator('#confirm-password').fill('novaSenhaSegura123');
    await page
      .locator('section[aria-labelledby="profile-password-heading"]')
      .getByRole('button', { name: 'Salvar' })
      .click();

    await expect(page.getByRole('alert')).toContainText(/senha atual.*incorreta/i);
  });

  test('deve cadastrar nova carteira com validação e editar configurações', async ({ page }) => {
    await gotoProtectedAsAlexandre(page, '/wallets');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Carteiras/i);

    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Cadastrar Nova Carteira/i })).toBeVisible();

    await page.locator('#create-wallet-name').fill('Carteira Vault Fria');
    await page.locator('#create-wallet-address').fill('0x71C8451C3C4f77341D2Ab64F1E32312534c1f299');
    // Carteiras secundárias são exibidas como cards; a principal aparece como formulário.
    await page.locator('#create-wallet-type').selectOption('secondary');
    await page.getByRole('dialog').getByRole('button', { name: /Salvar carteira/i }).click();

    await expect(page.getByText('Carteira Vault Fria')).toBeVisible();

    const walletItem = page
      .locator('section[aria-labelledby="secondary-wallet-heading"] li')
      .filter({ hasText: 'Carteira Vault Fria' });
    await walletItem.getByRole('button', { name: 'Editar' }).click();
    await expect(page.getByRole('heading', { name: /Editar Carteira/i })).toBeVisible();

    const defaultCheckbox = page.getByLabel(/Definir como carteira padrão para compras/i);
    if (!(await defaultCheckbox.isChecked())) {
      await defaultCheckbox.check();
    }

    await page.getByRole('dialog').getByRole('button', { name: /Atualizar carteira/i }).click();
    await page.reload();
    await expect(page.getByText('Carteira Vault Fria')).toBeVisible();
  });
});
