import React, { useState, useRef, useEffect } from 'react';
import {
  Conversation,
  Message,
} from '../../types/inbox';
import {
  Send,
  Paperclip,
  Bookmark,
  Lock,
  MessageSquare,
  Bot,
  UserCheck,
  Pause,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Info,
  Sparkles,
  Check,
  Clock,
  Volume2,
  FileText,
  CornerDownRight,
  RefreshCw,
  Image as ImageIcon,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';
import { APPROVED_CANNED_REPLIES } from '../../data/inboxMockData';

interface ConversationThreadPanelProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (text: string, isInternalNote: boolean, attachment?: any) => void;
  onTakeoverFromAi: () => void;
  onReturnControlToAi: () => void;
  onTogglePauseAi: () => void;
  onToggleResolved: () => void;
  onOpenCorrectionModal: (message: Message) => void;
  onOpenTransferModal: () => void;
  onBackToList?: () => void;
  onToggleContextDrawer?: () => void;
  isMobile?: boolean;
}

export const ConversationThreadPanel: React.FC<ConversationThreadPanelProps> = ({
  conversation,
  messages,
  onSendMessage,
  onTakeoverFromAi,
  onReturnControlToAi,
  onTogglePauseAi,
  onToggleResolved,
  onOpenCorrectionModal,
  onOpenTransferModal,
  onBackToList,
  onToggleContextDrawer,
  isMobile,
}) => {
  const [inputText, setInputText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isCannedDropdownOpen, setIsCannedDropdownOpen] = useState(false);
  const [selectedSourceToView, setSelectedSourceToView] = useState<{ title: string; snippet: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText, isInternalNote);
    setInputText('');
  };

  const handleSelectCanned = (text: string) => {
    setInputText(text);
    setIsCannedDropdownOpen(false);
  };

  const isHumanControlled = conversation.aiStatus === 'human_controlled';
  const isAiPaused = conversation.aiStatus === 'paused';
  const isResolved = conversation.status === 'resolved';
  const isWhatsApp = conversation.channel === 'whatsapp';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden relative">
      {/* Top Thread Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200/90 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Only customer name and messenger/whatsapp badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          {isMobile && (
            <button
              type="button"
              onClick={onBackToList}
              className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg shrink-0"
              title="Back to conversation list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {conversation.customer.name}
          </h2>

          {/* Messenger / WhatsApp badge */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
              isWhatsApp
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                : 'bg-blue-50 text-blue-700 border border-blue-200/80'
            }`}
          >
            {isWhatsApp ? (
              <PhoneCall className="w-3 h-3 text-emerald-600" />
            ) : (
              <MessageCircle className="w-3 h-3 text-blue-600" />
            )}
            <span>{isWhatsApp ? 'WhatsApp' : 'Messenger'}</span>
          </span>
        </div>

        {/* Right: Keep action buttons (search button removed) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Take Over / Return to AI Toggle */}
          {isHumanControlled ? (
            <button
              type="button"
              onClick={onReturnControlToAi}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
              title="Return control to AI agent"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Return to AI</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onTakeoverFromAi}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              title="Take over conversation from AI"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Take Over</span>
            </button>
          )}

          {/* Pause AI */}
          <button
            type="button"
            onClick={onTogglePauseAi}
            className={`p-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isAiPaused
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title={isAiPaused ? 'Resume AI' : 'Pause AI for this conversation'}
          >
            {isAiPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Resolve / Reopen */}
          <button
            type="button"
            onClick={onToggleResolved}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isResolved
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isResolved ? 'Reopen' : 'Resolve'}
          </button>

          {/* Mobile Info Drawer Toggle */}
          {isMobile && (
            <button
              type="button"
              onClick={onToggleContextDrawer}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
              title="Customer context"
            >
              <Info className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* AI Processing Banner (Live Activity Indicator) */}
      {conversation.isAiProcessing && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-300" />
            <span>AI is analyzing customer message and querying knowledge base...</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Gemini 2.5 Flash</span>
        </div>
      )}

      {/* Message History Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          // System Event
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <div className="px-3.5 py-1.5 rounded-full bg-slate-200/70 border border-slate-300/50 text-[11px] text-slate-600 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>{msg.text}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    · {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          // Staff Internal Note
          if (msg.isInternalNote) {
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <div className="w-full max-w-xl p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-600" />
                      Internal Note · {msg.senderName}
                    </span>
                    <span className="text-[10px] text-amber-700 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-sans">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          }

          const isCustomer = msg.sender === 'customer';
          const isAi = msg.sender === 'ai';
          const isStaff = msg.sender === 'staff';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
            >
              {/* Message Bubble Container */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  isCustomer
                    ? 'bg-white text-slate-900 border border-slate-200/90 shadow-xs rounded-bl-xs'
                    : isAi
                    ? 'bg-slate-900 text-white rounded-br-xs shadow-sm'
                    : 'bg-slate-800 text-white rounded-br-xs shadow-sm'
                }`}
              >
                {/* Bubble Header */}
                <div
                  className={`flex items-center justify-between gap-3 text-[11px] ${
                    isCustomer ? 'text-slate-400' : 'text-slate-300'
                  }`}
                >
                  <span className="font-semibold">
                    {isCustomer
                      ? msg.senderName
                      : isAi
                      ? 'AI Support Agent'
                      : `Staff (${msg.senderName})`}
                  </span>
                  <span className="font-mono text-[10px]">{msg.timestamp}</span>
                </div>

                {/* Message Body */}
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Attachment Previews */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {msg.attachments.map((att, i) => (
                      <div key={i}>
                        {att.type === 'image' ? (
                          <div className="rounded-xl overflow-hidden border border-slate-200/40 bg-slate-950/20 max-w-sm">
                            <img
                              src={att.url}
                              alt={att.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-44 object-cover hover:opacity-95 transition-opacity"
                            />
                            <div className="p-2 text-[10px] text-slate-300 flex items-center justify-between">
                              <span className="truncate">{att.name}</span>
                              <span className="font-mono">{att.size}</span>
                            </div>
                          </div>
                        ) : att.type === 'audio' ? (
                          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3 text-white">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                              <Volume2 className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="text-[11px] font-semibold">{att.name}</div>
                              <div className="text-[10px] text-slate-400">Audio note transcribed</div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-slate-100 text-slate-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span className="text-[11px] truncate">{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Metadata & Evidence Strip */}
                {isAi && msg.aiMetadata && (
                  <div className="mt-2 pt-2 border-t border-slate-700/80 text-[10px] flex flex-wrap items-center justify-between gap-2 text-slate-300 font-mono">
                    <div className="flex items-center gap-2">
                      {msg.aiMetadata.isLowConfidence ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Low confidence ({((msg.aiMetadata.confidence || 0) * 100).toFixed(0)}%)
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Confidence: {((msg.aiMetadata.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      )}

                      {msg.aiMetadata.usedSources && msg.aiMetadata.usedSources.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSourceToView(msg.aiMetadata!.usedSources[0])}
                          className="text-slate-300 underline hover:text-white"
                        >
                          Source: {msg.aiMetadata.usedSources[0].title}
                        </button>
                      )}
                    </div>

                    {/* Staff Correction Trigger */}
                    <button
                      type="button"
                      onClick={() => onOpenCorrectionModal(msg)}
                      className="text-purple-300 hover:text-white flex items-center gap-1 font-sans text-[11px]"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Correct Reply</span>
                    </button>
                  </div>
                )}

                {/* Delivery checkmarks for staff */}
                {!isCustomer && msg.deliveryState && (
                  <div className="flex justify-end text-[10px] text-slate-400 font-mono gap-1">
                    <span>{msg.deliveryState}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Knowledge Source Inspection Modal / Toast Drawer */}
      {selectedSourceToView && (
        <div className="absolute inset-x-4 bottom-24 z-30 p-4 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">{selectedSourceToView.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSourceToView(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            "{selectedSourceToView.snippet}"
          </p>
        </div>
      )}

      {/* Composer Section */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shrink-0 space-y-2">
        {/* Composer Mode Switcher: Customer Reply vs Internal Staff Note */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIsInternalNote(false)}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                !isInternalNote
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reply to Customer</span>
            </button>
            <button
              type="button"
              onClick={() => setIsInternalNote(true)}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                isInternalNote
                  ? 'bg-amber-100 text-amber-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Internal Note (Staff only)</span>
            </button>
          </div>

          {/* Canned Approved Replies Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCannedDropdownOpen(!isCannedDropdownOpen)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Approved Replies</span>
            </button>

            {isCannedDropdownOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-30 space-y-1 max-h-64 overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Insert Approved Reply
                </div>
                {APPROVED_CANNED_REPLIES.map((can) => (
                  <button
                    key={can.id}
                    type="button"
                    onClick={() => handleSelectCanned(can.text)}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 text-xs transition-colors space-y-0.5"
                  >
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span>{can.title}</span>
                      <span className="text-[10px] text-slate-400">{can.category}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{can.text}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Text Input Container */}
        <div
          className={`rounded-2xl border transition-all ${
            isInternalNote
              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-100'
              : 'bg-slate-50 border-slate-200 focus-within:border-slate-900 focus-within:bg-white'
          }`}
        >
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isInternalNote
                ? 'Add an internal note for staff colleagues (never shown to customer)...'
                : 'Type a message to customer (Enter to send, Shift+Enter for newline)...'
            }
            className="w-full p-3 text-xs bg-transparent border-none outline-none resize-none text-slate-900 placeholder:text-slate-400"
          />

          {/* Composer Footer Actions */}
          <div className="p-2 flex items-center justify-between border-t border-slate-200/60">
            <div className="flex items-center gap-2 text-slate-400">
              <button
                type="button"
                onClick={() => alert('File attachment simulation: ready for image/audio uploads')}
                className="p-1 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Attach file / image"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenTransferModal}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                title="Transfer to another department"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Transfer</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                isInternalNote
                  ? 'bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-50'
                  : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50'
              }`}
            >
              <span>{isInternalNote ? 'Save Note' : 'Send'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
