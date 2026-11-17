import type {
  Cart,
  NFTItem,
  Order,
  OrderStatus,
  User,
  Wallet,
} from '../shared/types/contracts';
import { INITIAL_USERS, INITIAL_WALLETS, INITIAL_NFTS, INITIAL_COUPONS } from './fixtures/data';
import { addEth, subtractEth, multiplyEth, calculateDiscountEth } from '../shared/utils/currency';

const STORAGE_PREFIX = 'nft_mock_db_';

interface IdempotencyRecord {
  orderId: string;
  fingerprint: string;
  createdAt: string;
}

export class MockDatabase {
  private users: User[] = [];
  private passwords: Record<string, string> = {}; // email -> password
  private tokens: Record<string, string> = {}; // token -> userId
  private nfts: NFTItem[] = [];
  private favorites: Record<string, string[]> = {}; // userId -> nftIds[]
  private carts: Record<string, Cart> = {}; // userId/guestId -> Cart
  private wallets: Record<string, Wallet[]> = {}; // userId -> Wallet[]
  private orders: Order[] = [];
  private idempotencyRecords: Record<string, IdempotencyRecord> = {}; // key -> record

  constructor() {
    this.init();
  }

  public init() {
    const persisted = this.loadFromStorage();
    if (persisted) {
      this.users = persisted.users;
      this.passwords = persisted.passwords;
      this.tokens = persisted.tokens;
      this.nfts = persisted.nfts;
      this.favorites = persisted.favorites;
      this.carts = persisted.carts;
      this.wallets = persisted.wallets;
      this.orders = persisted.orders;
      this.idempotencyRecords = persisted.idempotencyRecords;
    } else {
      this.reset();
    }
  }

  public reset() {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.passwords = {
      'alexandre@example.com': 'password123',
      'beatriz@example.com': 'password123',
    };
    this.tokens = {
      token_user_1: 'user_1',
      token_user_2: 'user_2',
    };
    this.nfts = JSON.parse(JSON.stringify(INITIAL_NFTS));
    this.favorites = {
      user_1: ['nft_1', 'nft_2'],
      user_2: ['nft_3', 'nft_4'],
    };
    this.carts = {};
    this.wallets = JSON.parse(JSON.stringify(INITIAL_WALLETS));
    this.orders = [];
    this.idempotencyRecords = {};

    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      const data = {
        users: this.users,
        passwords: this.passwords,
        tokens: this.tokens,
        nfts: this.nfts,
        favorites: this.favorites,
        carts: this.carts,
        wallets: this.wallets,
        orders: this.orders,
        idempotencyRecords: this.idempotencyRecords,
      };
      localStorage.setItem(`${STORAGE_PREFIX}state`, JSON.stringify(data));
    } catch (e) {
      console.warn('Falha ao persistir mock db no localStorage:', e);
    }
  }

  private loadFromStorage() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(`${STORAGE_PREFIX}state`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // --- Auth & Users ---
  public getUserByToken(token?: string): User | null {
    if (!token) return null;
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    const userId = this.tokens[cleanToken];
    if (!userId) return null;
    return this.users.find((u) => u.id === userId) || null;
  }

  public getUserById(userId: string): User | null {
    return this.users.find((u) => u.id === userId) || null;
  }

  public getUserByEmail(email: string): User | null {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public registerUser(name: string, email: string, passwordHash: string): { user: User; token: string } {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.passwords[email.toLowerCase()] = passwordHash;
    const token = `token_${newUser.id}`;
    this.tokens[token] = newUser.id;

    // Cria carteira padrão para novo usuário
    this.wallets[newUser.id] = [
      {
        id: `wallet_${Date.now()}`,
        userId: newUser.id,
        address: '0x' + Math.random().toString(16).substring(2, 10) + '...a1b2',
        name: 'Carteira Principal',
        type: 'primary',
        network: 'Ethereum Mainnet',
        balanceEth: '1.5000',
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
    ];

    this.saveToStorage();
    return { user: newUser, token };
  }

  public loginUser(email: string, passwordPlain: string): { user: User; token: string } | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    const storedPass = this.passwords[email.toLowerCase()];
    if (storedPass !== passwordPlain) return null;

    const token = `token_${user.id}`;
    this.tokens[token] = user.id;
    this.saveToStorage();
    return { user, token };
  }

  public updateUserProfile(userId: string, updates: Partial<User>): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;
    if (updates.name) user.name = updates.name;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl;
    this.saveToStorage();
    return user;
  }

  public changeUserPassword(userId: string, currentPass: string, newPass: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    const currentStored = this.passwords[user.email.toLowerCase()];
    if (currentStored !== currentPass) return false;
    this.passwords[user.email.toLowerCase()] = newPass;
    this.saveToStorage();
    return true;
  }

  // --- NFTs ---
  public getNFTs(): NFTItem[] {
    return this.nfts;
  }

  public getNFTById(id: string): NFTItem | null {
    return this.nfts.find((n) => n.id === id) || null;
  }

  public updateNFTPriceOrAvailability(
    nftId: string,
    newPriceEth?: string,
    totalAvailable?: number
  ): NFTItem | null {
    const nft = this.getNFTById(nftId);
    if (!nft) return null;
    if (newPriceEth) {
      nft.priceEth = newPriceEth;
      nft.editions.forEach((ed) => {
        ed.priceEth = newPriceEth;
      });
    }
    if (totalAvailable !== undefined) {
      nft.totalAvailable = totalAvailable;
      if (totalAvailable === 0) {
        nft.editions.forEach((ed) => {
          ed.available = false;
        });
      }
    }
    nft.version += 1;
    this.saveToStorage();
    return nft;
  }

  // --- Favorites ---
  public getFavorites(userId: string): NFTItem[] {
    const ids = this.favorites[userId] || [];
    return this.nfts.filter((n) => ids.includes(n.id));
  }

  public isFavorite(userId: string, nftId: string): boolean {
    const ids = this.favorites[userId] || [];
    return ids.includes(nftId);
  }

  public addFavorite(userId: string, nftId: string): boolean {
    if (!this.favorites[userId]) this.favorites[userId] = [];
    if (!this.favorites[userId].includes(nftId)) {
      this.favorites[userId].push(nftId);
      this.saveToStorage();
    }
    return true;
  }

  public removeFavorite(userId: string, nftId: string): boolean {
    if (!this.favorites[userId]) return false;
    this.favorites[userId] = this.favorites[userId].filter((id) => id !== nftId);
    this.saveToStorage();
    return true;
  }

  // --- Cart ---
  public getCart(cartKey: string): Cart {
    if (!this.carts[cartKey]) {
      this.carts[cartKey] = {
        items: [],
        updatedAt: new Date().toISOString(),
      };
    }
    return this.carts[cartKey];
  }

  public addItemToCart(
    cartKey: string,
    nftId: string,
    editionId: string,
    quantity: number
  ): Cart {
    const cart = this.getCart(cartKey);
    const nft = this.getNFTById(nftId);
    if (!nft) throw new Error('NFT não encontrado');
    const edition = nft.editions.find((e) => e.id === editionId);
    if (!edition || !edition.available) throw new Error('Edição indisponível');

    const existingIndex = cart.items.findIndex(
      (item) => item.nftId === nftId && item.editionId === editionId
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        nftId,
        editionId,
        editionNumber: edition.editionNumber,
        quantity,
        priceEth: edition.priceEth,
        title: nft.title,
        imageUrl: nft.imageUrl,
        creatorName: nft.creator.name,
        maxAvailable: nft.totalAvailable,
      });
    }
    cart.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return cart;
  }

  public updateCartItem(
    cartKey: string,
    nftId: string,
    editionId: string,
    quantity: number
  ): Cart {
    const cart = this.getCart(cartKey);
    const itemIndex = cart.items.findIndex(
      (item) => item.nftId === nftId && item.editionId === editionId
    );
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
    }
    cart.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return cart;
  }

  public removeCartItem(cartKey: string, nftId: string, editionId: string): Cart {
    const cart = this.getCart(cartKey);
    cart.items = cart.items.filter(
      (item) => !(item.nftId === nftId && item.editionId === editionId)
    );
    cart.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return cart;
  }

  public applyCouponToCart(cartKey: string, couponCode: string): Cart {
    const cart = this.getCart(cartKey);
    const coupon = INITIAL_COUPONS[couponCode.toUpperCase()];
    if (!coupon || !coupon.valid) {
      throw new Error(coupon?.expired ? 'Cupom expirado' : 'Cupom inválido');
    }
    cart.couponCode = coupon.code;
    cart.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return cart;
  }

  public removeCouponFromCart(cartKey: string): Cart {
    const cart = this.getCart(cartKey);
    delete cart.couponCode;
    cart.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return cart;
  }

  public mergeGuestCartIntoUserCart(guestCartKey: string, userCartKey: string): Cart {
    const guestCart = this.carts[guestCartKey];
    if (!guestCart || guestCart.items.length === 0) {
      return this.getCart(userCartKey);
    }
    const userCart = this.getCart(userCartKey);

    guestCart.items.forEach((gItem) => {
      const existing = userCart.items.find(
        (uItem) => uItem.nftId === gItem.nftId && uItem.editionId === gItem.editionId
      );
      if (existing) {
        existing.quantity += gItem.quantity;
      } else {
        userCart.items.push({ ...gItem });
      }
    });

    if (guestCart.couponCode && !userCart.couponCode) {
      userCart.couponCode = guestCart.couponCode;
    }

    delete this.carts[guestCartKey];
    userCart.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return userCart;
  }

  // --- Quote Calculation ---
  public calculateQuote(
    items: Array<{ nftId: string; editionId: string; quantity: number }>,
    couponCode?: string
  ) {
    let subtotalEth = '0.0000';
    const itemsVerified = items.map((item) => {
      const nft = this.getNFTById(item.nftId);
      const edition = nft?.editions.find((e) => e.id === item.editionId);
      const available = !!(nft && edition && edition.available && nft.totalAvailable >= item.quantity);
      const currentPriceEth = edition?.priceEth || '0.0000';
      const itemSubtotal = multiplyEth(currentPriceEth, item.quantity);
      subtotalEth = addEth(subtotalEth, itemSubtotal);

      return {
        nftId: item.nftId,
        editionId: item.editionId,
        available,
        currentPriceEth,
        changed: false,
      };
    });

    let discountEth = '0.0000';
    let couponApplied = null;
    if (couponCode) {
      const coupon = INITIAL_COUPONS[couponCode.toUpperCase()];
      if (coupon && coupon.valid) {
        discountEth = calculateDiscountEth(subtotalEth, coupon.discountPercentage);
        couponApplied = {
          code: coupon.code,
          discountPercentage: coupon.discountPercentage,
        };
      }
    }

    const networkFeeEth = '0.0035'; // Taxa fixa de rede da simulação
    const withFee = addEth(subtotalEth, networkFeeEth);
    const finalTotal = subtotalEth === '0.0000' ? '0.0000' : subtractEth(withFee, discountEth);

    return {
      subtotalEth,
      discountEth,
      networkFeeEth,
      totalEth: finalTotal,
      couponApplied,
      itemsVerified,
      expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // 15 minutos
      valid: itemsVerified.every((i) => i.available),
    };
  }

  // --- Orders & Idempotency ---
  public getIdempotencyRecord(key: string): IdempotencyRecord | null {
    return this.idempotencyRecords[key] || null;
  }

  public getOrderById(orderId: string): Order | null {
    return this.orders.find((o) => o.id === orderId) || null;
  }

  public createOrder(
    idempotencyKey: string,
    fingerprint: string,
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): { order: Order; isReplay: boolean } {
    const existing = this.idempotencyRecords[idempotencyKey];
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new Error('CONFLICT_PAYLOAD');
      }
      const existingOrder = this.getOrderById(existing.orderId);
      if (existingOrder) {
        return { order: existingOrder, isReplay: true };
      }
    }

    const orderId = `ord_${Date.now()}`;
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    this.orders.push(newOrder);
    this.idempotencyRecords[idempotencyKey] = {
      orderId,
      fingerprint,
      createdAt: new Date().toISOString(),
    };

    this.saveToStorage();
    return { order: newOrder, isReplay: false };
  }

  public updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    transactionHash?: string,
    failureReason?: string
  ): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.status = status;
    if (transactionHash) order.transactionHash = transactionHash;
    if (failureReason) order.failureReason = failureReason;
    order.updatedAt = new Date().toISOString();
    order.version += 1;
    this.saveToStorage();
    return order;
  }

  // --- Wallets ---
  public getWallets(userId: string): Wallet[] {
    return this.wallets[userId] || [];
  }

  public createWallet(userId: string, data: Omit<Wallet, 'id' | 'userId' | 'createdAt'>): Wallet {
    if (!this.wallets[userId]) this.wallets[userId] = [];
    const newWallet: Wallet = {
      ...data,
      id: `wallet_${Date.now()}`,
      userId,
      createdAt: new Date().toISOString(),
    };
    if (newWallet.isDefault) {
      this.wallets[userId].forEach((w) => (w.isDefault = false));
    }
    this.wallets[userId].push(newWallet);
    this.saveToStorage();
    return newWallet;
  }

  public updateWallet(userId: string, walletId: string, updates: Partial<Wallet>): Wallet | null {
    const userWallets = this.wallets[userId] || [];
    const wallet = userWallets.find((w) => w.id === walletId);
    if (!wallet) return null;

    if (updates.name) wallet.name = updates.name;
    if (updates.type) wallet.type = updates.type;
    if (updates.isDefault) {
      userWallets.forEach((w) => (w.isDefault = false));
      wallet.isDefault = true;
    }
    this.saveToStorage();
    return wallet;
  }
}

export const mockDb = new MockDatabase();
