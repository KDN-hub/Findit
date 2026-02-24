'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { VerificationRequestCard } from '@/components/VerificationRequestCard';
import { FinderVerificationModal } from '@/components/FinderVerificationModal';
import { HandoverModal } from '@/components/HandoverModal';

// Mock data - Finder's perspective
const getConversation = (id: string) => {
  return {
    id,
    claimer: {
      id: 'user789',
      name: 'Raph Willy',
      avatar: null,
    },
    item: {
      id: 'item123',
      title: 'iPhone 14 Pro',
      location: 'Library Building',
      photo_url: null,
    },
    claim_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    verification_status: 'Pending', // Pending, Verified, Rejected
    messages: [
      {
        id: '1',
        sender_id: 'me',
        content: 'Hi, I found an item that might be yours. Can you verify ownership?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        is_mine: true,
      },
      {
        id: '2',
        sender_id: 'user789',
        content: 'Yes! I lost my phone at the library yesterday. Thank you so much for finding it!',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        is_mine: false,
      },
      {
        id: '3',
        sender_id: 'me',
        content: 'Great, please verify your identity so I can confirm it\'s yours.',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        is_mine: true,
      },
      {
        id: 'verification-card',
        sender_id: 'user789',
        type: 'verification_request',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        is_mine: false,
      },
    ],
  };
};

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function FinderConversationPage() {
  const params = useParams();
  const id = params.id as string;
  const conversation = getConversation(id);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(conversation.messages);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isHandedOver, setIsHandedOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      sender_id: 'me',
      content: message,
      timestamp: new Date(),
      is_mine: true,
    };

    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVerify = () => {
    setShowVerificationModal(false);
    setIsVerified(true);
    // Add system message
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        sender_id: 'system',
        content: '✓ Identity verified! You can now arrange handover with the claimer.',
        timestamp: new Date(),
        is_mine: false,
      },
    ]);
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Header */}
      <header className="px-4 pt-14 pb-4 safe-area-top border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          {/* Back Button */}
          <Link
            href="/messages"
            className="w-11 h-11 border-2 border-slate-200 rounded-full flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-[#003898]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          {/* User Name */}
          <h1 className="text-lg font-semibold text-slate-800">{conversation.claimer.name}</h1>

          {/* Phone Button */}
          <button className="w-11 h-11 border-2 border-slate-200 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </button>
        </div>

        {/* Hand Over Verification Button */}
        {isHandedOver ? (
          <div className="w-full h-12 bg-green-100 text-green-700 font-medium rounded-full flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Handover Complete
          </div>
        ) : isVerified ? (
          <button
            onClick={() => setShowHandoverModal(true)}
            className="w-full h-12 bg-[#003898] text-white font-medium rounded-full hover:bg-[#1E40AF] transition-all"
          >
            Hand over verification
          </button>
        ) : (
          <button
            disabled
            className="w-full h-12 bg-[#E8ECF4] text-slate-400 font-medium rounded-full cursor-not-allowed"
          >
            Hand over verification
          </button>
        )}
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Date Separator */}
        <div className="flex justify-center mb-6">
          <span className="px-4 py-1.5 bg-[#F1F5F9] rounded-full text-sm text-slate-600">
            Today
          </span>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((msg: any) => {
            // Verification Request Card
            if (msg.type === 'verification_request') {
              return (
                <div key={msg.id} className="flex items-end gap-2 justify-start">
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-[#E8ECF4] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-slate-600">
                      {conversation.claimer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>

                  {/* Verification Card */}
                  <div className="max-w-[280px]">
                    <VerificationRequestCard
                      claimerName={conversation.claimer.name}
                      itemName={conversation.item.title}
                      location={conversation.item.location}
                      date={formatDate(conversation.claim_date)}
                      imageUrl={conversation.item.photo_url}
                      onClick={() => setShowVerificationModal(true)}
                    />
                  </div>
                </div>
              );
            }

            // Regular Message
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for received messages */}
                {!msg.is_mine && (
                  <div className="w-8 h-8 bg-[#E8ECF4] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-slate-600">
                      {conversation.claimer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                    msg.is_mine
                      ? 'bg-[#E8ECF4] rounded-br-md'
                      : 'bg-[#F1F5F9] rounded-bl-md'
                  }`}
                >
                  <p className="text-sm text-slate-800 leading-relaxed">{msg.content}</p>
                  <p className={`text-xs text-slate-400 mt-1 ${msg.is_mine ? 'text-right' : 'text-left'}`}>
                    {formatMessageTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-slate-100 safe-area-bottom bg-white">
        <div className="flex items-center gap-3">
          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message"
              className="w-full h-12 pl-4 pr-12 bg-[#F1F5F9] rounded-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
            />
            {/* Attachment Button */}
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            </button>
          </div>

          {/* Voice/Send Button */}
          <button
            onClick={handleSend}
            className="w-12 h-12 bg-[#003898] rounded-full flex items-center justify-center shrink-0 transition-all hover:bg-[#1E40AF] active:scale-95"
          >
            {message.trim() ? (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <FinderVerificationModal
          conversationId={Number(conversation.id)}
          claimerName={conversation.claimer.name}
          itemName={conversation.item.title}
          location={conversation.item.location}
          date={formatDate(conversation.claim_date)}
          imageUrl={conversation.item.photo_url}
          onClose={() => setShowVerificationModal(false)}
          onVerify={handleVerify}
        />
      )}

      {/* Handover Modal */}
      {showHandoverModal && (
        <HandoverModal
          isOpen={showHandoverModal}
          conversationId={Number(conversation.id)}
          isFinder={true}
          onClose={() => setShowHandoverModal(false)}
          onSuccess={() => {
            setShowHandoverModal(false);
            setIsHandedOver(true);
            setMessages([
              ...messages,
              {
                id: Date.now().toString(),
                sender_id: 'system',
                content: '🎉 Handover complete! The item has been returned to its owner. Thank you for using Findit!',
                timestamp: new Date(),
                is_mine: false,
              },
            ]);
          }}
        />
      )}
    </div>
  );
}
