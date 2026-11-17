import Decimal from 'decimal.js';

// Configuração de precisão segura para ETH (18 casas decimais como padrão ERC-20 / ETH)
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/**
 * Soma dois valores em ETH trafegados como string decimal.
 * Nunca utiliza `number` nativo para garantir precisão exata.
 */
export function addEth(a: string, b: string): string {
  return new Decimal(a || '0').plus(new Decimal(b || '0')).toFixed(4);
}

/**
 * Subtrai b de a (a - b) em ETH.
 */
export function subtractEth(a: string, b: string): string {
  const result = new Decimal(a || '0').minus(new Decimal(b || '0'));
  return result.isNegative() ? '0.0000' : result.toFixed(4);
}

/**
 * Multiplica valor em ETH por uma quantidade inteira ou multiplicador.
 */
export function multiplyEth(priceEth: string, quantity: number | string): string {
  const qty = new Decimal(quantity || '0');
  const price = new Decimal(priceEth || '0');
  return price.times(qty).toFixed(4);
}

/**
 * Aplica um percentual de desconto sobre um valor em ETH.
 * Ex: applyDiscountEth("1.5000", 10) => "0.1500" (o valor do desconto)
 */
export function calculateDiscountEth(valueEth: string, discountPercentage: number): string {
  if (discountPercentage <= 0) return '0.0000';
  const val = new Decimal(valueEth || '0');
  const pct = new Decimal(discountPercentage).dividedBy(100);
  return val.times(pct).toFixed(4);
}

/**
 * Compara dois valores decimais de ETH.
 * Retorna 1 se a > b, -1 se a < b, 0 se a === b.
 */
export function compareEth(a: string, b: string): number {
  return new Decimal(a || '0').comparedTo(new Decimal(b || '0'));
}

/**
 * Valida se uma string é um número decimal válido e positivo para ETH.
 */
export function isValidEth(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  try {
    const d = new Decimal(value);
    return !d.isNaN() && d.isPositive();
  } catch {
    return false;
  }
}

/**
 * Formata um valor em ETH para exibição amigável na UI.
 * Ex: formatEthDisplay("0.5") => "0.5000 ETH"
 */
export function formatEthDisplay(value: string, showSymbol = true): string {
  try {
    const d = new Decimal(value || '0');
    const formatted = d.toFixed(4);
    return showSymbol ? `${formatted} ETH` : formatted;
  } catch {
    return showSymbol ? '0.0000 ETH' : '0.0000';
  }
}
