const GUEST_CART_KEY = 'nft_marketplace_guest_cart_session';

export function getGuestCartId(): string {
  try {
    let guestId = localStorage.getItem(GUEST_CART_KEY);
    if (!guestId) {
      guestId = `guest_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      localStorage.setItem(GUEST_CART_KEY, guestId);
    }
    return guestId;
  } catch {
    return 'cart_guest_default';
  }
}

export function resetGuestCartId(): void {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Ignora erros de localStorage
  }
}
