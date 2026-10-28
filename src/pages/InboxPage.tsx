import React, { useState } from 'react';
import {
  Conversation,
  Message,
  ConversationFilter,
  PriorityType,
} from '../types/inbox';
import {
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
} from '../data/inboxMockData';
import { ConversationListPanel } from '../components/inbox/ConversationListPanel';
import { ConversationThreadPanel } from '../components/inbox/ConversationThreadPanel';
import { ContextSidebarPanel } from '../components/inbox/ContextSidebarPanel';
import { CorrectReplyModal } from '../components/inbox/CorrectReplyModal';
import { TransferTeamModal } from '../components/inbox/TransferTeamModal';
import { CheckCircle2 } from 'lucide-react';

export const InboxPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState<string>(INITIAL_CONVERSATIONS[0].id);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile navigation state: 'list' or 'thread'
  const [mobileScreen, setMobileScreen] = useState<'list' | 'thread'>('list');
  const [isMobileContextOpen, setIsMobileContextOpen] = useState(false);

  // Modals state
  const [correctingMessage, setCorrectingMessage] = useState<Message | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentConversation =
    conversations.find((c) => c.id === selectedConvId) || conversations[0];
  const currentMessages = messagesMap[selectedConvId] || [];

  // Filter conversations based on tab and search query
  const filteredConversations = conversations.filter((c) => {
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
      const matchLastMsg = c.lastMessage.toLowerCase().includes(q);
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
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  // 1. Send Message / Internal Note
  const handleSendMessage = (text: string, isInternalNote: boolean) => {
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: selectedConvId,
      sender: isInternalNote ? 'staff' : 'staff',
      senderName: 'Rafiq Islam',
      text,
      timestamp: 'Just now',
      deliveryState: isInternalNote ? undefined : 'sent',
      isInternalNote,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMsg],
    }));

    if (!isInternalNote) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? {
                ...c,
                lastMessage: text,
                lastMessageTime: 'Just now',
                // If staff replies to customer, ensure staff control is marked
                aiStatus: 'human_controlled',
              }
            : c
        )
      );
      showToast('Reply sent to customer via WhatsApp/Messenger webhook');
    } else {
      showToast('Internal note saved to thread');
    }
  };

  // 2. Take Over from AI
  const handleTakeoverFromAi = () => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId
          ? {
              ...c,
              aiStatus: 'human_controlled',
              assignedStaff: c.assignedStaff || 'Rafiq Islam',
              status: 'needs_human',
            }
          : c
      )
    );

    const eventMsg: Message = {
      id: `evt_${Date.now()}`,
      conversationId: selectedConvId,
      sender: 'system',
      senderName: 'System',
      text: 'Staff Rafiq Islam took over control. AI auto-replies suppressed.',
      timestamp: 'Just now',
      systemEventType: 'takeover',
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), eventMsg],
    }));

    showToast('You took over control. AI will not reply until returned.');
  };

  // 3. Return Control to AI
  const handleReturnControlToAi = () => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId
          ? {
              ...c,
              aiStatus: 'active',
              status: 'ai_handling',
            }
          : c
      )
    );

    const eventMsg: Message = {
      id: `evt_${Date.now()}`,
      conversationId: selectedConvId,
      sender: 'system',
      senderName: 'System',
      text: 'Control returned to AI agent. Auto-replying resumed.',
      timestamp: 'Just now',
      systemEventType: 'release',
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), eventMsg],
    }));

    showToast('Control returned to AI agent');
  };

  // 4. Toggle Pause AI
  const handleTogglePauseAi = () => {
    const nextAiStatus =
      currentConversation.aiStatus === 'paused' ? 'active' : 'paused';

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId ? { ...c, aiStatus: nextAiStatus } : c
      )
    );

    showToast(
      nextAiStatus === 'paused'
        ? 'AI paused for this thread'
        : 'AI resumed for this thread'
    );
  };

  // 5. Toggle Resolved
  const handleToggleResolved = () => {
    const nextStatus =
      currentConversation.status === 'resolved' ? 'needs_human' : 'resolved';

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId ? { ...c, status: nextStatus } : c
      )
    );

    showToast(
      nextStatus === 'resolved'
        ? 'Conversation marked as resolved'
        : 'Conversation reopened'
    );
  };

  // 6. Update Priority
  const handleUpdatePriority = (priority: PriorityType) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId ? { ...c, priority } : c
      )
    );
    showToast(`Priority set to ${priority}`);
  };

  // 7. Update Staff
  const handleUpdateStaff = (assignedStaff: string | null) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId ? { ...c, assignedStaff } : c
      )
    );
    showToast(assignedStaff ? `Assigned to ${assignedStaff}` : 'Marked as unassigned');
  };

  // 8. Add / Remove Tag
  const handleAddTag = (tag: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId
          ? { ...c, tags: Array.from(new Set([...c.tags, tag])) }
          : c
      )
    );
    showToast(`Tag "${tag}" added`);
  };

  const handleRemoveTag = (tag: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId
          ? { ...c, tags: c.tags.filter((t) => t !== tag) }
          : c
      )
    );
  };

  // 9. Department Transfer
  const handleTransfer = (team: string, staff: string | null, note: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId
          ? {
              ...c,
              assignedTeam: team,
              assignedStaff: staff,
              status: 'needs_human',
            }
          : c
      )
    );

    const eventMsg: Message = {
      id: `evt_${Date.now()}`,
      conversationId: selectedConvId,
      sender: 'system',
      senderName: 'System',
      text: `Conversation transferred to ${team}${staff ? ` (${staff})` : ''}.${note ? ` Note: "${note}"` : ''}`,
      timestamp: 'Just now',
      systemEventType: 'assigned',
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), eventMsg],
    }));

    showToast(`Transferred to ${team}`);
  };

  // 10. Correction Submission
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
    <div className="w-full h-[calc(100vh-10rem)] min-h-[580px] bg-white rounded-3xl border border-slate-200/90 shadow-xs flex overflow-hidden relative">
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
            onTogglePauseAi={handleTogglePauseAi}
            onToggleResolved={handleToggleResolved}
            onOpenCorrectionModal={setCorrectingMessage}
            onOpenTransferModal={() => setIsTransferModalOpen(true)}
            onBackToList={() => setMobileScreen('list')}
            onToggleContextDrawer={() => setIsMobileContextOpen(!isMobileContextOpen)}
            isMobile={mobileScreen === 'thread'}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
            Select a conversation to view thread.
          </div>
        )}
      </div>

      {/* Panel 3: Customer and AI Context (Desktop Sidebar) */}
      <div className="hidden lg:flex h-full w-[340px] xl:w-[360px] shrink-0 border-l border-slate-200/90">
        {currentConversation && (
          <ContextSidebarPanel
            conversation={currentConversation}
            onUpdatePriority={handleUpdatePriority}
            onUpdateAssignedStaff={handleUpdateStaff}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onOpenTransferModal={() => setIsTransferModalOpen(true)}
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
              onUpdateAssignedStaff={handleUpdateStaff}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onOpenTransferModal={() => setIsTransferModalOpen(true)}
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
