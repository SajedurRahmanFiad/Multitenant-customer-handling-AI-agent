export type SymbolPosition = 'before' | 'after';

export interface CustomCurrency {
  id: string;
  code: string; // e.g. "BDT", "USD", "EUR", "GBP", "INR", "AED", "SAR", "CAD"
  name: string; // e.g. "Bangladeshi Taka", "US Dollar", "Euro"
  symbol: string; // e.g. "à§³", "$", "â‚¬", "Â£", "â‚¹", "Ø¯.Ø¥", "ï·¼"
  symbolPosition: SymbolPosition;
  symbolSpacing: boolean; // true: "à§³ 1,200", false: "$1,200"
  exchangeRateFromUSD: number; // 1 USD = X in this currency (e.g. 1 USD = 122.50 BDT, 1 USD = 0.92 EUR)
  decimalPlaces: number; // e.g. 0 for BDT, 2 for USD/EUR
  thousandsSeparator: string; // ",", ".", " "
  decimalSeparator: string; // ".", ","
  isPlatformDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  description?: string;
}



/**
 * Format a raw amount already in the target currency
 */
export function formatCurrencyAmount(
  amount: number,
  currency: CustomCurrency
): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Format with decimal places
  const fixedStr = absAmount.toFixed(currency.decimalPlaces);
  const parts = fixedStr.split('.');
  let integerPart = parts[0];
  const fractionalPart = parts[1];

  // Apply thousands separator
  const thousandsRegex = /\B(?=(\d{3})+(?!\d))/g;
  integerPart = integerPart.replace(thousandsRegex, currency.thousandsSeparator);

  let formattedNumber = integerPart;
  if (currency.decimalPlaces > 0 && fractionalPart !== undefined) {
    formattedNumber += currency.decimalSeparator + fractionalPart;
  }

  const space = currency.symbolSpacing ? ' ' : '';
  let result = '';

  if (currency.symbolPosition === 'before') {
    result = `${currency.symbol}${space}${formattedNumber}`;
  } else {
    result = `${formattedNumber}${space}${currency.symbol}`;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Convert an amount from USD into the target currency and format it
 */
export function convertAndFormatUSD(
  amountUSD: number,
  currency: CustomCurrency
): string {
  const converted = amountUSD * currency.exchangeRateFromUSD;
  return formatCurrencyAmount(converted, currency);
}
