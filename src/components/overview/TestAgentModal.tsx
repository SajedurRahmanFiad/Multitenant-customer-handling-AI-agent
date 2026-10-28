import React, { useState } from 'react';
import { X, Send, Bot, User, CheckCircle2, AlertCircle, RefreshCw, Wallet } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

interface TestAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  status?: 'send' | 'clarify' | 'handoff';
  confidence?: number;
  sources?: string[];
  latencyMs?: number;
  time: string;
  deductedAmount?: number;
}

export const TestAgentModal: React.FC<TestAgentModalProps> = ({ isOpen, onClose }) => {
  const {
    deductMessageBalance,
    getTenantBalance,
    getTenantPricePerMessage,
    activeTenantCurrency,
    formatRawAmount,
  } = useCurrency();

  const [channel, setChannel] = useState<'Messenger' | 'WhatsApp'>('WhatsApp');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastDeduction, setLastDeduction] = useState<number | null>(null);
  const [messages, setMessages] = useState<TestMessage[]>([
    {
      id: 'm0',
      sender: 'agent',
      text: 'আসসালামু আলাইকুম! আমি সাপোর্ট অ্যাসিস্ট্যান্ট। পণ্য, ডেলিভারি বা অর্ডার সংক্রান্ত যেকোনো তথ্য জানতে জিজ্ঞেস করতে পারেন।',
      status: 'send',
      confidence: 1.0,
      sources: ['Default Welcome Greeting'],
      latencyMs: 120,
      time: 'Just now',
    },
  ]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: TestMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: inputText,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    const query = inputText;
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let replyText = '';
      let replyStatus: 'send' | 'clarify' | 'handoff' = 'send';
      let confidence = 0.94;
      let sources = ['Delivery Policy'];

      const lower = query.toLowerCase();
      if (lower.includes('delivery') || query.includes('ডেলিভারি') || query.includes('কবে পাব')) {
        replyText = 'জ্বি ভাই, ঢাকার ভেতরে ২৪-৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে সাধারণত ২-৪ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়।';
        confidence = 0.96;
        sources = ['Delivery Policy v2', 'Inside Dhaka Logistics'];
      } else if (lower.includes('price') || query.includes('দাম') || query.includes('কত')) {
        replyText = 'আমাদের বর্তমান কালেকশনের নিয়মিত মূল্য এবং অফার সংক্রান্ত বিস্তারিত জানার জন্য অনুগ্রহ করে প্রোডাক্টের নাম বা ছবি শেয়ার করুন।';
        confidence = 0.89;
        sources = ['Product Catalog 2026'];
      } else if (lower.includes('refund') || lower.includes('return') || query.includes('ফেরত') || query.includes('নষ্ট')) {
        replyText = 'পণ্য পৌঁছানোর ৩ দিনের মধ্যে রিটার্ন বা এক্সচেঞ্জের নিয়ম রয়েছে। আপনার অর্ডার আইডি বা ক্রু ত্রুটির ছবি দিলে আমাদের টিমমেট দ্রুত সহযোগিতা করবে।';
        replyStatus = 'handoff';
        confidence = 0.91;
        sources = ['Return & Refund Policy'];
      } else if (lower.includes('bhai') || query.includes('ভাই')) {
        replyText = 'জ্বি ভাই, আপনার পছন্দ বা কোনো প্রশ্ন থাকলে বলতে পারেন। আমি সাহায্য করছি!';
        confidence = 0.93;
        sources = ['Colloquial Tone Prompt Rules'];
      } else {
        replyText = 'জ্বি, আপনার বার্তাটি পেয়েছি। অনুগ্রহ করে আপনার পছন্দের পণ্যের মডেল বা প্রশ্নটি স্পষ্ট করে বললে আমি সাথে সাথে কনফার্ম করে দিচ্ছি।';
        confidence = 0.88;
        sources = ['General FAQ'];
      }

      const deductionResult = deductMessageBalance();
      if (deductionResult.success) {
        setLastDeduction(deductionResult.deducted);
      }

      const agentReply: TestMessage = {
        id: `a_${Date.now()}`,
        sender: 'agent',
        text: replyText,
        status: replyStatus,
        confidence,
        sources,
        latencyMs: 420,
        time: 'Just now',
        deductedAmount: deductionResult.deducted,
      };

      setMessages((prev) => [...prev, agentReply]);
      setIsTyping(false);
    }, 600);
  };

  const samplePrompts = [
    'ভাই ঢাকায় ডেলিভারি কতদিন লাগে?',
    'ঢাকার বাইরে ডেলিভারি চার্জ কত?',
    'পণ্য ছেঁড়া এসেছে, আমি ফেরত দিতে চাই',
  ];

  const currentBalance = getTenantBalance();
  const pricePerMsg = getTenantPricePerMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Live Agent Simulator
                </h3>
                {lastDeduction !== null && (
                  <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                    -{formatRawAmount(lastDeduction, activeTenantCurrency.code)}/reply
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Test prompts, language mirroring, and knowledge retrieval
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Wallet Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{formatRawAmount(currentBalance, activeTenantCurrency.code)}</span>
              <span className="text-[10px] font-normal text-slate-400">({formatRawAmount(pricePerMsg, activeTenantCurrency.code)}/msg)</span>
            </div>

            {/* Channel picker */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setChannel('WhatsApp')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  channel === 'WhatsApp'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannel('Messenger')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  channel === 'Messenger'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Messenger
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 min-h-[320px]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.sender === 'agent' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-slate-600">
                      {m.status === 'handoff' ? (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          <span className="text-amber-700 font-medium">Handoff Triggered</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">Auto-Send</span>
                        </>
                      )}
                    </span>
                    <span>·</span>
                    <span>Confidence: {((m.confidence || 0) * 100).toFixed(0)}%</span>
                    <span>·</span>
                    <span>{m.latencyMs}ms</span>
                    {m.sources && m.sources.length > 0 && (
                      <span className="w-full text-[10px] text-slate-400 font-sans">
                        Sources: {m.sources.join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 px-3 py-2 rounded-xl w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
              <span>Retrieving knowledge and formulating response...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] shrink-0 font-medium">Try:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(p)}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-md shrink-0 text-left transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type customer question (Bangla or English)..."
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Test</span>
          </button>
        </div>
      </div>
    </div>
  );
};
