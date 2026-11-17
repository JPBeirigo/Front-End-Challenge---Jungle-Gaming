/**
 * Contratos e Modelos de Domínio Tipados do NFT Marketplace
 * Especificação unificada entre Transporte (REST/Socket), Estado (Query) e UI.
 */

// ==========================================
// 1. Sessão, Autenticação e Conta
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SessionResponse {
  user: User;
  valid: boolean;
  expiresAt: string;
}

// ==========================================
// 2. Perfil do Colecionador
// ==========================================

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ==========================================
// 3. Carteiras (Wallets)
// ==========================================

export type WalletType = 'primary' | 'secondary';

export interface Wallet {
  id: string;
  userId: string;
  address: string;
  name: string;
  type: WalletType;
  network: string; // ex: 'Ethereum Mainnet', 'Sepolia', 'Polygon'
  balanceEth: string; // Representado estritamente como string decimal
  isDefault: boolean;
  createdAt: string;
}

export interface CreateWalletRequest {
  address: string;
  name: string;
  type: WalletType;
  network: string;
}

export interface UpdateWalletRequest {
  name?: string;
  type?: WalletType;
  isDefault?: boolean;
}

// ==========================================
// 4. NFTs e Catálogo
// ==========================================

export interface Creator {
  id: string;
  name: string;
  avatarUrl: string;
  verified?: boolean;
}

export interface NFTEdition {
  id: string;
  editionNumber: number;
  totalEditions: number;
  available: boolean;
  priceEth: string; // Ex: "0.4500"
}

export type NFTCategory = 'all' | 'art' | 'collectibles' | 'photography' | 'virtual-worlds';
export type NFTSortBy = 'popular' | 'price_asc' | 'price_desc' | 'newest';

export interface NFTItem {
  id: string;
  title: string;
  creator: Creator;
  description: string;
  imageUrl: string;
  priceEth: string; // Preço de referência
  currency: 'ETH';
  category: string;
  editions: NFTEdition[];
  totalAvailable: number;
  isFavorite?: boolean;
  viewsCount?: number;
  likesCount?: number;
  featured?: boolean;
  version: number; // Controle de concorrência / atualizações em tempo real
}

export interface NFTFilterParams {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: NFTSortBy;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==========================================
// 5. Favoritos
// ==========================================

export interface FavoriteItem {
  nftId: string;
  addedAt: string;
}

export interface FavoritesResponse {
  items: NFTItem[];
  total: number;
}

// ==========================================
// 6. Carrinho
// ==========================================

export interface CartItem {
  nftId: string;
  editionId: string;
  editionNumber: number;
  quantity: number; // Inteiro
  priceEth: string; // String decimal
  title: string;
  imageUrl: string;
  creatorName: string;
  maxAvailable: number;
}

export interface Cart {
  items: CartItem[];
  couponCode?: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  nftId: string;
  editionId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  nftId: string;
  editionId: string;
  quantity: number;
}

// ==========================================
// 7. Cotação (Quote)
// ==========================================

export interface ItemVerification {
  nftId: string;
  editionId: string;
  available: boolean;
  currentPriceEth: string;
  changed: boolean;
}

export interface CouponInfo {
  code: string;
  discountPercentage: number;
}

export interface QuoteRequest {
  items: Array<{
    nftId: string;
    editionId: string;
    quantity: number;
  }>;
  couponCode?: string;
}

export interface QuoteResponse {
  subtotalEth: string;
  discountEth: string;
  networkFeeEth: string;
  totalEth: string;
  couponApplied?: CouponInfo | null;
  itemsVerified: ItemVerification[];
  expiresAt: string;
  valid: boolean;
}

// ==========================================
// 8. Pedidos e Confirmação (Orders)
// ==========================================

export type OrderStatus = 'pending' | 'confirmed' | 'failed';

export interface OrderItemSnapshot {
  nftId: string;
  editionId: string;
  editionNumber: number;
  title: string;
  imageUrl: string;
  creatorName: string;
  quantity: number;
  unitPriceEth: string;
  subtotalEth: string;
}

export interface CollectorInfo {
  fullName: string;
  email: string;
  phone?: string;
}

export interface Order {
  id: string;
  idempotencyKey: string;
  userId: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  subtotalEth: string;
  discountEth: string;
  networkFeeEth: string;
  totalEth: string;
  collectorInfo: CollectorInfo;
  walletAddress: string;
  network: string;
  transactionHash?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateOrderRequest {
  idempotencyKey: string;
  collectorInfo: CollectorInfo;
  walletAddress: string;
  network: string;
  items: Array<{
    nftId: string;
    editionId: string;
    quantity: number;
    priceEth: string;
  }>;
  couponCode?: string;
}

// ==========================================
// 9. Eventos em Tempo Real (Socket.IO)
// ==========================================

export interface RealtimeEventPayload<T> {
  id: string;
  resource: 'nft' | 'order';
  version: number;
  userId?: string;
  timestamp: string;
  data: T;
}

export interface NFTUpdatedData {
  nftId: string;
  priceEth: string;
  totalAvailable: number;
  editions?: Array<{
    id: string;
    available: boolean;
    priceEth: string;
  }>;
}

export interface OrderUpdatedData {
  orderId: string;
  status: OrderStatus;
  transactionHash?: string;
  failureReason?: string;
}

export type NFTUpdatedEvent = RealtimeEventPayload<NFTUpdatedData>;
export type OrderUpdatedEvent = RealtimeEventPayload<OrderUpdatedData>;
