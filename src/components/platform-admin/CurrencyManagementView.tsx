import React, { useState } from 'react';
import {
  CustomCurrency,
  SymbolPosition,
  formatCurrencyAmount,
  convertAndFormatUSD,
} from '../../types/currency';
import { TenantClient } from '../../types/platformAdmin';
import {
  Coins,
  Plus,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Star,
  ArrowRightLeft,
  Building2,
  DollarSign,
  Globe,
  Sliders,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';

interface CurrencyManagementViewProps {
  currencies: CustomCurrency[];
  exchangeRatesByCode: Record<string, number>;
  exchangeRatesStatus: 'loading' | 'live' | 'unavailable';
  tenants: TenantClient[];
  platformDefaultCurrencyCode: string;
  onAddCurrency: (currency: CustomCurrency) => void;
  onUpdateCurrency: (currency: CustomCurrency) => void;
  onDeleteCurrency: (code: string) => boolean;
  onSetPlatformDefault: (code: string) => void;
  onUpdateTenantCurrency: (tenantId: string, currencyCode: string) => void;
  onShowToast: (msg: string) => void;
}

export const CurrencyManagementView: React.FC<CurrencyManagementViewProps> = ({
  currencies,
  exchangeRatesByCode,
  exchangeRatesStatus,
  tenants,
  platformDefaultCurrencyCode,
  onAddCurrency,
  onUpdateCurrency,
  onDeleteCurrency,
  onSetPlatformDefault,
  onUpdateTenantCurrency,
  onShowToast,
}) => {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CustomCurrency | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formSymbolPosition, setFormSymbolPosition] = useState<SymbolPosition>('before');
  const [formSymbolSpacing, setFormSymbolSpacing] = useState(false);
  const formExchangeRate = exchangeRatesByCode[formCode.trim().toUpperCase()];
  const [formDecimalPlaces, setFormDecimalPlaces] = useState<number>(2);
  const [formThousandsSep, setFormThousandsSep] = useState(',');
  const [formDecimalSep, setFormDecimalSep] = useState('.');
  const [formIsPlatformDefault, setFormIsPlatformDefault] = useState(false);
  const [formDescription, setFormDescription] = useState('');

  const openAddModal = () => {
    setEditingCurrency(null);
    setFormCode('');
    setFormName('');
    setFormSymbol('');
    setFormSymbolPosition('before');
    setFormSymbolSpacing(false);
    setFormDecimalPlaces(2);
    setFormThousandsSep(',');
    setFormDecimalSep('.');
    setFormIsPlatformDefault(false);
    setFormDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (curr: CustomCurrency) => {
    setEditingCurrency(curr);
    setFormCode(curr.code);
    setFormName(curr.name);
    setFormSymbol(curr.symbol);
    setFormSymbolPosition(curr.symbolPosition);
    setFormSymbolSpacing(curr.symbolSpacing);
    setFormDecimalPlaces(curr.decimalPlaces);
    setFormThousandsSep(curr.thousandsSeparator);
    setFormDecimalSep(curr.decimalSeparator);
    setFormIsPlatformDefault(curr.isPlatformDefault);
    setFormDescription(curr.description || '');
    setIsModalOpen(true);
  };

  // Preview dummy currency for live modal feedback
  const previewCurrency: CustomCurrency = {
    id: editingCurrency?.id || 'preview',
    code: formCode.trim().toUpperCase() || 'NEW',
    name: formName.trim() || 'Custom Currency',
    symbol: formSymbol.trim() || '¤',
    symbolPosition: formSymbolPosition,
    symbolSpacing: formSymbolSpacing,
    exchangeRateFromUSD: formExchangeRate ?? 1,
    decimalPlaces: Number(formDecimalPlaces) || 0,
    thousandsSeparator: formThousandsSep,
    decimalSeparator: formDecimalSep,
    isPlatformDefault: formIsPlatformDefault,
    isActive: true,
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim() || !formSymbol.trim()) {
      onShowToast('Please provide Currency Code, Name, and Symbol');
      return;
    }

    const cleanCode = formCode.trim().toUpperCase();
    const rate = exchangeRatesByCode[cleanCode];
    if (rate === undefined) {
      onShowToast(`No live exchange rate is available for ${cleanCode}`);
      return;
    }

    if (editingCurrency) {
      const updated: CustomCurrency = {
        ...editingCurrency,
        code: cleanCode,
        name: formName.trim(),
        symbol: formSymbol.trim(),
        symbolPosition: formSymbolPosition,
        symbolSpacing: formSymbolSpacing,
        exchangeRateFromUSD: rate,
        decimalPlaces: formDecimalPlaces,
        thousandsSeparator: formThousandsSep,
        decimalSeparator: formDecimalSep,
        isPlatformDefault: formIsPlatformDefault,
        description: formDescription.trim(),
      };
      onUpdateCurrency(updated);
      onShowToast(`Currency ${cleanCode} (${formName.trim()}) updated`);
    } else {
      // Check existing code
      if (currencies.some((c) => c.code === cleanCode)) {
        onShowToast(`A currency with code "${cleanCode}" already exists`);
        return;
      }
      const newCurr: CustomCurrency = {
        id: `curr_${Date.now().toString(36)}`,
        code: cleanCode,
        name: formName.trim(),
        symbol: formSymbol.trim(),
        symbolPosition: formSymbolPosition,
        symbolSpacing: formSymbolSpacing,
        exchangeRateFromUSD: rate,
        decimalPlaces: formDecimalPlaces,
        thousandsSeparator: formThousandsSep,
        decimalSeparator: formDecimalSep,
        isPlatformDefault: formIsPlatformDefault,
        isActive: true,
        createdAt: 'Just added',
        description: formDescription.trim() || 'Custom configured business currency',
      };
      onAddCurrency(newCurr);
      onShowToast(`Currency ${cleanCode} added successfully`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (code: string) => {
    const success = onDeleteCurrency(code);
    if (success) {
      onShowToast(`Currency ${code} removed`);
    } else {
      onShowToast(`Cannot delete ${code}: it is set as default or is a protected base currency`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Multi-Currency & Exchange Rate System
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {currencies.length} Currencies
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Add custom currencies with personalized symbols, display positions, and USD exchange rates. Assign operating currencies per tenant.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Currency
          </button>
        </div>
      </div>

      {/* Currencies Grid Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-700" />
            Configured Platform Currencies
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">
            Base benchmark: 1.00 USD
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currencies.map((curr) => {
            const isPlatformDefault = curr.code === platformDefaultCurrencyCode;
            const sampleConverted = 25 * curr.exchangeRateFromUSD;
            const formattedSample = formatCurrencyAmount(sampleConverted, curr);

            return (
              <div
                key={curr.code}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                  isPlatformDefault
                    ? 'border-slate-900 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar of card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-base shadow-xs">
                        {curr.symbol}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-sm font-bold text-slate-900">{curr.name}</h5>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            ({curr.code})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {curr.description || 'Configured currency'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isPlatformDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          Default
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Currency Rules & Specs */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Exchange Rate:</span>
                      <span className="font-mono font-bold text-slate-900">
                        1 USD = {curr.exchangeRateFromUSD.toLocaleString(undefined, { minimumFractionDigits: curr.decimalPlaces > 0 ? 2 : 0 })} {curr.code}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Symbol Placement:</span>
                      <span className="font-medium text-slate-800">
                        {curr.symbolPosition === 'before' ? 'Before amount' : 'After amount'}
                        {curr.symbolSpacing ? ' (with space)' : ' (no space)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Decimal Precision:</span>
                      <span className="font-mono text-slate-800">
                        {curr.decimalPlaces} {curr.decimalPlaces === 0 ? '(Integer only)' : 'decimals'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Live Format ($25 USD):</span>
                      <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                        {formattedSample}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  {!isPlatformDefault ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSetPlatformDefault(curr.code);
                        onShowToast(`Platform admin default currency set to ${curr.code}`);
                      }}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
                    >
                      <Star className="w-3 h-3 text-slate-400" />
                      Make Default
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Platform Default
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(curr)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Currency Rules"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {curr.code !== 'USD' && !isPlatformDefault && (
                      <button
                        type="button"
                        onClick={() => handleDelete(curr.code)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Currency"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tenant Currency Assignment Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Tenant Operating Currency Assignments
            </h4>
            <p className="text-[11px] text-slate-500">
              Each business tenant operates in their selected currency. All client-facing analytics, billing, and metrics format automatically.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            {tenants.length} Registered Tenants
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Tenant Business</th>
                <th className="py-2.5 px-3">Owner Contact</th>
                <th className="py-2.5 px-3">Channels</th>
                <th className="py-2.5 px-3">Monthly Spend</th>
                <th className="py-2.5 px-3">Assigned Operating Currency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tenants.map((t) => {
                const currentCurrCode = t.currencyCode || 'BDT';
                const tenantCurrencyObj = currencies.find((c) => c.code === currentCurrCode) || currencies[0];
                const formattedSpend = convertAndFormatUSD(t.monthlySpendUSD, tenantCurrencyObj);

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{t.businessName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">{t.ownerName}</div>
                      <div className="text-[10px] text-slate-400">{t.ownerPhone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {t.connectedChannels.messengerPages} FB / {t.connectedChannels.whatsappNumbers} WA
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 font-mono">
                        {formattedSpend}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        (${t.monthlySpendUSD.toFixed(2)} USD)
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={currentCurrCode}
                          onChange={(e) => {
                            const newCode = e.target.value;
                            onUpdateTenantCurrency(t.id, newCode);
                            onShowToast(`Updated ${t.businessName} operating currency to ${newCode}`);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
                        >
                          {currencies.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                              {curr.code} ({curr.symbol}) — {curr.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Currency Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingCurrency ? `Edit Currency (${editingCurrency.code})` : 'Add Custom Currency'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure symbol position, exchange rate, and decimal precision.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Currency Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BDT, CAD"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 uppercase"
                  />
                </div>

                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Currency Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Bangladeshi Taka, Euro"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Symbol */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSymbol}
                    onChange={(e) => setFormSymbol(e.target.value)}
                    placeholder="e.g. ৳, $, €, £, د.إ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {/* Exchange Rate from USD */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Live Rate from 1.00 USD
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formExchangeRate ?? ''}
                    placeholder={exchangeRatesStatus === 'loading' ? 'Loading live rates...' : 'No live rate for this code'}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">Fetched by currency code. Rates refresh automatically.</p>
                </div>
              </div>

              {/* Symbol Position & Spacing */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Symbol Display Placement
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setFormSymbolPosition('before')}
                      className={`py-2 px-3 rounded-lg border text-left font-medium transition-all ${
                        formSymbolPosition === 'before'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">Before Amount</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {formSymbol || '$'}1,250
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormSymbolPosition('after')}
                      className={`py-2 px-3 rounded-lg border text-left font-medium transition-all ${
                        formSymbolPosition === 'after'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">After Amount</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        1,250 {formSymbol || '€'}
                      </div>
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formSymbolSpacing}
                    onChange={(e) => setFormSymbolSpacing(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Include space between symbol and amount (e.g.{' '}
                    {formSymbolPosition === 'before'
                      ? `${formSymbol || '৳'} 1,200`
                      : `1,200 ${formSymbol || '৳'}`}
                    )
                  </span>
                </label>
              </div>

              {/* Decimal Places & Separators */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Decimal Places
                  </label>
                  <select
                    value={formDecimalPlaces}
                    onChange={(e) => setFormDecimalPlaces(parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value={0}>0 (e.g. ৳ 1,200)</option>
                    <option value={2}>2 (e.g. $ 1,200.50)</option>
                    <option value={3}>3 (e.g. 1.200,500)</option>
                    <option value={4}>4 (e.g. 1.200,5000)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thousands Sep
                  </label>
                  <select
                    value={formThousandsSep}
                    onChange={(e) => setFormThousandsSep(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  >
                    <option value=",">Comma (,)</option>
                    <option value=".">Period (.)</option>
                    <option value=" ">Space ( )</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Decimal Sep
                  </label>
                  <select
                    value={formDecimalSep}
                    onChange={(e) => setFormDecimalSep(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  >
                    <option value=".">Period (.)</option>
                    <option value=",">Comma (,)</option>
                  </select>
                </div>
              </div>

              {/* Set as platform default checkbox */}
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={formIsPlatformDefault}
                  onChange={(e) => setFormIsPlatformDefault(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Set as Platform Admin Default Currency
                </span>
              </label>

              {/* Live Preview Card */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Live Formatted Preview
                  </span>
                  <span className="font-mono font-bold text-emerald-950 text-sm">
                    {formExchangeRate === undefined ? 'Live rate unavailable' : formatCurrencyAmount(1250 * formExchangeRate, previewCurrency)}
                  </span>
                </div>
                <div className="text-right text-[10px] text-emerald-800">
                  Rate: {formExchangeRate === undefined ? 'Unavailable' : `1 USD = ${formExchangeRate} ${formCode || 'CURR'}`}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  {editingCurrency ? 'Update Currency' : 'Save Currency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
