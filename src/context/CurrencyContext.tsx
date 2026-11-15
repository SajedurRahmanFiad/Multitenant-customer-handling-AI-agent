import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  CustomCurrency,
  formatCurrencyAmount,
  convertAndFormatUSD,
} from '../types/currency';
import { useAuth } from './AuthContext';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';

interface CurrencyContextType {
  currencies: CustomCurrency[];
  exchangeRatesByCode: Record<string, number>;
  exchangeRatesStatus: 'loading' | 'live' | 'unavailable';
  exchangeRatesUpdatedAt: number | null;
  platformDefaultCurrencyCode: string;
  platformDefaultCurrency: CustomCurrency;
  activeTenantCurrency: CustomCurrency;
  selectedTenantId: string;
  setSelectedTenantId: (tenantId: string) => void;
  getCurrency: (code?: string) => CustomCurrency;
  getTenantCurrency: (tenantId?: string) => CustomCurrency;
  formatForActiveTenant: (amountUSD: number) => string;
  formatForTenant: (amountUSD: number, tenantId?: string) => string;
  formatForPlatform: (amountUSD: number) => string;
  formatRawAmount: (amount: number, currencyCode?: string) => string;
  convertUSDToTenant: (amountUSD: number, tenantId?: string) => number;
  convertUSDToCurrency: (amountUSD: number, currencyCode: string) => number;
  addCurrency: (currency: CustomCurrency) => void;
  updateCurrency: (currency: CustomCurrency) => void;
  deleteCurrency: (code: string) => boolean;
  setPlatformDefaultCurrency: (code: string) => void;
  setTenantCurrency: (tenantId: string, currencyCode: string) => void;
  tenantCurrencyMap: Record<string, string>;

  // Wallet Balance & Message Pricing
  tenantBalances: Record<string, number>;
  tenantMessagePrices: Record<string, number>;
  getTenantBalance: (tenantId?: string) => number;
  getTenantPricePerMessage: (tenantId?: string) => number;
  rechargeTenantBalance: (amount: number, tenantId?: string) => void;
  deductMessageBalance: (tenantId?: string) => { success: boolean; newBalance: number; deducted: number };
  setTenantPricing: (tenantId: string, pricePerMessage: number, initialBalance?: number) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface ExchangeRateResponse {
  result?: string;
  time_last_update_unix?: number;
  rates?: Record<string, number>;
}

const USD_FALLBACK: CustomCurrency = {
  id: 'curr_usd',
  code: 'USD',
  name: 'US Dollar',
  symbol: '$',
  symbolPosition: 'before',
  symbolSpacing: false,
  exchangeRateFromUSD: 1,
  decimalPlaces: 2,
  thousandsSeparator: ',',
  decimalSeparator: '.',
  isPlatformDefault: true,
  isActive: true,
};

interface PlatformCurrenciesResponse {
  currencies: CustomCurrency[];
}

interface PlatformTenant {
  id: string;
  currencyCode: string;
  walletBalance: number;
  pricePerMessage: number;
}

interface WalletResponse {
  balance: number;
  currency: string;
  pricePerMessage: number;
}

export const CurrencyProvider: React.FC<{
  children: React.ReactNode;
  initialSelectedTenantId?: string;
}> = ({ children, initialSelectedTenantId = 'all' }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [currencies, setCurrencies] = useState<CustomCurrency[]>([USD_FALLBACK]);
  const [exchangeRatesByCode, setExchangeRatesByCode] = useState<Record<string, number>>({});
  const [exchangeRatesStatus, setExchangeRatesStatus] = useState<'loading' | 'live' | 'unavailable'>('loading');
  const [exchangeRatesUpdatedAt, setExchangeRatesUpdatedAt] = useState<number | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(initialSelectedTenantId);
  const currencyCodes = currencies.map((currency) => currency.code).sort().join(',');

  // Live currencies from the platform registry (reference data — all roles).
  const currenciesQ = useApiData<PlatformCurrenciesResponse>(user ? '/platform/currencies' : null);
  useEffect(() => {
    if (currenciesQ.data?.currencies?.length) {
      setCurrencies(currenciesQ.data.currencies);
    }
  }, [currenciesQ.data]);

  // Tenant financial config: full list for super admins, own wallet otherwise.
  const platformTenantsQ = useApiData<{ tenants: PlatformTenant[] }>(
    user && isSuperAdmin ? '/platform/tenants' : null
  );
  const walletQ = useApiData<WalletResponse>(
    user && !isSuperAdmin ? '/billing/wallet' : null
  );

  // Initialize tenant-to-currency mapping from live tenant data
  const [tenantCurrencyMap, setTenantCurrencyMap] = useState<Record<string, string>>({});
  const [tenantBalances, setTenantBalances] = useState<Record<string, number>>({});
  const [tenantMessagePrices, setTenantMessagePrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (platformTenantsQ.data?.tenants) {
      const cMap: Record<string, string> = {};
      const bMap: Record<string, number> = {};
      const pMap: Record<string, number> = {};
      platformTenantsQ.data.tenants.forEach((t) => {
        cMap[t.id] = t.currencyCode || 'USD';
        bMap[t.id] = Number(t.walletBalance ?? 0);
        pMap[t.id] = Number(t.pricePerMessage ?? 0);
      });
      setTenantCurrencyMap(cMap);
      setTenantBalances(bMap);
      setTenantMessagePrices(pMap);
    }
  }, [platformTenantsQ.data]);

  useEffect(() => {
    const wallet = walletQ.data;
    if (wallet && user) {
      setTenantCurrencyMap((prev) => ({ ...prev, [user.tenantId]: wallet.currency }));
      setTenantBalances((prev) => ({ ...prev, [user.tenantId]: Number(wallet.balance) }));
      setTenantMessagePrices((prev) => ({ ...prev, [user.tenantId]: Number(wallet.pricePerMessage) }));
    }
  }, [walletQ.data, user]);

  useEffect(() => {
    const controller = new AbortController();

    const refreshRates = () => {
      fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error('Exchange-rate request failed');
          return response.json() as Promise<ExchangeRateResponse>;
        })
        .then((data) => {
          if (data.result !== 'success' || !data.rates) {
            throw new Error('Exchange-rate response was invalid');
          }

          const ratesByCode = Object.fromEntries(
            Object.entries(data.rates)
              .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]))
              .map(([code, rate]) => [code.toUpperCase(), rate])
          );
          setExchangeRatesByCode(ratesByCode);
          setCurrencies((previous) => previous.map((currency) => {
            const rate = ratesByCode[currency.code.trim().toUpperCase()];
            return rate !== undefined
              ? { ...currency, exchangeRateFromUSD: rate }
              : currency;
          }));
          setExchangeRatesUpdatedAt(data.time_last_update_unix ?? Math.floor(Date.now() / 1000));
          setExchangeRatesStatus('live');
        })
        .catch(() => {
          if (!controller.signal.aborted) setExchangeRatesStatus('unavailable');
        });
    };

    refreshRates();
    const intervalId = window.setInterval(refreshRates, 24 * 60 * 60 * 1000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [currencyCodes]);

  // Determine platform default currency
  const platformDefaultCurrency = useMemo(() => {
    return (
      currencies.find((c) => c.isPlatformDefault && c.isActive) ||
      currencies.find((c) => c.code === 'USD') ||
      currencies[0] ||
      USD_FALLBACK
    );
  }, [currencies]);

  const platformDefaultCurrencyCode = platformDefaultCurrency.code;

  // Safe lookup for currency object
  const getCurrency = (code?: string): CustomCurrency => {
    if (!code) return platformDefaultCurrency;
    const found = currencies.find((c) => c.code.toUpperCase() === code.toUpperCase());
    return found || platformDefaultCurrency;
  };

  // Safe lookup for tenant's currency
  const getTenantCurrency = (tenantId?: string): CustomCurrency => {
    const targetId = tenantId || selectedTenantId;
    if (targetId === 'all') {
      return platformDefaultCurrency;
    }
    const currCode = tenantCurrencyMap[targetId];
    return getCurrency(currCode);
  };

  const activeTenantCurrency = useMemo(() => {
    return getTenantCurrency(selectedTenantId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenantId, tenantCurrencyMap, currencies, platformDefaultCurrency]);

  const formatForActiveTenant = (amountUSD: number): string => {
    return convertAndFormatUSD(amountUSD, activeTenantCurrency);
  };

  const formatForTenant = (amountUSD: number, tenantId?: string): string => {
    const currency = getTenantCurrency(tenantId);
    return convertAndFormatUSD(amountUSD, currency);
  };

  const formatForPlatform = (amountUSD: number): string => {
    return convertAndFormatUSD(amountUSD, platformDefaultCurrency);
  };

  const formatRawAmount = (amount: number, currencyCode?: string): string => {
    const currency = getCurrency(currencyCode);
    return formatCurrencyAmount(amount, currency);
  };

  const convertUSDToTenant = (amountUSD: number, tenantId?: string): number => {
    const currency = getTenantCurrency(tenantId);
    return amountUSD * currency.exchangeRateFromUSD;
  };

  const convertUSDToCurrency = (amountUSD: number, currencyCode: string): number => {
    const currency = getCurrency(currencyCode);
    return amountUSD * currency.exchangeRateFromUSD;
  };

  const addCurrency = (newCurrency: CustomCurrency) => {
    const code = newCurrency.code.trim().toUpperCase();
    const liveRate = exchangeRatesByCode[code];
    const currency = {
      ...newCurrency,
      code,
      exchangeRateFromUSD: liveRate ?? newCurrency.exchangeRateFromUSD,
    };
    // Optimistic + persist
    setCurrencies((prev) => {
      if (currency.isPlatformDefault) {
        return [...prev.map((c) => ({ ...c, isPlatformDefault: false })), currency];
      }
      return [...prev.filter((c) => c.code !== code), currency];
    });
    api
      .post('/platform/currencies', currency)
      .then(() => currenciesQ.reload())
      .catch((err: unknown) => console.error('Currency save failed', err));
  };

  const updateCurrency = (updated: CustomCurrency) => {
    const code = updated.code.trim().toUpperCase();
    const liveRate = exchangeRatesByCode[code];
    const currency = { ...updated, code, exchangeRateFromUSD: liveRate ?? updated.exchangeRateFromUSD };
    setCurrencies((prev) =>
      prev.map((c) => {
        if (c.code === updated.code || c.id === updated.id) {
          return currency;
        }
        if (currency.isPlatformDefault && c.isPlatformDefault) {
          return { ...c, isPlatformDefault: false };
        }
        return c;
      })
    );
    api
      .patch(`/platform/currencies/${updated.id}`, currency)
      .then(() => currenciesQ.reload())
      .catch((err: unknown) => console.error('Currency update failed', err));
  };

  const deleteCurrency = (code: string): boolean => {
    // Prevent deleting platform default or USD base
    if (code === platformDefaultCurrencyCode || code === 'USD') {
      return false;
    }
    const target = currencies.find((c) => c.code === code);
    setCurrencies((prev) => prev.filter((c) => c.code !== code));
    if (target) {
      api
        .del(`/platform/currencies/${target.id}`)
        .then(() => currenciesQ.reload())
        .catch((err: unknown) => console.error('Currency delete failed', err));
    }
    return true;
  };

  const setPlatformDefaultCurrency = (code: string) => {
    const previousDefault = currencies.find((c) => c.isPlatformDefault);
    setCurrencies((prev) =>
      prev.map((c) => ({
        ...c,
        isPlatformDefault: c.code.toUpperCase() === code.toUpperCase(),
      }))
    );
    const target = currencies.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (target) {
      api
        .patch(`/platform/currencies/${target.id}`, { isPlatformDefault: true })
        .catch((err: unknown) => console.error('Default currency update failed', err));
    }
    if (previousDefault && previousDefault.code.toUpperCase() !== code.toUpperCase()) {
      api
        .patch(`/platform/currencies/${previousDefault.id}`, { isPlatformDefault: false })
        .catch((err: unknown) => console.error('Default currency update failed', err));
    }
  };

  const setTenantCurrency = (tenantId: string, currencyCode: string) => {
    setTenantCurrencyMap((prev) => ({
      ...prev,
      [tenantId]: currencyCode.toUpperCase(),
    }));
    api
      .patch(`/platform/tenants/${tenantId}`, { currencyCode: currencyCode.toUpperCase() })
      .then(() => platformTenantsQ.reload())
      .catch((err: unknown) => console.error('Tenant currency update failed', err));
  };

  const getTenantBalance = (tenantId?: string): number => {
    const targetId = tenantId || selectedTenantId;
    if (targetId === 'all' && user) {
      return tenantBalances[user.tenantId] ?? 0;
    }
    return tenantBalances[targetId] ?? 0;
  };

  const getTenantPricePerMessage = (tenantId?: string): number => {
    const targetId = tenantId || selectedTenantId;
    if (targetId === 'all' && user) {
      return tenantMessagePrices[user.tenantId] ?? 0;
    }
    return tenantMessagePrices[targetId] ?? 0;
  };

  const rechargeTenantBalance = (amount: number, tenantId?: string) => {
    const targetId = tenantId || (selectedTenantId === 'all' ? user?.tenantId : selectedTenantId);
    if (!targetId) return;
    const current = tenantBalances[targetId] ?? 0;
    const next = Number((current + amount).toFixed(4));
    setTenantBalances((prev) => ({ ...prev, [targetId]: next }));
    if (isSuperAdmin) {
      api
        .post(`/platform/tenants/${targetId}/wallet`, { amount })
        .then(() => platformTenantsQ.reload())
        .catch((err: unknown) => console.error('Wallet top-up failed', err));
    } else {
      api
        .post('/billing/topup', { amount })
        .then(() => walletQ.reload())
        .catch((err: unknown) => console.error('Wallet top-up failed', err));
    }
  };

  // Local-only simulation: the backend deducts message cost at send time.
  const deductMessageBalance = (
    tenantId?: string
  ): { success: boolean; newBalance: number; deducted: number } => {
    const targetId = tenantId || (selectedTenantId === 'all' ? user?.tenantId : selectedTenantId);
    const price = tenantMessagePrices[targetId ?? ''] ?? 0;
    const current = tenantBalances[targetId ?? ''] ?? 0;
    const next = Math.max(0, Number((current - price).toFixed(4)));
    if (targetId) {
      setTenantBalances((prev) => ({ ...prev, [targetId]: next }));
    }
    return { success: current >= price, newBalance: next, deducted: price };
  };

  const setTenantPricing = (tenantId: string, pricePerMessage: number, initialBalance?: number) => {
    setTenantMessagePrices((prev) => ({ ...prev, [tenantId]: pricePerMessage }));
    const body: Record<string, number> = { pricePerMessage };
    if (initialBalance !== undefined) {
      body.walletBalance = initialBalance;
      setTenantBalances((prev) => ({ ...prev, [tenantId]: initialBalance }));
    }
    api
      .patch(`/platform/tenants/${tenantId}`, body)
      .then(() => platformTenantsQ.reload())
      .catch((err: unknown) => console.error('Tenant pricing update failed', err));
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        exchangeRatesByCode,
        exchangeRatesStatus,
        exchangeRatesUpdatedAt,
        platformDefaultCurrencyCode,
        platformDefaultCurrency,
        activeTenantCurrency,
        selectedTenantId,
        setSelectedTenantId,
        getCurrency,
        getTenantCurrency,
        formatForActiveTenant,
        formatForTenant,
        formatForPlatform,
        formatRawAmount,
        convertUSDToTenant,
        convertUSDToCurrency,
        addCurrency,
        updateCurrency,
        deleteCurrency,
        setPlatformDefaultCurrency,
        setTenantCurrency,
        tenantCurrencyMap,
        tenantBalances,
        tenantMessagePrices,
        getTenantBalance,
        getTenantPricePerMessage,
        rechargeTenantBalance,
        deductMessageBalance,
        setTenantPricing,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );

};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
