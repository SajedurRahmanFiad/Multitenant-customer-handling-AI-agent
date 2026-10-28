import React from 'react';
import {
  Conversation,
  ConversationFilter,
} from '../../types/inbox';
import {
  Search,
  MessageCircle,
  PhoneCall,
  User,
  Filter,
} from 'lucide-react';

interface ConversationListPanelProps {
  conversations: Conversation[];
  selectedId: string;
  onSelectConversation: (id: string) => void;
  activeFilter: ConversationFilter;
  onChangeFilter: (filter: ConversationFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const FILTER_TABS: Array<{ id: ConversationFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'needs_human', label: 'Needs human' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'ai_handling', label: 'AI handling' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'resolved', label: 'Resolved' },
];

export const ConversationListPanel: React.FC<ConversationListPanelProps> = ({
  conversations,
  selectedId,
  onSelectConversation,
  activeFilter,
  onChangeFilter,
  searchQuery,
  onSearchChange,
}) => {
  // Count items by filter
  const getCount = (filter: ConversationFilter) => {
    switch (filter) {
      case 'all':
        return conversations.length;
      case 'unassigned':
        return conversations.filter((c) => !c.assignedStaff && c.status !== 'resolved').length;
      case 'needs_human':
        return conversations.filter((c) => c.status === 'needs_human').length;
      case 'ai_handling':
        return conversations.filter((c) => c.status === 'ai_handling').length;
      case 'waiting':
        return conversations.filter((c) => c.status === 'waiting').length;
      case 'resolved':
        return conversations.filter((c) => c.status === 'resolved').length;
      default:
        return 0;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/90 w-full shrink-0 overflow-hidden">
      {/* Top Header & Search */}
      <div className="p-3.5 border-b border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Conversations
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {conversations.length} total
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
          />
        </div>

        {/* Filter Tabs Horizontal Scroll */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const count = getCount(tab.id);
            const isActive = activeFilter === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeFilter(tab.id)}
                className={`px-2 py-1 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Filter className="w-5 h-5 mx-auto text-slate-300" />
            <p className="text-xs">No conversations found.</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = selectedId === conv.id;
            const isWhatsApp = conv.channel === 'whatsapp';

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-3 text-left transition-all flex items-start gap-3 relative ${
                  isSelected
                    ? 'bg-slate-100/90 border-l-4 border-l-slate-900'
                    : 'hover:bg-slate-50/80 bg-white'
                }`}
              >
                {/* 1. Profile picture (with Messenger / WhatsApp badge on bottom right corner) */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 overflow-hidden font-semibold text-xs">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>

                  {/* Messenger / WhatsApp icon on the bottom right corner */}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                      isWhatsApp ? 'bg-[#25D366] text-white' : 'bg-[#0084FF] text-white'
                    }`}
                    title={isWhatsApp ? 'WhatsApp' : 'Messenger'}
                  >
                    {isWhatsApp ? (
                      <PhoneCall className="w-2.5 h-2.5" />
                    ) : (
                      <MessageCircle className="w-2.5 h-2.5" />
                    )}
                  </div>
                </div>

                {/* Content details */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  {/* Top line: Name, when last message was sent/received, unread count */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {conv.customer.name}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {conv.lastMessageTime}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="w-4 h-4 bg-slate-900 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle line: A portion of the last message (one line, use dots to explain there's more) */}
                  <p className="text-xs text-slate-500 truncate leading-snug">
                    {conv.lastMessage}...
                  </p>

                  {/* Bottom line: ai handling / needs human text, priority level, assigned person */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate pt-0.5 font-medium">
                    {/* Status text */}
                    <span
                      className={`shrink-0 ${
                        conv.status === 'needs_human'
                          ? 'text-amber-700 font-semibold'
                          : conv.status === 'ai_handling'
                          ? 'text-emerald-700 font-semibold'
                          : 'text-slate-500'
                      }`}
                    >
                      {conv.status === 'needs_human'
                        ? 'Needs human'
                        : conv.status === 'ai_handling'
                        ? 'AI handling'
                        : conv.status === 'waiting'
                        ? 'Waiting'
                        : 'Resolved'}
                    </span>

                    <span>·</span>

                    {/* Priority level */}
                    <span
                      className={`capitalize shrink-0 ${
                        conv.priority === 'urgent'
                          ? 'text-rose-600 font-semibold'
                          : conv.priority === 'high'
                          ? 'text-amber-600 font-semibold'
                          : 'text-slate-500'
                      }`}
                    >
                      {conv.priority}
                    </span>

                    <span>·</span>

                    {/* Assigned person */}
                    <span className="truncate text-slate-500">
                      {conv.assignedStaff || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
