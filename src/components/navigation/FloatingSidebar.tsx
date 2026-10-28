import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  Bot,
  Share2,
  BarChart3,
  Users,
  Settings,
  ShieldAlert,
  Pin,
  PinOff,
  Building2,
  ChevronDown,
  Search,
  Check,
  Globe,
} from 'lucide-react';
import { PageId, NAV_ITEMS } from '../../types/navigation';
import { CurrentUser } from '../../types/auth';
import { TenantClient } from '../../types/platformAdmin';

interface FloatingSidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isPinned: boolean;
  onTogglePin: () => void;
  currentUser: CurrentUser;
  selectedTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  tenants: TenantClient[];
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

export const FloatingSidebar: React.FC<FloatingSidebarProps> = ({
  currentPage,
  onSelectPage,
  isPinned,
  onTogglePin,
  currentUser,
  selectedTenantId,
  onSelectTenant,
  tenants,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const tenantDropdownRef = useRef<HTMLDivElement>(null);

  const isExpanded = isHovered || isPinned;
  const isSuperAdmin = currentUser.role === 'super_admin';

  // Close tenant dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tenantDropdownRef.current &&
        !tenantDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTenantDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter nav items: Super Admin sees all; regular members NEVER see platform_admin
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.id === 'platform_admin' && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  // Filtered tenants for search
  const filteredTenants = tenants.filter(
    (t) =>
      t.businessName.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(tenantSearchQuery.toLowerCase())
  );

  const activeTenantObj = tenants.find((t) => t.id === selectedTenantId);
  const activeTenantLabel =
    selectedTenantId === 'all'
      ? 'All Tenants (Global)'
      : activeTenantObj?.businessName || 'Select Tenant';

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsTenantDropdownOpen(false);
      }}
      className={`hidden lg:flex fixed left-5 top-5 bottom-5 z-40 flex-col justify-between bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_45px_rgba(15,23,42,0.10)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
        isExpanded ? 'w-[280px] rounded-3xl p-4' : 'w-[68px] rounded-[34px] p-2.5'
      }`}
      aria-label="Main Navigation"
    >
      {/* Top Header / Brand Mark */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between min-h-[44px] px-1.5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
              <svg
                className="w-5 h-5 text-white"
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
            {isExpanded && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden transition-opacity duration-200 opacity-100">
                <span className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                  Support API
                </span>
                <span className="text-[11px] text-slate-400 font-normal leading-tight">
                  Management Console
                </span>
              </div>
            )}
          </div>

          {isExpanded && (
            <button
              type="button"
              onClick={onTogglePin}
              title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
            >
              {isPinned ? (
                <PinOff className="w-4 h-4 text-slate-700" />
              ) : (
                <Pin className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Super Admin Tenant Selector (below branding mark) */}
        {isSuperAdmin && (
          <div className="mt-3 relative" ref={tenantDropdownRef}>
            {isExpanded ? (
              <div>
                <button
                  type="button"
                  onClick={() => setIsTenantDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-2 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      {selectedTenantId === 'all' ? (
                        <Globe className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-none">
                        Active Tenant
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate leading-snug">
                        {activeTenantLabel}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      isTenantDropdownOpen ? 'rotate-180 text-slate-900' : ''
                    }`}
                  />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onTogglePin();
                  setIsTenantDropdownOpen(true);
                }}
                title={`Active Tenant: ${activeTenantLabel} (Click to switch)`}
                className="w-10 h-10 mx-auto rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
              >
                <Building2 className="w-4 h-4" />
              </button>
            )}

            {/* Searchable Tenant Dropdown Popover */}
            {isTenantDropdownOpen && isExpanded && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-1">
                {/* Search Input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={tenantSearchQuery}
                    onChange={(e) => setTenantSearchQuery(e.target.value)}
                    placeholder="Search tenant..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                    autoFocus
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 text-xs">
                  {/* All Tenants Option */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTenant('all');
                      setIsTenantDropdownOpen(false);
                      setTenantSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                      selectedTenantId === 'all'
                        ? 'bg-purple-50 text-purple-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-purple-600" />
                      <div>
                        <div className="text-xs font-semibold">All Tenants</div>
                        <div className="text-[10px] text-slate-400">Global Overview Mode</div>
                      </div>
                    </div>
                    {selectedTenantId === 'all' && (
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                    )}
                  </button>

                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Client Tenants ({filteredTenants.length})
                  </div>

                  {filteredTenants.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onSelectTenant(t.id);
                        setIsTenantDropdownOpen(false);
                        setTenantSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                        selectedTenantId === t.id
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate text-xs font-semibold">
                          {t.businessName}
                        </span>
                        <span
                          className={`text-[10px] truncate ${
                            selectedTenantId === t.id ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          {t.ownerName} · {t.ownerPhone}
                        </span>
                      </div>
                      {selectedTenantId === t.id && (
                        <Check className="w-3.5 h-3.5 text-white shrink-0" />
                      )}
                    </button>
                  ))}

                  {filteredTenants.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No matching tenants found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="my-3 border-t border-slate-100" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden py-1">
        {visibleNavItems.map((item) => {
          const Icon = PAGE_ICONS[item.id];
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPage(item.id)}
              className={`group relative flex items-center gap-3 w-full rounded-2xl transition-all duration-200 text-left ${
                isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'
              } ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
                }`}
              />

              {isExpanded && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span
                    className={`text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-opacity duration-200 tracking-tight ${
                      isActive ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-amber-400 text-slate-900 font-semibold'
                          : 'bg-amber-100 text-amber-800 font-semibold border border-amber-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Active Indicator bar in collapsed mode */}
              {!isExpanded && isActive && (
                <span className="absolute -right-1 w-1 h-5 bg-slate-900 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Account Monogram */}
      <div className="pt-2">
        <div className="my-2 border-t border-slate-100" />
        <div
          className={`flex items-center gap-3 rounded-2xl transition-all duration-200 ${
            isExpanded ? 'px-2 py-1.5' : 'justify-center p-1'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold shrink-0 font-mono">
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          {isExpanded && (
            <div className="flex flex-col whitespace-nowrap overflow-hidden transition-opacity duration-200">
              <span className="text-xs font-medium text-slate-800 truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {currentUser.tenantName}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
