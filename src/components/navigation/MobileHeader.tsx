import React, { useState } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  Inbox,
  BookOpen,
  Bot,
  Share2,
  BarChart3,
  Users,
  Settings,
  ShieldAlert,
  LogOut,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { PageId, NAV_ITEMS } from '../../types/navigation';
import { CurrentUser } from '../../types/auth';
import { TenantClient } from '../../types/platformAdmin';

interface MobileHeaderProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  currentUser: CurrentUser;
  selectedTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  tenants: TenantClient[];
  onSignOut: () => void;
}

const PAGE_ICONS: Record<PageId, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  inbox: Inbox,
  knowledge: BookOpen,
  agent: Bot,
  channels: Share2,
  analytics: BarChart3,
  team: Users,
  settings: Settings,
  platform_admin: ShieldAlert,
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentPage,
  onSelectPage,
  currentUser,
  selectedTenantId,
  onSelectTenant,
  tenants,
  onSignOut,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSuperAdmin = currentUser.role === 'super_admin';

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.id === 'platform_admin' && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  const currentItem = NAV_ITEMS.find((item) => item.id === currentPage);

  const handleSelect = (id: PageId) => {
    onSelectPage(id);
    setIsOpen(false);
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            {currentUser.name.slice(0, 1)}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900">Support API</span>
            <span className="text-[11px] text-slate-500 font-medium">
              {currentItem?.label}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative bg-white border-t border-slate-200 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">{currentUser.name}</span>
                <span className="text-[11px] text-slate-500">
                  {currentUser.tenantName} ({currentUser.role.replace('_', ' ')})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tenant Switcher in Mobile Drawer for Super Admin */}
            {isSuperAdmin && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Tenant (Super Admin)
                </span>
                <select
                  value={selectedTenantId}
                  onChange={(e) => onSelectTenant(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800"
                >
                  <option value="all">🌐 All Platform Tenants</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.businessName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1 pt-1">
              {visibleNavItems.map((item) => {
                const Icon = PAGE_ICONS[item.id];
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`flex items-center gap-3.5 w-full p-3 rounded-2xl transition-all text-left ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-500'
                      }`}
                    />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-2xl font-semibold text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
