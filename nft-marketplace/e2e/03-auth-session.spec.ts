import { test, expect } from '@playwright/test';
import { resetBrowserStorage, setMockScenario } from './test-helpers';

test.describe('Cenário 3: Autenticação, Sessão, Expiração e Troca de Usuário', () => {
  test.beforeEach(async ({ page }) => {
    await resetBrowserStorage(page);
  });

  test('deve redirecionar usuário não autenticado ao tentar acessar /profile com retorno após login', async ({ page }) => {
    // Acessa rota protegida diretamente
    await page.goto('/profile');

    // Deve ser redirecionado para /login preservando o parâmetro redirect
    await expect(page).toHaveURL(/\/login.*redirect=%2Fprofile/);
    await expect(page.getByText('Acesse sua conta', { exact: false })).toBeVisible();

    // Preenche credenciais da conta de exemplo
    await page.locator('#email').fill('alexandre@example.com');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: /Entrar/i }).click();

    // Deve redirecionar de volta para /profile
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Perfil do colecionador');
    await expect(page.locator('#user-menu-button')).toBeVisible();
  });

  test('deve exibir erros de validação ao submeter campos inválidos no login', async ({ page }) => {
    await page.goto('/login');

    // Tenta submeter form em branco
    await page.getByRole('button', { name: /Entrar/i }).click();

    // Validações Zod
    await expect(page.getByText(/O e-mail é obrigatório/i)).toBeVisible();
    await expect(page.getByText(/A senha deve conter no mínimo 6 caracteres/i)).toBeVisible();

    // Preenche credenciais incorretas
    await page.locator('#email').fill('naoexiste@example.com');
    await page.locator('#password').fill('senhaErrada123');
    await page.getByRole('button', { name: /Entrar/i }).click();

    // Erro retornado pela API simulada
    await expect(page.getByRole('alert').filter({ hasText: /Credenciais inválidas/i })).toBeVisible();
  });

  test('deve realizar cadastro de novo colecionador e tratar conflito de e-mail (409)', async ({ page }) => {
    await page.goto('/register');

    // Tenta cadastrar com e-mail já existente (Alexandre)
    await page.getByLabel(/Usuário/i).fill('Alexandre Clone');
    await page.locator('#email').fill('alexandre@example.com');
    await page.locator('#password').fill('senhaForte123');
    await page.locator('#confirmPassword').fill('senhaForte123');
    await page.getByRole('button', { name: /Criar conta/i }).click();

    // Erro de conflito HTTP 409
    await expect(page.getByRole('alert').filter({ hasText: /E-mail já cadastrado/i })).toBeVisible();

    // Agora gera dados únicos e realiza cadastro com sucesso
    const uniqueEmail = `novo_${Date.now()}@example.com`;
    await page.getByLabel(/Usuário/i).fill('Colecionador Inédito');
    await page.locator('#email').fill(uniqueEmail);
    await page.getByRole('button', { name: /Criar conta/i }).click();

    // Deve ser redirecionado para a home autenticado
    await expect(page).toHaveURL('/');
    // Navbar deve exibir o novo usuário logado
    await expect(page.locator('#user-menu-button')).toBeVisible();
    await expect(page.locator('#user-menu-button img')).toHaveAttribute('alt', /Colecionador Inédito/i);
  });

  test('deve tratar expiração de sessão durante a navegação e exigir novo login', async ({ page }) => {
    // 1. Faz login como Alexandre
    await page.goto('/login');
    await page.locator('#email').fill('alexandre@example.com');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page.locator('#user-menu-button')).toBeVisible();

    // 2. Simula expiração de sessão no mock (HTTP 401 Unauthorized)
    await setMockScenario(page, 'session_expired');

    // 3. Tenta acessar rota restrita (/wallets)
    await page.goto('/wallets');

    // Deve redirecionar para login informando sessão expirada ou exigindo reautenticação
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test('deve realizar logout completo, limpando dados da sessão e subscriptions', async ({ page }) => {
    // Faz login inicial com Alexandre
    await page.goto('/login');
    await page.locator('#email').fill('alexandre@example.com');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await expect(page).toHaveURL('/');
    const userMenuButton = page.locator('#user-menu-button');
    await expect(userMenuButton).toBeVisible();

    // Abre dropdown e clica em Sair da Conta
    await userMenuButton.click();
    await page.getByRole('menuitem', { name: /Sair da Conta/i }).click();

    // Deve voltar ao estado deslogado
    await expect(page.getByRole('link', { name: /Entrar/i })).toBeVisible();
    await expect(page.locator('#user-menu-button')).not.toBeVisible();

    // Tentar acessar /profile deve redirecionar
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('deve permitir alternar de usuário (troca de conta) isolando dados', async ({ page }) => {
    // 1. Loga com Alexandre
    await page.goto('/login');
    await page.locator('#email').fill('alexandre@example.com');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page.locator('#user-menu-button')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#user-menu-button img')).toHaveAttribute('alt', /Alexandre/i);

    // 2. Faz logout
    await page.locator('#user-menu-button').click();
    await page.getByRole('menuitem', { name: /Sair da Conta/i }).click();

    // 3. Loga com Beatriz
    await page.goto('/login');
    await page.locator('#email').fill('beatriz@example.com');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page.locator('#user-menu-button')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#user-menu-button img')).toHaveAttribute('alt', /Beatriz/i);

    // 4. Confirma perfil de Beatriz
    await page.goto('/profile');
    await expect(page.locator('#user-menu-button')).toBeVisible();
    await expect(page.getByText('alexandre@example.com')).not.toBeVisible();
  });
});
