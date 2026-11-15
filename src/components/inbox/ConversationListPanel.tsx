import React from 'react';
import {
  ChannelFilter,
  Conversation,
  ConversationFilter,
} from '../../types/inbox';
import {
  Search,
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
  messagePreviews?: Record<string, { text: string; isFromCurrentUser: boolean }>;
  activeChannelFilter: ChannelFilter;
  onChangeChannelFilter: (filter: ChannelFilter) => void;
}

const FILTER_TABS: Array<{ id: ConversationFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'needs_human', label: 'Needs human' },
  { id: 'ai_handling', label: 'AI handling' },
];

export const ConversationListPanel: React.FC<ConversationListPanelProps> = ({
  conversations,
  selectedId,
  onSelectConversation,
  activeFilter,
  onChangeFilter,
  searchQuery,
  onSearchChange,
  messagePreviews,
  activeChannelFilter,
  onChangeChannelFilter,
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

        {/* Channel Filters */}
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { id: 'messenger', label: 'Messenger', icon: '/uploads/messenger.png' },
            { id: 'whatsapp', label: 'WhatsApp', icon: '/uploads/whatsapp.png' },
          ] as const).map((channel) => {
            const isActive = activeChannelFilter === channel.id;

            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onChangeChannelFilter(isActive ? null : channel.id)}
                aria-pressed={isActive}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <img src={channel.icon} alt="" className="w-4 h-4 rounded-full object-cover" />
                <span>{channel.label}</span>
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
            const preview = messagePreviews?.[conv.id] ?? {
              text: conv.lastMessage,
              isFromCurrentUser: false,
            };
            const previewText = preview.isFromCurrentUser ? `You: ${preview.text}` : preview.text;
            const truncatedPreview =
              previewText.length > 80 ? `${previewText.slice(0, 80).trimEnd()}…` : previewText;

            const isUnread = conv.unreadCount > 0;
            const statusClass =
              conv.status === 'needs_human'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : conv.status === 'ai_handling'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200';
            const priorityClass =
              conv.priority === 'urgent'
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : conv.priority === 'high'
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : conv.priority === 'medium'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200';

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-3 text-left transition-all flex items-start gap-3 relative ${
                  isSelected
                    ? 'bg-slate-200/80 border-l-4 border-l-slate-900'
                    : isUnread
                    ? 'hover:bg-slate-50/80 bg-white'
                    : 'hover:bg-slate-50/80 bg-slate-100/60'
                }`}
              >
                {/* 1. Profile picture (with Messenger / WhatsApp badge on bottom right corner) */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 overflow-hidden font-semibold text-xs">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>

                  {/* Messenger / WhatsApp icon on the bottom right corner */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-xs [&>svg]:hidden ${
                      isWhatsApp ? 'bg-[#25D366] text-white' : 'bg-[#0084FF] text-white'
                    }`}
                    title={isWhatsApp ? 'WhatsApp' : 'Messenger'}
                  >
                    {isWhatsApp ? (
                      <svg viewBox="0 0 24 24" className="w-2 h-2 fill-current" aria-hidden="true">
                        <path d="M12.04 2.5C6.56 2.5 2.12 6.57 2.12 11.6c0 2.16.8 4.15 2.14 5.7L2.5 21.5l4.55-1.74c1.5.9 3.28 1.47 5.19 1.47 5.48 0 9.91-4.07 9.91-9.1 0-5.03-4.44-9.1-9.91-9.1Zm4.86 8.68-1.92 3.04c-.39.62-1.2.9-1.89.64l-1.65-.62a.8.8 0 0 0-.42-.05l-1.57.42c-.27.07-.52-.18-.44-.45l.62-2.18c.08-.28.03-.58-.14-.8l-1.9-2.4c-.22-.28-.04-.72.31-.72h2.06c.37 0 .72.18.93.49l1.2 1.71c.18.26.5.39.82.34l1.08-.17c.33-.05.66.11.82.4l.69 1.1c.18.28.11.67-.17.88Z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-2 h-2 fill-current" aria-hidden="true">
                        <path d="M12.1 2.3C6.44 2.3 2 6.1 2 10.95c0 2.7 1.42 4.86 3.74 6.27L4.5 20.7l3.26-1.9c.93.28 1.9.44 2.82.44 5.66 0 10.1-3.8 10.1-8.65S17.76 2.3 12.1 2.3Zm-1.6 5.86c.16-.11.33-.17.52-.17h.12c.15 0 .3.03.43.09l1.08.48c.28.12.57.12.85 0l1.28-.63c.28-.14.61.03.69.32.09.28-.08.57-.35.7l-1.08.63c-.42.25-.87.38-1.35.38H12.1c-.43 0-.85-.15-1.18-.42l-.38-.32c-.2-.17-.48-.22-.74-.17-.25.05-.48.21-.63.46l-.35.56c-.14.23-.04.52.2.61l.27.12c.25.11.5.25.72.42.23.17.49.27.76.31l.68.12c.31.06.52.35.52.67v.68c0 .33-.23.62-.55.68l-.72.15c-.44.09-.88.1-1.32.01l-1.52-.38a6.74 6.74 0 0 1-2.45-1.67c-.77-.9-1.2-2.01-1.2-3.17 0-2.54 2.42-4.6 5.41-4.6.62 0 1.22.08 1.8.24l1.15.33c.26.08.54.03.78-.14l.62-.46c.2-.15.46-.2.7-.15.24.05.46.2.61.43l.48.72c.16.25.14.58-.06.81l-.94 1.07c-.19.22-.47.34-.76.34h-.13c-.25 0-.5-.08-.7-.23l-.68-.5c-.17-.12-.37-.18-.58-.16l-.54.05c-.21.02-.42.14-.57.31l-.41.46c-.18.2-.42.36-.68.46l-.47.18c-.17.06-.35.08-.53.06l-.28-.04c-.11-.02-.21-.09-.27-.18-.08-.1-.1-.23-.07-.35l.17-.49c.08-.24.09-.49.03-.74l-.28-.94c-.2-.67-.04-1.42.46-1.94l.51-.52c.5-.5 1.18-.77 1.87-.75H11.5c.27 0 .54.12.73.33l.59.66c.3.33.76.49 1.2.45l.35-.04c.41-.05.8.12 1.09.42l.23.24c.17.18.24.42.2.66-.05.25-.22.47-.45.6l-.64.36c-.2.12-.4.27-.57.45l-.33.33c-.21.2-.5.3-.79.3h-.15c-.27 0-.53-.12-.71-.33l-.57-.66c-.18-.22-.43-.36-.71-.4-.29-.04-.58.02-.82.19l-.76.56c-.22.16-.49.23-.77.2-.27-.03-.53-.18-.72-.41l-.38-.46c-.18-.22-.46-.36-.76-.38-.29-.02-.58.08-.82.29l-.81.7c-.24.21-.55.3-.86.27l-.57-.08c-.26-.04-.53.07-.7.27l-.39.47c-.16.2-.19.46-.09.69.1.23.32.39.56.43l.67.15c.28.06.56.18.82.34l.4.24c.27.16.59.19.88.08l.62-.24c.36-.14.72-.18 1.08-.11l.44.09c.23.05.46.03.67-.07l.48-.22c.18-.08.38-.11.58-.09l.5.08c.21.03.42.15.57.33l.42.49c.2.23.49.38.8.41l.77.08c.36.04.72-.06 1-.27.25-.19.42-.47.49-.77l.18-.73c.11-.46.41-.85.82-1.08l.7-.38c.28-.15.6-.17.89-.06l.77.3c.32.12.68.09 1-.09.31-.18.53-.49.6-.84l.16-.79c.11-.56.44-1 .91-1.28l.81-.49c.3-.18.66-.2 1-.06.35.14.62.44.73.79l.2.63c.09.29.02.6-.2.82l-.5.51c-.22.23-.54.38-.88.39h-.37c-.3 0-.59-.12-.8-.34l-.34-.35c-.18-.18-.42-.3-.68-.33l-.94-.12c-.3-.04-.61.05-.87.28l-.62.56c-.35.31-.82.45-1.28.38l-.96-.15c-.43-.07-.84-.31-1.15-.68l-.38-.46c-.22-.27-.54-.44-.89-.49l-.72-.1c-.27-.04-.54.04-.77.22l-.84.68c-.12.09-.25.17-.39.22-.2.08-.42.1-.63.05l-.44-.1c-.3-.06-.59.05-.8.28l-.62.66c-.19.2-.45.34-.73.39l-.4.08c-.24.05-.49.02-.71-.09l-.52-.25c-.18-.09-.39-.13-.59-.11z"/>
                      </svg>
                    )}
                    <img
                      src={isWhatsApp ? '/uploads/whatsapp.png' : '/uploads/messenger.png'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
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

                  {/* Middle line: A portion of the very last message in the thread */}
                  <p
                    className={`text-xs truncate leading-snug ${
                      isUnread ? 'text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {truncatedPreview}
                  </p>

                  {/* Bottom line: status and priority pills */}
                  <div className="flex items-center gap-2 truncate pt-0.5 font-medium">
                    {(conv.status === 'needs_human' || conv.status === 'ai_handling') && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${statusClass}`}>
                        {conv.status === 'needs_human' ? 'Needs human' : 'AI handling'}
                      </span>
                    )}

                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize ${priorityClass}`}>
                      {conv.priority}
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
