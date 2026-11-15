import React, { useState } from 'react';
import { DEMO_USERS } from '../types/auth';
import { useAuth } from '../context/AuthContext';
import { Lock, UserRound, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const DEMO_PASSWORD = 'password123';

export const LoginPage: React.FC = () => {
  const { login, loggingIn, loginError } = useAuth();
  const [identifier, setIdentifier] = useState('+880 1711-000001');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setLocalError('Please enter your email or phone number');
      return;
    }
    if (!password.trim()) {
      setLocalError('Please enter your password');
      return;
    }
    setLocalError(null);
    await login(identifier.trim(), password);
  };

  const handleSelectDemoUser = async (demoPhone: string) => {
    setIdentifier(demoPhone);
    setPassword(DEMO_PASSWORD);
    setLocalError(null);
    await login(demoPhone, DEMO_PASSWORD);
  };

  const error = localError ?? loginError;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-slate-900 text-white items-center justify-center shadow-md">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to Support API
          </h2>
          <p className="text-xs text-slate-500">
            Multi-Tenant Conversational AI & Agent Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Form with strictly two fields: Phone and Password */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Email or phone */}
            <div className="space-y-1.5">
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-slate-700"
              >
                Email or Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserRound className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email address or phone number"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-xs rounded-2xl shadow-sm transition-all duration-200 hover:shadow"
            >
              {loggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins to immediately test multi-tenant roles & isolation */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Quick Demo Switcher
              </span>
              <span className="text-[10px] text-slate-400">1-click login</span>
            </div>

            <div className="space-y-2">
              {DEMO_USERS.slice(0, 4).map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  disabled={loggingIn}
                  onClick={() => void handleSelectDemoUser(demo.phone)}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-left transition-colors disabled:opacity-60"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      {demo.name}
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                          demo.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : demo.role === 'admin'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {demo.role.replace('_', ' ')}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {demo.tenantName} · {demo.phone}
                    </span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          Enterprise Multi-Tenant Isolation & Role-Based Access Control
        </div>
      </div>
    </div>
  );
};
