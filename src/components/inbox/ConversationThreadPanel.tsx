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
  RefreshCw,
  Image as ImageIcon,
  User,
} from 'lucide-react';
import { useApiData } from '../../hooks/useApiData';
import { api, apiAssetUrl } from '../../lib/api';

interface ConversationThreadPanelProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (text: string, isInternalNote: boolean, attachment?: any) => void;
  onTakeoverFromAi: () => void;
  onReturnControlToAi: () => void;
  onOpenCorrectionModal: (message: Message) => void;
  onOpenTransferModal: () => void;
  onBackToList?: () => void;
  onToggleContextPanel?: () => void;
  isMobile?: boolean;
}

export const ConversationThreadPanel: React.FC<ConversationThreadPanelProps> = ({
  conversation,
  messages,
  onSendMessage,
  onTakeoverFromAi,
  onReturnControlToAi,
  onOpenCorrectionModal,
  onOpenTransferModal,
  onBackToList,
  onToggleContextPanel,
  isMobile,
}) => {
  const [inputText, setInputText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isCannedDropdownOpen, setIsCannedDropdownOpen] = useState(false);
  const [selectedSourceToView, setSelectedSourceToView] = useState<{ title: string; snippet: string } | null>(null);
  const [visibleCustomerTimestampId, setVisibleCustomerTimestampId] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachment, setPendingAttachment] = useState<any>(null);
  const cannedRepliesQ = useApiData<{ replies: Array<{ id: string; title: string; text: string; channel?: string }> }>('/inbox/canned-replies');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const maxHeight = 144;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [inputText]);

  const handleSend = () => {
    if (!inputText.trim() && !pendingAttachment) return;
    onSendMessage(inputText, isInternalNote, pendingAttachment ?? undefined);
    setInputText('');
    setPendingAttachment(null);
  };

  const handleAttachment = async (file?: File) => {
    if (!file) return;
    try {
      const { url } = await api.upload<{ url: string }>('/inbox/upload', file);
      setPendingAttachment({ type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file', url, name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB` });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Attachment upload failed');
    }
  };

  const handleSelectCanned = (text: string) => {
    setInputText(text);
    setIsCannedDropdownOpen(false);
  };

  const isHumanControlled = conversation.aiStatus === 'human_controlled';
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

          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {conversation.customer.name}
          </h2>

          <img
            src={isWhatsApp ? '/uploads/whatsapp.png' : '/uploads/messenger.png'}
            alt={isWhatsApp ? 'WhatsApp' : 'Messenger'}
            title={isWhatsApp ? 'WhatsApp' : 'Messenger'}
            className="w-4 h-4 rounded-full object-cover shrink-0"
          />
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

          <button
            type="button"
            onClick={onToggleContextPanel}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
            title="Show or hide customer context"
            aria-label="Show or hide customer context"
          >
            <Info className="w-5 h-5" />
          </button>
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
              className={`relative w-full flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
            >
              {/* Message Bubble Container */}
              <div
                onClick={() => {
                  if (isCustomer && window.matchMedia('(max-width: 639px)').matches) {
                    setVisibleCustomerTimestampId((currentId) =>
                      currentId === msg.id ? null : msg.id,
                    );
                  }
                }}
                className={`relative max-w-[85%] sm:max-w-[75%] [overflow-wrap:anywhere] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  isCustomer
                    ? 'group bg-white text-slate-900 border border-slate-200/90 shadow-xs rounded-bl-xs'
                    : isAi
                    ? 'bg-slate-900 text-white rounded-br-xs shadow-sm'
                    : 'bg-slate-800 text-white rounded-br-xs shadow-sm'
                }`}
              >
                {isCustomer && (
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[10px] font-medium text-white shadow-sm sm:block sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    {msg.timestamp}
                  </span>
                )}

                {/* Bubble Header */}
                {!isCustomer && (
                  <div className="flex items-center justify-between gap-3 text-[11px] text-slate-300">
                    <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">
                      {isAi ? 'AI Support Agent' : msg.senderName}
                    </span>
                    <span className="font-mono text-[10px]">{msg.timestamp}</span>
                  </div>
                )}

                {/* Message Body */}
                <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{msg.text}</p>

                {/* Attachment Previews */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {msg.attachments.map((att, i) => (
                      <div key={i}>
                        {att.type === 'image' ? (
                          <div className="rounded-xl overflow-hidden border border-slate-200/40 bg-slate-950/20 max-w-sm">
                            <img
                              src={apiAssetUrl(att.url)}
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

                {/* Delivery status ticks for sent messages */}
                {!isCustomer && msg.deliveryState && (
                  <div className="flex items-center justify-end gap-1 text-[10px] font-mono">
                    <span className="text-slate-400">
                      {msg.deliveryState === 'sent'
                        ? 'Sent'
                        : msg.deliveryState === 'delivered'
                        ? 'Delivered'
                        : 'Read'}
                    </span>
                    <div className="flex items-center -space-x-[9px]">
                      <Check
                        className={`w-3.5 h-3.5 ${
                          msg.deliveryState === 'read' ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      {msg.deliveryState !== 'sent' && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            msg.deliveryState === 'read' ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
              {isCustomer && visibleCustomerTimestampId === msg.id && (
                <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[10px] font-medium text-white shadow-sm sm:hidden">
                  {msg.timestamp}
                </div>
              )}
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
              <span className="sm:hidden">Reply</span>
              <span className="hidden sm:inline">Reply to Customer</span>
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
              <span className="sm:hidden">Note</span>
              <span className="hidden sm:inline">Internal Note (Staff only)</span>
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
              <span className="sm:hidden">Saved</span>
              <span className="hidden sm:inline">Approved Replies</span>
            </button>

            {isCannedDropdownOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-30 space-y-1 max-h-64 overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Insert Approved Reply
                </div>
                {(cannedRepliesQ.data?.replies ?? []).map((can) => (
                  <button
                    key={can.id}
                    type="button"
                    onClick={() => handleSelectCanned(can.text)}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 text-xs transition-colors space-y-0.5"
                  >
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span>{can.title}</span>
                      <span className="text-[10px] text-slate-400">{can.channel ?? 'All channels'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{can.text}</div>
                  </button>
                ))}
                {!cannedRepliesQ.loading && !cannedRepliesQ.data?.replies.length && <p className="px-2 py-3 text-xs text-slate-500">No saved replies yet.</p>}
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
            ref={textareaRef}
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
          {pendingAttachment && <div className="px-3 py-1 text-[11px] text-slate-600">Attached: {pendingAttachment.name} <button type="button" className="ml-2 text-rose-600" onClick={() => setPendingAttachment(null)}>Remove</button></div>}

          {/* Composer Footer Actions */}
          <div className="p-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <input ref={attachmentInputRef} type="file" className="hidden" onChange={(e) => { void handleAttachment(e.target.files?.[0]); e.currentTarget.value = ''; }} />
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                className="p-1 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Attach file / image"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim() && !pendingAttachment}
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
