import React, { useState } from 'react';
import { CurrentUser, DEMO_USERS } from '../types/auth';
import { Lock, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: CurrentUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('+880 1711-000001');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    // Match existing demo user or generate a default authenticated profile
    const matched = DEMO_USERS.find(
      (u) => u.phone.replace(/[\s-]/g, '') === phone.replace(/[\s-]/g, '')
    );

    if (matched) {
      onLogin(matched);
    } else {
      // Default tenant admin user for write-in phone numbers
      onLogin({
        id: `usr_${Date.now()}`,
        name: 'Workspace Member',
        phone: phone.trim(),
        role: 'admin',
        tenantId: 'ten_loom_01',
        tenantName: 'Bengal Loom & Crafts',
      });
    }
  };

  const handleSelectDemoUser = (user: CurrentUser) => {
    setPhone(user.phone);
    setPassword('demoPass2025');
    setError(null);
    onLogin(user);
  };

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
            {/* Field 1: Phone */}
            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-slate-700"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1711-000000"
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
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-2xl shadow-sm transition-all duration-200 hover:shadow"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
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
                  onClick={() => handleSelectDemoUser(demo)}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-left transition-colors"
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
