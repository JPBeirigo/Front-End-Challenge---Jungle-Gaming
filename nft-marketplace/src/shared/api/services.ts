import { apiClient } from './client';
import type {
  AuthSession,
  Cart,
  AddToCartRequest,
  UpdateCartItemRequest,
  ChangePasswordRequest,
  CreateOrderRequest,
  CreateWalletRequest,
  FavoritesResponse,
  LoginRequest,
  NFTFilterParams,
  NFTItem,
  Order,
  PaginatedResponse,
  QuoteRequest,
  QuoteResponse,
  RegisterRequest,
  SessionResponse,
  UpdateProfileRequest,
  UpdateWalletRequest,
  User,
  Wallet,
} from '../types/contracts';

// ==========================================
// 1. Sessão e Autenticação
// ==========================================
export const authApi = {
  async register(data: RegisterRequest): Promise<AuthSession> {
    const res = await apiClient.post<AuthSession>('/auth/register', data);
    return res.data;
  },

  async login(data: LoginRequest): Promise<AuthSession> {
    const res = await apiClient.post<AuthSession>('/auth/login', data);
    return res.data;
  },

  async getSession(signal?: AbortSignal): Promise<SessionResponse> {
    const res = await apiClient.get<SessionResponse>('/auth/session', { signal });
    return res.data;
  },

  async logout(): Promise<{ success: boolean }> {
    const res = await apiClient.post<{ success: boolean }>('/auth/logout');
    return res.data;
  },
};

// ==========================================
// 2. NFTs e Catálogo
// ==========================================
export const nftsApi = {
  async list(
    params?: NFTFilterParams,
    signal?: AbortSignal
  ): Promise<PaginatedResponse<NFTItem>> {
    const res = await apiClient.get<PaginatedResponse<NFTItem>>('/nfts', {
      params,
      signal,
    });
    return res.data;
  },

  async getById(id: string, signal?: AbortSignal): Promise<NFTItem> {
    const res = await apiClient.get<NFTItem>(`/nfts/${id}`, { signal });
    return res.data;
  },
};

// ==========================================
// 3. Favoritos
// ==========================================
export const favoritesApi = {
  async list(signal?: AbortSignal): Promise<FavoritesResponse> {
    const res = await apiClient.get<FavoritesResponse>('/favorites', { signal });
    return res.data;
  },

  async add(nftId: string): Promise<{ success: boolean; isFavorite: boolean }> {
    const res = await apiClient.post<{ success: boolean; isFavorite: boolean }>(
      `/favorites/${nftId}`
    );
    return res.data;
  },

  async remove(nftId: string): Promise<{ success: boolean; isFavorite: boolean }> {
    const res = await apiClient.delete<{ success: boolean; isFavorite: boolean }>(
      `/favorites/${nftId}`
    );
    return res.data;
  },
};

// ==========================================
// 4. Carrinho
// ==========================================
export const cartApi = {
  async get(signal?: AbortSignal): Promise<Cart> {
    const res = await apiClient.get<Cart>('/cart', { signal });
    return res.data;
  },

  async addItem(data: AddToCartRequest): Promise<Cart> {
    const res = await apiClient.post<Cart>('/cart/items', data);
    return res.data;
  },

  async updateItem(data: UpdateCartItemRequest): Promise<Cart> {
    const res = await apiClient.put<Cart>('/cart/items', data);
    return res.data;
  },

  async removeItem(nftId: string, editionId: string): Promise<Cart> {
    const res = await apiClient.delete<Cart>(`/cart/items/${nftId}/${editionId}`);
    return res.data;
  },

  async applyCoupon(code: string): Promise<Cart> {
    const res = await apiClient.post<Cart>('/cart/coupon', { code });
    return res.data;
  },

  async removeCoupon(): Promise<Cart> {
    const res = await apiClient.delete<Cart>('/cart/coupon');
    return res.data;
  },
};

// ==========================================
// 5. Cotação (Quote)
// ==========================================
export const quoteApi = {
  async getQuote(data: QuoteRequest, signal?: AbortSignal): Promise<QuoteResponse> {
    const res = await apiClient.post<QuoteResponse>('/quote', data, { signal });
    return res.data;
  },
};

// ==========================================
// 6. Pedidos (Orders)
// ==========================================
export const ordersApi = {
  async create(data: CreateOrderRequest): Promise<Order> {
    const res = await apiClient.post<Order>('/orders', data, {
      headers: {
        'Idempotency-Key': data.idempotencyKey,
      },
    });
    return res.data;
  },

  async getById(orderId: string, signal?: AbortSignal): Promise<Order> {
    const res = await apiClient.get<Order>(`/orders/${orderId}`, { signal });
    return res.data;
  },
};

// ==========================================
// 7. Perfil
// ==========================================
export const profileApi = {
  async get(signal?: AbortSignal): Promise<User> {
    const res = await apiClient.get<User>('/profile', { signal });
    return res.data;
  },

  async update(data: UpdateProfileRequest): Promise<User> {
    const res = await apiClient.put<User>('/profile', data);
    return res.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean }> {
    const res = await apiClient.post<{ success: boolean }>(
      '/profile/change-password',
      data
    );
    return res.data;
  },
};

// ==========================================
// 8. Carteiras (Wallets)
// ==========================================
export const walletsApi = {
  async list(signal?: AbortSignal): Promise<Wallet[]> {
    const res = await apiClient.get<Wallet[]>('/wallets', { signal });
    return res.data;
  },

  async create(data: CreateWalletRequest): Promise<Wallet> {
    const res = await apiClient.post<Wallet>('/wallets', data);
    return res.data;
  },

  async update(id: string, data: UpdateWalletRequest): Promise<Wallet> {
    const res = await apiClient.put<Wallet>(`/wallets/${id}`, data);
    return res.data;
  },
};
