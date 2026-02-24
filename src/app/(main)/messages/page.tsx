"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Loader2, MessageSquareOff } from "lucide-react";

interface Conversation {
  id: number;
  item_id: number;
  item_title: string;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar?: string;
  last_message?: string;
  last_message_time?: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchConversations = async () => {
    try {
      const data = await apiFetch("/conversations");
      setConversations(data);
      setError("");
    } catch (err: any) {
      console.error("Fetch conversations error:", err);
      if (conversations.length === 0) {
        setError("Failed to load conversations. Check your connection.");
      }
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const formatDate = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#003898]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 flex items-start justify-center pt-6 px-4">
      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-[#003898]">My Messages</h1>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {conversations.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <MessageSquareOff size={48} className="mb-3" />
              <p className="text-base font-medium text-slate-600">No messages found.</p>
              <p className="text-sm text-slate-500 mt-1">Start a claim to chat!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {conversations.map((conv) => (
                <Link
                  href={`/messages/${conv.id}`}
                  key={conv.id}
                  className="block px-4 py-4 border-b border-slate-100 hover:bg-[#003898]/10 transition-colors last:border-b-0"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                      {conv.other_user_avatar ? (
                        <img
                          src={conv.other_user_avatar}
                          alt={conv.other_user_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-bold text-[#003898]">
                          {conv.other_user_name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-800 truncate pr-2">
                          {conv.item_title}
                        </h3>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {formatDate(conv.last_message_time || conv.created_at)}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-slate-500 mb-1">
                        {conv.other_user_name}
                      </p>

                      <p className="text-sm text-slate-400 truncate">
                        {conv.last_message || "Start the conversation..."}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
