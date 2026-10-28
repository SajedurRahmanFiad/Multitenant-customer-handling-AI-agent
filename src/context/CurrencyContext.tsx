import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  CustomCurrency,
  INITIAL_CURRENCIES,
  formatCurrencyAmount,
  convertAndFormatUSD,
} from '../types/currency';
import { INITIAL_TENANTS } from '../data/platformAdminMockData';

interface CurrencyContextType {
  currencies: CustomCurrency[];
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

export const CurrencyProvider: React.FC<{
  children: React.ReactNode;
  initialSelectedTenantId?: string;
}> = ({ children, initialSelectedTenantId = 'ten_loom_01' }) => {
  const [currencies, setCurrencies] = useState<CustomCurrency[]>(INITIAL_CURRENCIES);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(initialSelectedTenantId);

  // Initialize tenant-to-currency mapping from initial tenants
  const [tenantCurrencyMap, setTenantCurrencyMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    INITIAL_TENANTS.forEach((t) => {
      map[t.id] = t.currencyCode || 'BDT';
    });
    return map;
  });

  // Balances in each tenant's currency
  const [tenantBalances, setTenantBalances] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    INITIAL_TENANTS.forEach((t) => {
      map[t.id] = t.walletBalance ?? 2450;
    });
    return map;
  });

  // Price per message in each tenant's currency
  const [tenantMessagePrices, setTenantMessagePrices] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    INITIAL_TENANTS.forEach((t) => {
      map[t.id] = t.pricePerMessage ?? 0.25;
    });
    return map;
  });


  // Determine platform default currency
  const platformDefaultCurrency = useMemo(() => {
    return (
      currencies.find((c) => c.isPlatformDefault && c.isActive) ||
      currencies.find((c) => c.code === 'USD') ||
      currencies[0]
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
    return getCurrency(currCode || 'BDT');
  };

  const activeTenantCurrency = useMemo(() => {
    return getTenantCurrency(selectedTenantId);
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
    setCurrencies((prev) => {
      // If marked as platform default, unmark others
      if (newCurrency.isPlatformDefault) {
        return [
          ...prev.map((c) => ({ ...c, isPlatformDefault: false })),
          newCurrency,
        ];
      }
      return [...prev, newCurrency];
    });
  };

  const updateCurrency = (updated: CustomCurrency) => {
    setCurrencies((prev) =>
      prev.map((c) => {
        if (c.code === updated.code || c.id === updated.id) {
          return updated;
        }
        if (updated.isPlatformDefault && c.isPlatformDefault) {
          return { ...c, isPlatformDefault: false };
        }
        return c;
      })
    );
  };

  const deleteCurrency = (code: string): boolean => {
    // Prevent deleting platform default or USD base
    if (code === platformDefaultCurrencyCode || code === 'USD') {
      return false;
    }
    setCurrencies((prev) => prev.filter((c) => c.code !== code));

    // Fallback any tenants using this deleted currency to platform default
    setTenantCurrencyMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((tid) => {
        if (next[tid] === code) {
          next[tid] = platformDefaultCurrencyCode;
        }
      });
      return next;
    });
    return true;
  };

  const setPlatformDefaultCurrency = (code: string) => {
    setCurrencies((prev) =>
      prev.map((c) => ({
        ...c,
        isPlatformDefault: c.code.toUpperCase() === code.toUpperCase(),
      }))
    );
  };

  const setTenantCurrency = (tenantId: string, currencyCode: string) => {
    setTenantCurrencyMap((prev) => ({
      ...prev,
      [tenantId]: currencyCode.toUpperCase(),
    }));
  };

  const getTenantBalance = (tenantId?: string): number => {
    const targetId = tenantId || selectedTenantId;
    return tenantBalances[targetId] ?? 2450;
  };

  const getTenantPricePerMessage = (tenantId?: string): number => {
    const targetId = tenantId || selectedTenantId;
    return tenantMessagePrices[targetId] ?? 0.25;
  };

  const rechargeTenantBalance = (amount: number, tenantId?: string) => {
    const targetId = tenantId || selectedTenantId;
    setTenantBalances((prev) => ({
      ...prev,
      [targetId]: Number(((prev[targetId] ?? 0) + amount).toFixed(4)),
    }));
  };

  const deductMessageBalance = (
    tenantId?: string
  ): { success: boolean; newBalance: number; deducted: number } => {
    const targetId = tenantId || selectedTenantId;
    const price = tenantMessagePrices[targetId] ?? 0.25;
    const current = tenantBalances[targetId] ?? 2450;
    const next = Math.max(0, Number((current - price).toFixed(4)));
    setTenantBalances((prev) => ({
      ...prev,
      [targetId]: next,
    }));
    return { success: current >= price, newBalance: next, deducted: price };
  };

  const setTenantPricing = (tenantId: string, pricePerMessage: number, initialBalance?: number) => {
    setTenantMessagePrices((prev) => ({
      ...prev,
      [tenantId]: pricePerMessage,
    }));
    if (initialBalance !== undefined) {
      setTenantBalances((prev) => ({
        ...prev,
        [tenantId]: initialBalance,
      }));
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
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
