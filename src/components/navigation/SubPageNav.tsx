import React from 'react';

export interface SubPageTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'purple' | 'amber';
  group?: string;
  indicatorDot?: 'connected' | 'disconnected' | 'warning';
}

interface SubPageNavProps<T extends string = string> {
  tabs: SubPageTabItem<T>[];
  activeTab: T;
  onChangeTab: (id: T) => void;
  extraSidebarContent?: React.ReactNode;
}

export function SubPageNav<T extends string>({
  tabs,
  activeTab,
  onChangeTab,
  extraSidebarContent,
}: SubPageNavProps<T>) {
  // Group tabs for desktop view if group labels exist
  const groups: { [key: string]: SubPageTabItem<T>[] } = {};
  const hasGroups = tabs.some((tab) => !!tab.group);

  if (hasGroups) {
    tabs.forEach((tab) => {
      const g = tab.group || 'GENERAL';
      if (!groups[g]) groups[g] = [];
      groups[g].push(tab);
    });
  }

  const renderBadge = (tab: SubPageTabItem<T>, isActive: boolean) => {
    if (tab.count !== undefined) {
      return (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-medium transition-colors ${
            isActive
              ? 'bg-slate-800 text-slate-100'
              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
          }`}
        >
          {tab.count}
        </span>
      );
    }

    if (tab.badge) {
      let colorClass = isActive
        ? 'bg-slate-800 text-slate-100'
        : 'bg-slate-100 text-slate-700';

      if (tab.badgeVariant === 'success' || tab.badge === 'Auto Active' || tab.badge === 'Active') {
        colorClass = isActive
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      } else if (tab.badgeVariant === 'purple') {
        colorClass = isActive
          ? 'bg-purple-500/20 text-purple-300'
          : 'bg-purple-50 text-purple-700 border border-purple-200';
      } else if (tab.badgeVariant === 'warning' || tab.badgeVariant === 'amber') {
        colorClass = isActive
          ? 'bg-amber-500/20 text-amber-300'
          : 'bg-amber-50 text-amber-700 border border-amber-200';
      }

      return (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-tight uppercase ${colorClass}`}
        >
          {tab.badge}
        </span>
      );
    }

    if (tab.indicatorDot) {
      return (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            tab.indicatorDot === 'connected'
              ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
              : tab.indicatorDot === 'warning'
              ? 'bg-amber-500'
              : 'bg-slate-300'
          }`}
        />
      );
    }

    return null;
  };

  return (
    <>
      {/* =========================================================================
          MOBILE VIEW (< lg): Horizontal scrollable tab list with swipe support
          ========================================================================= */}
      <div className="block lg:hidden w-full mb-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 px-0.5 scroll-smooth">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeTab(tab.id)}
                  className={`group shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200'
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                  )}
                  <span>{tab.label}</span>
                  {renderBadge(tab, isActive)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP VIEW (>= lg): Left-side vertically stacked tab sidebar
          Matches the reference image with categorized groupings and active highlight
          ========================================================================= */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-4 self-start">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-2.5 shadow-2xs flex flex-col gap-4">
          {hasGroups ? (
            // Grouped display
            Object.entries(groups).map(([groupTitle, groupTabs]) => (
              <div key={groupTitle} className="space-y-1">
                <div className="px-3 pt-1 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {groupTitle}
                </div>
                <div className="flex flex-col gap-0.5">
                  {groupTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChangeTab(tab.id)}
                        className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white font-semibold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-1">
                          {Icon && (
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive
                                  ? 'text-white'
                                  : 'text-slate-400 group-hover:text-slate-600'
                              }`}
                            />
                          )}
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {renderBadge(tab, isActive)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            // Flat list display
            <div className="flex flex-col gap-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChangeTab(tab.id)}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-1">
                      {Icon && (
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-white'
                              : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                      )}
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {renderBadge(tab, isActive)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Optional Extra Action Content in Desktop Sidebar */}
          {extraSidebarContent && (
            <div className="pt-2 border-t border-slate-100">{extraSidebarContent}</div>
          )}
        </div>
      </aside>
    </>
  );
}
