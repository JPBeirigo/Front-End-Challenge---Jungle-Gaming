import { http, HttpResponse } from 'msw';
import { mockDb } from '../db';
import { applyScenarioInterceptors } from './middleware';

export const profileHandlers = [
  // 1. GET /api/profile
  http.get('/api/profile', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Você precisa estar autenticado para acessar seu perfil.',
          status: 401,
        },
        { status: 401 }
      );
    }

    return HttpResponse.json(user);
  }),

  // 2. PUT /api/profile
  http.put('/api/profile', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Faça login para editar seu perfil.',
          status: 401,
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { name?: string; bio?: string; avatarUrl?: string };
    const updated = mockDb.updateUserProfile(user.id, body);
    return HttpResponse.json(updated);
  }),

  // 3. POST /api/profile/change-password
  http.post('/api/profile/change-password', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Faça login para alterar sua senha.',
          status: 401,
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
    if (!body.currentPassword || !body.newPassword) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Senha atual e nova senha são obrigatórias.',
          status: 400,
        },
        { status: 400 }
      );
    }

    const success = mockDb.changeUserPassword(user.id, body.currentPassword, body.newPassword);
    if (!success) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'A senha atual informada está incorreta.',
          status: 400,
          details: { currentPassword: ['Senha atual incorreta'] },
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({ success: true });
  }),
];
