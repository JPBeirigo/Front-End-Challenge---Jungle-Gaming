import type { User } from '../types/contracts';

const TOKEN_STORAGE_KEY = 'nft_marketplace_auth_token';
const USER_STORAGE_KEY = 'nft_marketplace_auth_user';

export type StoredUser = User;

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (e) {
      console.warn('Erro ao salvar token de autenticação:', e);
    }
  },

  getUser(): User | null {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser(user: User): void {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Erro ao salvar usuário no storage:', e);
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.warn('Erro ao limpar auth storage:', e);
    }
  },
};
