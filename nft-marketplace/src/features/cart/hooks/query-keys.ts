export const cartKeys = {
  all: (userId?: string) => ['cart', userId ?? 'guest'] as const,
  detail: (userId?: string) => [...cartKeys.all(userId), 'detail'] as const,
  quote: (userId?: string, itemsKey?: string, coupon?: string) =>
    [...cartKeys.all(userId), 'quote', itemsKey ?? '', coupon ?? ''] as const,
};
