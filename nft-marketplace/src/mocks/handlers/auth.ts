import { http, HttpResponse } from 'msw';
import { mockDb } from '../db';
import { scenarioManager } from '../scenarios';
import { applyScenarioInterceptors } from './middleware';

export const authHandlers = [
  // 1. POST /api/auth/register
  http.post('/api/auth/register', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const scenario = scenarioManager.getActiveScenario();
    if (scenario === 'register_conflict') {
      return HttpResponse.json(
        {
          code: 'CONFLICT',
          message: 'Este endereço de e-mail já está em uso por outro colecionador.',
          status: 409,
          details: { email: ['E-mail já cadastrado'] },
        },
        { status: 409 }
      );
    }

    if (scenario === 'validation_error') {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Dados de cadastro inválidos.',
          status: 400,
          details: {
            name: ['O nome deve ter no mínimo 3 caracteres'],
            password: ['A senha deve conter no mínimo 8 caracteres'],
          },
        },
        { status: 400 }
      );
    }

    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    if (!body.name || !body.email || !body.password) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Todos os campos são obrigatórios.',
          status: 400,
        },
        { status: 400 }
      );
    }

    const existing = mockDb.getUserByEmail(body.email);
    if (existing) {
      return HttpResponse.json(
        {
          code: 'CONFLICT',
          message: 'E-mail já cadastrado.',
          status: 409,
        },
        { status: 409 }
      );
    }

    const { user, token } = mockDb.registerUser(body.name, body.email, body.password);

    // Merge carrinho do visitante no carrinho do novo usuário
    const guestCartKey = request.headers.get('X-Cart-Session') || 'cart_guest_default';
    mockDb.mergeGuestCartIntoUserCart(guestCartKey, `cart_user_${user.id}`);

    return HttpResponse.json(
      {
        user,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24h
      },
      { status: 201 }
    );
  }),

  // 2. POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'E-mail e senha são obrigatórios.',
          status: 400,
        },
        { status: 400 }
      );
    }

    const auth = mockDb.loginUser(body.email, body.password);
    if (!auth) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Credenciais inválidas. Verifique seu e-mail e senha.',
          status: 401,
        },
        { status: 401 }
      );
    }

    // Merge carrinho do visitante no carrinho do usuário autenticado
    const guestCartKey = request.headers.get('X-Cart-Session') || 'cart_guest_default';
    mockDb.mergeGuestCartIntoUserCart(guestCartKey, `cart_user_${auth.user.id}`);

    return HttpResponse.json({
      user: auth.user,
      token: auth.token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    });
  }),

  // 3. GET /api/auth/session
  http.get('/api/auth/session', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const scenario = scenarioManager.getActiveScenario();
    if (scenario === 'session_expired') {
      return HttpResponse.json(
        {
          code: 'SESSION_EXPIRED',
          message: 'Sua sessão expirou. Faça login novamente.',
          status: 401,
        },
        { status: 401 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);

    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Sessão inexistente ou inválida.',
          status: 401,
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      user,
      valid: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    });
  }),

  // 4. POST /api/auth/logout
  http.post('/api/auth/logout', async () => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    return HttpResponse.json({ success: true });
  }),
];
