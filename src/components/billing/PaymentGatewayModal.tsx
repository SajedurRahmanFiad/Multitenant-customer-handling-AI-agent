import React, { useState } from 'react';
import { CustomCurrency, formatCurrencyAmount } from '../../types/currency';
import { useCurrency } from '../../context/CurrencyContext';
import {
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  Zap,
  Building2,
  RefreshCw,
  Receipt,
  Check,
} from 'lucide-react';

export type PaymentGatewayType = 'bkash' | 'nagad' | 'card' | 'bank';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: CustomCurrency;
  currentBalance?: number;
  pricePerMessage?: number;
  onConfirmRecharge?: (amount: number, gateway: PaymentGatewayType, trxId: string) => void;
  tenantName?: string;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  currency: propCurrency,
  currentBalance: propBalance,
  pricePerMessage: propPrice,
  onConfirmRecharge,
  tenantName = 'Active Workspace',
}) => {
  const currencyCtx = useCurrency();
  const currency = propCurrency || currencyCtx.activeTenantCurrency;
  const currentBalance = propBalance !== undefined ? propBalance : currencyCtx.getTenantBalance();
  const pricePerMessage = propPrice !== undefined ? propPrice : currencyCtx.getTenantPricePerMessage();
  // Navigation within payment flow
  // step: 'specify_amount' -> 'gateway_checkout' -> 'success_receipt'
  const [step, setStep] = useState<'specify_amount' | 'gateway_checkout' | 'success_receipt'>('specify_amount');

  // Amount & Gateway state
  const isUSD = currency.code === 'USD';
  const defaultPresets = isUSD ? [10, 25, 50, 100] : [500, 1000, 2500, 5000];
  const [selectedAmount, setSelectedAmount] = useState<number>(defaultPresets[1]);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType>('bkash');

  // Checkout inputs
  const [accountPhone, setAccountPhone] = useState('01712-984210');
  const [otpCode, setOtpCode] = useState('482910');
  const [pinCode, setPinCode] = useState('•••••');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('884');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedTrxId, setGeneratedTrxId] = useState('');

  if (!isOpen) return null;

  const rechargeAmount = customAmount ? Math.max(1, parseFloat(customAmount) || 0) : selectedAmount;
  const messagesYield = pricePerMessage > 0 ? Math.floor(rechargeAmount / pricePerMessage) : 0;
  const newProjectedBalance = currentBalance + rechargeAmount;

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleProceedToGateway = (e: React.FormEvent) => {
    e.preventDefault();
    if (rechargeAmount <= 0) return;
    setStep('gateway_checkout');
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const trx = `${selectedGateway.toUpperCase()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setGeneratedTrxId(trx);

    setTimeout(() => {
      setIsProcessing(false);
      currencyCtx.rechargeTenantBalance(rechargeAmount);
      if (onConfirmRecharge) {
        onConfirmRecharge(rechargeAmount, selectedGateway, trx);
      }
      setStep('success_receipt');
    }, 1200);
  };

  const handleFinish = () => {
    setStep('specify_amount');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {step === 'specify_amount' && 'Recharge Account Balance'}
                {step === 'gateway_checkout' && 'Secure Payment Gateway Checkout'}
                {step === 'success_receipt' && 'Recharge Payment Successful'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {tenantName} · {currency.code} ({currency.symbol})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: SPECIFY AMOUNT & GATEWAY */}
          {step === 'specify_amount' && (
            <form onSubmit={handleProceedToGateway} className="space-y-5">
              {/* Current Balance Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Current Balance
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                    {formatCurrencyAmount(currentBalance, currency)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Rate per AI message:</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {formatCurrencyAmount(pricePerMessage, currency)} / msg
                  </span>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  Select Recharge Amount ({currency.code})
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {defaultPresets.map((amount) => {
                    const isSelected = selectedAmount === amount && !customAmount;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleSelectPreset(amount)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        +{amount}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Or enter custom amount:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                      {currency.symbol}
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="e.g. 1500"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Yield Calculation Summary */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-emerald-900 font-semibold">
                  <span>Recharge Value:</span>
                  <span className="font-mono font-bold text-sm">
                    {formatCurrencyAmount(rechargeAmount, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-800 text-[11px]">
                  <span>Estimated AI Messages:</span>
                  <span className="font-mono font-bold">
                    ~{messagesYield.toLocaleString()} Messages
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 text-[11px] pt-1 border-t border-emerald-200/60">
                  <span>New Balance After Payment:</span>
                  <span className="font-mono font-bold">
                    {formatCurrencyAmount(newProjectedBalance, currency)}
                  </span>
                </div>
              </div>

              {/* Payment Gateway Option */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  Select Payment Gateway
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* bKash */}
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('bkash')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedGateway === 'bkash'
                        ? 'border-[#E2136E] bg-pink-50/60 ring-2 ring-[#E2136E]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#E2136E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      bK
                    </div>
                    <span className="text-xs font-bold text-slate-900">bKash</span>
                    <span className="text-[10px] text-slate-400">Instant</span>
                  </button>

                  {/* Nagad */}
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('nagad')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedGateway === 'nagad'
                        ? 'border-[#F7941D] bg-orange-50/60 ring-2 ring-[#F7941D]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#F7941D] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      নগদ
                    </div>
                    <span className="text-xs font-bold text-slate-900">Nagad</span>
                    <span className="text-[10px] text-slate-400">MFS</span>
                  </button>

                  {/* Cards */}
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('card')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedGateway === 'card'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Cards</span>
                    <span className="text-[10px] text-slate-400">Visa / MC</span>
                  </button>

                  {/* Bank / SSL */}
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('bank')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedGateway === 'bank'
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Net Banking</span>
                    <span className="text-[10px] text-slate-400">SSLCommerz</span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={rechargeAmount <= 0}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue to Payment Gateway</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: GATEWAY CHECKOUT SCREEN */}
          {step === 'gateway_checkout' && (
            <div className="space-y-5">
              {/* Gateway Brand Header */}
              {selectedGateway === 'bkash' && (
                <div className="p-4 rounded-2xl bg-[#E2136E] text-white flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#E2136E] flex items-center justify-center font-bold text-sm">
                      bK
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">bKash Payment Gateway</h4>
                      <p className="text-[11px] opacity-90">Merchant: Nexura AI Platform</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] opacity-80 block">Payable</span>
                    <span className="text-sm font-extrabold font-mono">
                      {formatCurrencyAmount(rechargeAmount, currency)}
                    </span>
                  </div>
                </div>
              )}

              {selectedGateway === 'nagad' && (
                <div className="p-4 rounded-2xl bg-[#F7941D] text-white flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#F7941D] flex items-center justify-center font-bold text-sm">
                      নগদ
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Nagad Gateway</h4>
                      <p className="text-[11px] opacity-90">Merchant: Nexura AI Platform</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] opacity-80 block">Payable</span>
                    <span className="text-sm font-extrabold font-mono">
                      {formatCurrencyAmount(rechargeAmount, currency)}
                    </span>
                  </div>
                </div>
              )}

              {selectedGateway === 'card' && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Card Payment Checkout</h4>
                      <p className="text-[11px] opacity-80">256-bit Encrypted SSL</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] opacity-70 block">Payable</span>
                    <span className="text-sm font-extrabold font-mono">
                      {formatCurrencyAmount(rechargeAmount, currency)}
                    </span>
                  </div>
                </div>
              )}

              {selectedGateway === 'bank' && (
                <div className="p-4 rounded-2xl bg-blue-900 text-white flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">SSLCommerz Bank Gateway</h4>
                      <p className="text-[11px] opacity-80">Online Banking & Direct Debit</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] opacity-70 block">Payable</span>
                    <span className="text-sm font-extrabold font-mono">
                      {formatCurrencyAmount(rechargeAmount, currency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Checkout Form */}
              <form onSubmit={handleExecutePayment} className="space-y-4 text-xs">
                {(selectedGateway === 'bkash' || selectedGateway === 'nagad') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Your {selectedGateway === 'bkash' ? 'bKash' : 'Nagad'} Account Number
                      </label>
                      <input
                        type="text"
                        required
                        value={accountPhone}
                        onChange={(e) => setAccountPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Security OTP
                        </label>
                        <input
                          type="text"
                          required
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900 text-center tracking-widest"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Account PIN
                        </label>
                        <input
                          type="password"
                          required
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900 text-center tracking-widest"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(selectedGateway === 'card' || selectedGateway === 'bank') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Expiry Date (MM/YY)
                        </label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900 text-center"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          CVC / CVV
                        </label>
                        <input
                          type="password"
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900 text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2 text-slate-500 text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Sandbox test transaction. Real-time balance will be instantly credited to your tenant wallet.
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('specify_amount')}
                    className="w-1/3 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-2xl font-semibold text-slate-600 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-2/3 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Pay {formatCurrencyAmount(rechargeAmount, currency)}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: SUCCESS RECEIPT */}
          {step === 'success_receipt' && (
            <div className="space-y-5 text-center py-2 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Recharge Successful!
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your tenant balance has been topped up instantly.
                </p>
              </div>

              {/* Receipt Details Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-900">{generatedTrxId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recharged Amount:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +{formatCurrencyAmount(rechargeAmount, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">New Available Balance:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrencyAmount(newProjectedBalance, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Added Message Capacity:</span>
                  <span className="font-mono font-medium text-slate-800">
                    ~{messagesYield.toLocaleString()} AI messages
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Payment Gateway:</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {selectedGateway}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-md transition-colors"
              >
                Return to Overview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
