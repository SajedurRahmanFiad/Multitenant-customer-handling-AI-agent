import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Building2,
  Users,
  Settings,
  LogOut,
  Phone,
  Sparkles,
} from 'lucide-react';
import { PageId } from '../../types/navigation';
import { CurrentUser } from '../../types/auth';

interface MergedHeaderProps {
  currentUser: CurrentUser;
  onNavigate?: (page: PageId) => void;
  onSignOut: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'handoff' | 'knowledge' | 'system';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Staff Handover Requested',
    description: 'Tanvir Hossain escalated via WhatsApp (Transit damage dispute)',
    time: '8m ago',
    read: false,
    type: 'handoff',
  },
  {
    id: 'notif_2',
    title: 'bKash Payment Verification',
    description: 'Shaila Parvin sent TRXID 9LK812 on Messenger for manual review',
    time: '24m ago',
    read: false,
    type: 'handoff',
  },
  {
    id: 'notif_3',
    title: 'Knowledge Indexing Complete',
    description: 'Document "Eid Delivery Schedule 2026" chunked into 14 embeddings',
    time: '2h ago',
    read: true,
    type: 'knowledge',
  },
];

export const MergedHeader: React.FC<MergedHeaderProps> = ({
  currentUser,
  onNavigate,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="hidden lg:flex items-center justify-between gap-6 pb-2">
      {/* Left side: Welcome, {Name} */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Welcome, {currentUser.name.split(' ')[0]}
        </h1>
      </div>

      {/* Right side: Search bar, Notification button, Profile button (Desktop only) */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Search Bar */}
        <div className="relative">
          <div
            className={`flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl border transition-all duration-200 ${
              isSearchFocused
                ? 'border-slate-900 ring-2 ring-slate-100 shadow-xs w-72'
                : 'border-slate-200/90 hover:border-slate-300 w-60'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search conversations, knowledge..."
              className="bg-transparent border-none outline-none text-xs text-slate-900 placeholder:text-slate-400 w-full"
            />
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded-md shrink-0">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Notification Button */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className={`w-10 h-10 rounded-2xl bg-white border flex items-center justify-center transition-colors relative ${
              isNotifOpen
                ? 'border-slate-900 bg-slate-50 text-slate-900'
                : 'border-slate-200/90 text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-3xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-mono font-semibold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-900"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'handoff') {
                        onNavigate?.('inbox');
                        setIsNotifOpen(false);
                      }
                    }}
                    className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer space-y-1 ${
                      !item.read ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            !item.read ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                        />
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('inbox');
                    setIsNotifOpen(false);
                  }}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  View all in Inbox →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Button */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl bg-white border transition-colors ${
              isProfileOpen
                ? 'border-slate-900 shadow-xs'
                : 'border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
              {getInitials(currentUser.name)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight capitalize">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-3xl border border-slate-200 shadow-xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{currentUser.phone}</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-700">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span className="truncate">{currentUser.tenantName}</span>
                </div>
              </div>

              <div className="p-1 space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('team');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Team & Permissions</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('settings');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Business Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('agent');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  <span>Agent Configuration</span>
                </button>
              </div>

              <div className="pt-1 mt-1 border-t border-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-xs text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
