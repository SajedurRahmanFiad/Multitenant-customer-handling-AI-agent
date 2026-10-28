export type SymbolPosition = 'before' | 'after';

export interface CustomCurrency {
  id: string;
  code: string; // e.g. "BDT", "USD", "EUR", "GBP", "INR", "AED", "SAR", "CAD"
  name: string; // e.g. "Bangladeshi Taka", "US Dollar", "Euro"
  symbol: string; // e.g. "৳", "$", "€", "£", "₹", "د.إ", "﷼"
  symbolPosition: SymbolPosition;
  symbolSpacing: boolean; // true: "৳ 1,200", false: "$1,200"
  exchangeRateFromUSD: number; // 1 USD = X in this currency (e.g. 1 USD = 122.50 BDT, 1 USD = 0.92 EUR)
  decimalPlaces: number; // e.g. 0 for BDT, 2 for USD/EUR
  thousandsSeparator: string; // ",", ".", " "
  decimalSeparator: string; // ".", ","
  isPlatformDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  description?: string;
}

export const INITIAL_CURRENCIES: CustomCurrency[] = [
  {
    id: 'curr_bdt',
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    symbolPosition: 'before',
    symbolSpacing: true,
    exchangeRateFromUSD: 122.50,
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isPlatformDefault: false,
    isActive: true,
    createdAt: 'Default System Currency',
    description: 'National currency of Bangladesh (Default for local e-commerce tenants)',
  },
  {
    id: 'curr_usd',
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolPosition: 'before',
    symbolSpacing: false,
    exchangeRateFromUSD: 1.00,
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isPlatformDefault: true,
    isActive: true,
    createdAt: 'Base Standard Currency',
    description: 'Global benchmark currency for AI API tokens and infrastructure billing',
  },
  {
    id: 'curr_eur',
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolPosition: 'after',
    symbolSpacing: true,
    exchangeRateFromUSD: 0.92,
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    isPlatformDefault: false,
    isActive: true,
    createdAt: 'Oct 20, 2026',
    description: 'European Union single market currency',
  },
  {
    id: 'curr_gbp',
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    symbolPosition: 'before',
    symbolSpacing: false,
    exchangeRateFromUSD: 0.78,
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isPlatformDefault: false,
    isActive: true,
    createdAt: 'Oct 22, 2026',
    description: 'United Kingdom pound sterling',
  },
  {
    id: 'curr_aed',
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    symbolPosition: 'before',
    symbolSpacing: true,
    exchangeRateFromUSD: 3.67,
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isPlatformDefault: false,
    isActive: true,
    createdAt: 'Oct 25, 2026',
    description: 'United Arab Emirates dirham for GCC regional stores',
  },
  {
    id: 'curr_inr',
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    symbolPosition: 'before',
    symbolSpacing: true,
    exchangeRateFromUSD: 84.10,
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isPlatformDefault: false,
    isActive: true,
    createdAt: 'Oct 26, 2026',
    description: 'Indian Rupee cross-border trade',
  },
];

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
