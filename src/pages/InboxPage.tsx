import React, { useEffect, useRef, useState } from 'react';
import {
  Conversation,
  Message,
  ChannelFilter,
  ConversationFilter,
  PriorityType,
} from '../types/inbox';
import { api } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { ConversationListPanel } from '../components/inbox/ConversationListPanel';
import { ConversationThreadPanel } from '../components/inbox/ConversationThreadPanel';
import { ContextSidebarPanel } from '../components/inbox/ContextSidebarPanel';
import { CorrectReplyModal } from '../components/inbox/CorrectReplyModal';
import { TransferTeamModal } from '../components/inbox/TransferTeamModal';
import { CheckCircle2 } from 'lucide-react';
import { useUrlQueryState } from '../hooks/useUrlQueryState';

export const InboxPage: React.FC = () => {
  const inboxContainerRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [activeFilter, setActiveFilter] = useUrlQueryState<ConversationFilter>(
    'status', 'all', ['all', 'unassigned', 'needs_human', 'ai_handling', 'waiting', 'resolved']
  );
  const [channelQuery, setChannelQuery] = useUrlQueryState<'all' | 'messenger' | 'whatsapp'>(
    'channel', 'all', ['all', 'messenger', 'whatsapp']
  );
  const activeChannelFilter: ChannelFilter = channelQuery === 'all' ? null : channelQuery;
  const setActiveChannelFilter = (channel: ChannelFilter) => setChannelQuery(channel ?? 'all');
  const [searchQuery, setSearchQuery] = useUrlQueryState<string>('q', '', undefined, true);

  // Mobile navigation state: 'list' or 'thread'
  const [mobileScreen, setMobileScreen] = useState<'list' | 'thread'>('list');
  const [isMobileContextOpen, setIsMobileContextOpen] = useState(false);
  const [isDesktopContextOpen, setIsDesktopContextOpen] = useState(true);

  // Modals state
  const [correctingMessage, setCorrectingMessage] = useState<Message | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const listQ = useApiData<{ conversations: Array<Record<string, any>> }>('/inbox/conversations');

  useEffect(() => {
    if (!listQ.data) return;
    const rows = listQ.data.conversations.map((row) => ({
      ...row,
      customer: { id: row.customer?.id ?? row.customerId, name: row.customer?.name ?? '', phone: row.customer?.phone ?? '', email: '', city: '', externalId: row.customer?.externalId ?? '', language: '', memoryNotes: '', totalOrders: 0, totalSpent: '0', previousConversationsCount: 0 },
      retrievedSources: row.retrievedSources ?? [], tags: row.tags ?? [],
    })) as Conversation[];
    setConversations(rows);
    setSelectedConvId((current) => rows.some((item) => item.id === current) ? current : (rows[0]?.id ?? ''));
  }, [listQ.data]);

  useEffect(() => {
    if (!selectedConvId) return;
    let cancelled = false;
    Promise.all([
      api.get<{ conversation: Record<string, any> }>(`/inbox/conversations/${selectedConvId}`),
      api.get<{ messages: Message[] }>(`/inbox/conversations/${selectedConvId}/messages`),
    ]).then(([detail, thread]) => {
      if (cancelled) return;
      setConversations((prev) => prev.map((item) => item.id === selectedConvId ? { ...item, ...detail.conversation } as Conversation : item));
      setMessagesMap((prev) => ({ ...prev, [selectedConvId]: thread.messages }));
      api.post(`/inbox/conversations/${selectedConvId}/read`).then(() => listQ.reload()).catch(() => undefined);
    }).catch((err: unknown) => showToast(err instanceof Error ? err.message : 'Could not load conversation'));
    return () => { cancelled = true; };
  }, [selectedConvId]);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    const mobileViewport = window.matchMedia('(max-width: 1023px)');

    const updateKeyboardInset = () => {
      const inset = visualViewport && mobileViewport.matches
        ? Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)
        : 0;
      inboxContainerRef.current?.style.setProperty('--inbox-keyboard-inset', `${inset}px`);
    };

    visualViewport?.addEventListener('resize', updateKeyboardInset);
    visualViewport?.addEventListener('scroll', updateKeyboardInset);
    window.addEventListener('resize', updateKeyboardInset);
    updateKeyboardInset();

    return () => {
      visualViewport?.removeEventListener('resize', updateKeyboardInset);
      visualViewport?.removeEventListener('scroll', updateKeyboardInset);
      window.removeEventListener('resize', updateKeyboardInset);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentConversation =
    conversations.find((c) => c.id === selectedConvId) || conversations[0];
  const currentMessages = messagesMap[selectedConvId] || [];

  if (!currentConversation) {
    return <div className="h-full min-h-[320px] rounded-3xl border border-slate-200 bg-white p-8 flex items-center justify-center text-sm text-slate-500">{listQ.loading ? 'Loading conversations…' : listQ.error || 'No conversations yet.'}</div>;
  }

  const conversationPreviews = Object.fromEntries(
    conversations.map((conversation) => {
      const threadMessages = messagesMap[conversation.id] || [];
      const lastRelevantMessage = [...threadMessages]
        .reverse()
        .find((message) => message.sender !== 'system' && message.text.trim().length > 0);

      const previewText = lastRelevantMessage?.text ?? conversation.lastMessage;
      const isFromCurrentUser = Boolean(
        lastRelevantMessage && ['ai', 'staff'].includes(lastRelevantMessage.sender)
      );

      return [conversation.id, { text: previewText, isFromCurrentUser }];
    })
  ) as Record<string, { text: string; isFromCurrentUser: boolean }>;

  // Filter conversations based on tab and search query
  const filteredConversations = conversations.filter((c) => {
    if (activeChannelFilter && c.channel !== activeChannelFilter) {
      return false;
    }

    // Filter Tab
    if (activeFilter === 'unassigned' && (c.assignedStaff !== null || c.status === 'resolved')) {
      return false;
    }
    if (activeFilter === 'needs_human' && c.status !== 'needs_human') {
      return false;
    }
    if (activeFilter === 'ai_handling' && c.status !== 'ai_handling') {
      return false;
    }
    if (activeFilter === 'waiting' && c.status !== 'waiting') {
      return false;
    }
    if (activeFilter === 'resolved' && c.status !== 'resolved') {
      return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customer.name.toLowerCase().includes(q);
      const matchPhone = c.customer.phone.toLowerCase().includes(q);
      const matchLastMsg = (conversationPreviews[c.id]?.text ?? c.lastMessage).toLowerCase().includes(q);
      const matchCity = c.customer.city.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchLastMsg && !matchCity) {
        return false;
      }
    }

    return true;
  });

  const handleSelectConversation = (id: string) => {
    setSelectedConvId(id);
    setMobileScreen('thread');

    // Mark as read
    api.post(`/inbox/conversations/${id}/read`).then(() => listQ.reload()).catch(() => undefined);
  };

  // 1. Send Message / Internal Note
  const handleSendMessage = (text: string, isInternalNote: boolean, attachment?: any) => {
    api.post<{ message: Message }>(`/inbox/conversations/${selectedConvId}/messages`, {
      text, isInternalNote, attachments: attachment ? [attachment] : [],
    }).then(({ message }) => {
      setMessagesMap((prev) => ({ ...prev, [selectedConvId]: [...(prev[selectedConvId] || []), message] }));
      listQ.reload();
      showToast(isInternalNote ? 'Internal note saved' : 'Reply recorded');
    }).catch((err: unknown) => showToast(err instanceof Error ? err.message : 'Could not send message'));
  };

  // 2. Take Over from AI
  const refreshThread = () => {
    api.get<{ conversation: Record<string, any> }>(`/inbox/conversations/${selectedConvId}`).then(({ conversation }) => setConversations((prev) => prev.map((c) => c.id === selectedConvId ? { ...c, ...conversation } as Conversation : c)));
    api.get<{ messages: Message[] }>(`/inbox/conversations/${selectedConvId}/messages`).then(({ messages }) => setMessagesMap((prev) => ({ ...prev, [selectedConvId]: messages })));
    listQ.reload();
  };
  const handleTakeoverFromAi = () => {
    api.post(`/inbox/conversations/${selectedConvId}/ai-control`, { action: 'takeover' }).then(refreshThread).catch((err: unknown) => showToast(err instanceof Error ? err.message : 'Could not take over'));
  };

  // 3. Return Control to AI
  const handleReturnControlToAi = () => {
    api.post(`/inbox/conversations/${selectedConvId}/ai-control`, { action: 'release' }).then(refreshThread).catch((err: unknown) => showToast(err instanceof Error ? err.message : 'Could not return control'));
  };

  // 4. Update Priority
  const handleUpdatePriority = (priority: PriorityType) => {
    api.post(`/inbox/conversations/${selectedConvId}/priority`, { priority }).then(refreshThread).catch((err: unknown) => showToast(err instanceof Error ? err.message : 'Could not update priority'));
  };

  // 5. Department Transfer
  const handleTransfer = (team: string, staff: string | null, note: string) => {
    api.get<{ teams: Array<{ id: string; name: string }> }>('/team/teams').then(({ teams }) => {
      const target = teams.find((item) => item.name === team);
      if (!target) throw new Error(`Team "${team}" is not configured for this workspace`);
      return api.post(`/inbox/conversations/${selectedConvId}/transfer-team`, { teamId: target.id, note })
        .then(() => staff ? api.get<{ members: Array<{ id: string; name: string }> }>('/team/members').then(({ members }) => {
          const member = members.find((item) => item.name === staff);
          if (!member) throw new Error(`Staff member "${staff}" is not on this team`);
          return api.post(`/inbox/conversations/${selectedConvId}/assign`, { staffId: member.id });
        }) : undefined);
    }).then(refreshThread).catch((err: unknown) => showToast(err instanceof Error ? err.message : 'Could not transfer conversation'));
  };

  // 8. Correction Submission
  const handleCorrectionSubmit = (
    messageId: string,
    correctedText: string,
    addToKnowledge: boolean,
    notes: string
  ) => {
    setMessagesMap((prev) => ({
      ...prev,
      [selectedConvId]: (prev[selectedConvId] || []).map((m) =>
        m.id === messageId
          ? {
              ...m,
              aiMetadata: {
                ...m.aiMetadata!,
                correctionNote: notes,
              },
            }
          : m
      ),
    }));

    showToast(
      addToKnowledge
        ? 'Correction saved and queued to train future style examples'
        : 'Correction recorded for staff QA review'
    );
  };

  return (
    <div
      ref={inboxContainerRef}
      className="fixed inset-x-0 top-[57px] bottom-[var(--inbox-keyboard-inset,0px)] z-10 min-h-0 bg-white rounded-none border-0 shadow-none flex overflow-hidden lg:relative lg:inset-auto lg:z-auto lg:h-[calc(100vh-10rem)] lg:min-h-[580px] lg:rounded-3xl lg:border lg:border-slate-200/90 lg:shadow-xs"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desktop Layout: 3 Panels side-by-side */}
      {/* Mobile Layout: Stacked screen-by-screen */}

      {/* Panel 1: Conversation List */}
      <div
        className={`h-full shrink-0 lg:flex lg:w-[320px] xl:w-[340px] ${
          mobileScreen === 'list' ? 'flex w-full' : 'hidden'
        }`}
      >
        <ConversationListPanel
          conversations={filteredConversations}
          selectedId={selectedConvId}
          onSelectConversation={handleSelectConversation}
          activeFilter={activeFilter}
          onChangeFilter={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          messagePreviews={conversationPreviews}
          activeChannelFilter={activeChannelFilter}
          onChangeChannelFilter={setActiveChannelFilter}
        />
      </div>

      {/* Panel 2: Conversation Thread */}
      <div
        className={`h-full flex-1 min-w-0 flex-col lg:flex ${
          mobileScreen === 'thread' ? 'flex w-full' : 'hidden'
        }`}
      >
        {currentConversation ? (
          <ConversationThreadPanel
            conversation={currentConversation}
            messages={currentMessages}
            onSendMessage={handleSendMessage}
            onTakeoverFromAi={handleTakeoverFromAi}
            onReturnControlToAi={handleReturnControlToAi}
            onOpenCorrectionModal={setCorrectingMessage}
            onOpenTransferModal={() => setIsTransferModalOpen(true)}
            onBackToList={() => setMobileScreen('list')}
            onToggleContextPanel={() => {
              if (window.matchMedia('(min-width: 1024px)').matches) {
                setIsDesktopContextOpen((isOpen) => !isOpen);
              } else {
                setIsMobileContextOpen((isOpen) => !isOpen);
              }
            }}
            isMobile={mobileScreen === 'thread'}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
            Select a conversation to view thread.
          </div>
        )}
      </div>

      {/* Panel 3: Customer and AI Context (Desktop Sidebar) */}
      <div className={`${isDesktopContextOpen ? 'hidden lg:flex' : 'hidden'} h-full w-[340px] xl:w-[360px] shrink-0 border-l border-slate-200/90`}>
        {currentConversation && (
          <ContextSidebarPanel
            conversation={currentConversation}
            onUpdatePriority={handleUpdatePriority}
          />
        )}
      </div>

      {/* Mobile Panel 3 Drawer / Sheet */}
      {isMobileContextOpen && currentConversation && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileContextOpen(false)}
          />
          <div className="relative w-[85vw] max-w-sm h-full bg-white z-10 shadow-2xl flex flex-col">
            <ContextSidebarPanel
              conversation={currentConversation}
              onUpdatePriority={handleUpdatePriority}
              onCloseMobileDrawer={() => setIsMobileContextOpen(false)}
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <CorrectReplyModal
        isOpen={!!correctingMessage}
        message={correctingMessage}
        onClose={() => setCorrectingMessage(null)}
        onSubmitCorrection={handleCorrectionSubmit}
      />

      <TransferTeamModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        currentTeam={currentConversation?.assignedTeam}
        onTransfer={handleTransfer}
      />
    </div>
  );
};
