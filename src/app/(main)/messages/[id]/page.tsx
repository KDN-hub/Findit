'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getMessages, sendMessage, ChatMessage, ConversationDetail, getConversationDetail } from '@/services/messages';
import { VerifyIdentityModal } from '@/components/VerifyIdentityModal';
import { HandoverModal } from '@/components/HandoverModal';
import { API_BASE_URL } from '@/lib/config';

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

export default function ConversationPage() {
  const params = useParams();
  const id = params.id as string;
  const conversationId = parseInt(id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number } | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // STRICT: Modal state MUST start as false - NEVER auto-opens
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');

    // Define token once at the top
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch User
      let userId = currentUser?.id;
      if (!userId) {
        const userRes = await fetch(`${API_BASE_URL}/users/me`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData);
          userId = userData.id;
        }
      }

      // 2. Fetch Conversation Details
      const convData = await getConversationDetail(conversationId);
      if (!convData) throw new Error("Failed to fetch conversation details");
      setConversation(convData);

      // 3. Fetch Messages from API_BASE_URL (reuse token variable)
      const msgRes = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!msgRes.ok) throw new Error('Failed to fetch messages');
      const msgData = await msgRes.json();
      setMessages(msgData);

      // STRICT: NO auto-trigger logic here - modal state is NEVER changed in loadData

    } catch (err: any) {
      console.error("Load Data Error:", err);
      setError(err.message || 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (!error) fetchMessagesSilent();
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const fetchMessagesSilent = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const msgRes = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (msgRes.ok) {
        const data = await msgRes.json();
        if (data.length > 0) setMessages(data);
      }
    } catch (err) {
      console.error("Silent fetch failed", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !conversation || !currentUser) return;

    try {
      const receiverId = conversation.other_user.id;
      const itemId = conversation.item.id;

      const newMessage = await sendMessage(itemId, receiverId, message);
      if (newMessage) {
        setMessages([...messages, newMessage]);
        setMessage('');
      }
    } catch (error) {
      console.error("Failed to send", error);
    }
  };

  // STRICT: The ONLY function allowed to open the modal - triggered by button click only
  const handleVerifyClick = () => {
    setIsVerifyModalOpen(true);
  };

  const otherUser = conversation?.other_user;
  
  // Determine if current user is the finder or claimer
  // is_finder = True means current user is the finder (item owner)
  // isClaimer = !isFinder means current user is NOT the owner (the claimer)
  const isFinder = conversation?.is_finder ?? false;
  const isClaimer = conversation && currentUser ? !isFinder : false;

  if (loading && !conversation) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#003898] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-white flex flex-col items-center justify-center p-6">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded">Retry</button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="w-10 h-10 border border-slate-200 rounded-full flex items-center justify-center text-[#003898] hover:bg-slate-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              {otherUser?.name || 'Chat'}
            </h1>
            <p className="text-xs text-slate-500">Re: {conversation?.item.title}</p>
          </div>
        </div>
        <button
          onClick={() => setShowHandoverModal(true)}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
        >
          Hand over verification
        </button>
      </header>

      {/* Gray Action Bar - Identity Verification (Only for Claimers) */}
      {conversation && isClaimer && currentUser && conversation.item.owner_id !== currentUser.id && (
        <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              ⚠️ Action Required: Verify your identity to claim this item.
            </span>
            <button
              onClick={handleVerifyClick}
              className="px-4 py-2 bg-[#003898] text-white text-sm font-medium rounded-lg hover:bg-[#002d7a] transition-colors"
            >
              Verify Now
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
        {messages.length > 0 && (
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 bg-[#F1F5F9] rounded-full text-xs font-medium text-slate-500">
              {getDateLabel(messages[0].created_at)}
            </span>
          </div>
        )}

        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#003898]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.023c.09-.443-.057-.89-.346-1.217C3.125 15.116 2.25 13.626 2.25 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Start a Conversation</h3>
              <p className="text-sm text-slate-500 max-w-[240px]">
                Send a message to coordinate the item handover.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = currentUser && msg.sender_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                {!isMine && conversation && (
                  <div className="w-8 h-8 bg-[#E8ECF4] rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                    {otherUser?.avatar_url ? (
                      <img src={otherUser.avatar_url} alt={otherUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-slate-600">
                        {otherUser?.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${isMine
                    ? 'bg-[#003898] text-white rounded-br-none'
                    : 'bg-[#F1F5F9] text-slate-800 rounded-bl-none'
                    }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-slate-400'} text-right`}>
                    {formatMessageTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-slate-100 safe-area-bottom bg-white sticky bottom-0">
        <div className="flex items-center gap-3 max-w-lg mx-auto w-full">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 h-12 pl-4 pr-4 bg-[#F1F5F9] rounded-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898]/20 transition-all border-transparent focus:border-[#003898]"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-12 h-12 bg-[#003898] rounded-full flex items-center justify-center shrink-0 transition-all hover:bg-[#1E40AF] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
          >
            <svg className="w-5 h-5 text-white transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Verify Identity Modal - STRICT: Only renders when isVerifyModalOpen is true */}
      {conversation && (
        <VerifyIdentityModal
          isOpen={isVerifyModalOpen}
          conversationId={conversationId}
          itemId={conversation.item.id}
          itemTitle={conversation.item.title}
          isFinder={isFinder}
          onClose={() => setIsVerifyModalOpen(false)}
          onSuccess={() => {
            setIsVerifyModalOpen(false);
            loadData(); // Reload messages to show the new verification message
          }}
        />
      )}

      {/* Handover Modal */}
      {conversation && (
        <HandoverModal
          isOpen={showHandoverModal}
          conversationId={conversationId}
          isFinder={isFinder}
          onClose={() => setShowHandoverModal(false)}
          onSuccess={() => {
            setShowHandoverModal(false);
            loadData(); // Reload messages to show the verification message
          }}
        />
      )}
    </div>
  );
}
