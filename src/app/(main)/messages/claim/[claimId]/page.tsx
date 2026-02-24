"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2, Send, ArrowLeft, MoreVertical, Phone } from "lucide-react";
import Link from "next/link";
import IdentityVerificationCard from "@/components/IdentityVerificationCard";
import HandoverCodeCard from "@/components/HandoverCodeCard";
import HandoverCodeEntry from "@/components/HandoverCodeEntry";

interface Message {
    id: number;
    sender_id: number;
    sender_name: string;
    message_type: string;
    content: string;
    created_at: string;
}

interface Claim {
    claim_id: number;
    item_title: string;
    other_party_name: string;
    status: string;
    claimer_id: number;
    finder_id: number;
}

interface UserProfile {
    id: number;
    full_name: string;
}

export default function ChatPage() {
    const params = useParams();
    const claimIdStr = params?.claimId as string;
    const claimId = parseInt(claimIdStr);
    const router = useRouter();

    const [messages, setMessages] = useState<Message[]>([]);
    const [claim, setClaim] = useState<Claim | null>(null);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Get Current User profile to know who we are
                const user = await apiFetch("/users/me");
                setCurrentUser(user);

                // 2. Get Claim Details (from list, since we don't have single endpoint)
                const claimsList = await apiFetch("/api/claims/list");
                const foundClaim = claimsList.find((c: any) => c.claim_id === claimId);

                if (!foundClaim) {
                    setError("Claim not found or access denied.");
                    setLoading(false);
                    return;
                }
                setClaim(foundClaim);

                // 3. Fetch Messages
                await fetchMessages();
                setLoading(false);

                // 4. Start Polling
                intervalRef.current = setInterval(() => {
                    fetchMessages();
                    // Also refresh claim status
                    refreshClaimStatus(foundClaim.claim_id);
                }, 3000);

            } catch (err: any) {
                console.error("Init Error:", err);
                setError("Failed to load conversation.");
                setLoading(false);
            }
        };

        if (claimIdStr) {
            init();
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [claimIdStr]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const fetchMessages = async () => {
        try {
            const data = await apiFetch(`/api/messages/thread?claim_id=${claimId}`);
            setMessages(data);
        } catch (err) {
            console.error("Fetch messages failed", err);
        }
    };

    const refreshClaimStatus = async (id: number) => {
        try {
            const claimsList = await apiFetch("/api/claims/list");
            const found = claimsList.find((c: any) => c.claim_id === id);
            if (found) setClaim(found);
        } catch (err) {
            console.error("Refresh claim status failed", err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || sending) return;
        setSending(true);
        try {
            await apiFetch("/api/messages/send", {
                method: "POST",
                body: JSON.stringify({ claim_id: claimId, content: newMessage }),
            });
            setNewMessage("");
            fetchMessages();
        } catch (err: any) {
            alert(err.message || "Failed to send");
        } finally {
            setSending(false);
        }
    };

    // Actions
    const handleRequestIdentity = async () => {
        if (!confirm("Ask the claimer to verify their identity?")) return;
        try {
            await apiFetch("/api/claims/request-identity", {
                method: "POST",
                body: JSON.stringify({ claim_id: claimId })
            });
            refreshClaimStatus(claimId);
            fetchMessages();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleInitiateHandover = async () => {
        if (!confirm("Are you ready to hand over the item?")) return;
        try {
            await apiFetch("/api/claims/initiate-handover", {
                method: "POST",
                body: JSON.stringify({ claim_id: claimId })
            });
            refreshClaimStatus(claimId);
            fetchMessages();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleReject = async () => {
        if (!confirm("Are you sure you want to reject this claim? This cannot be undone.")) return;
        try {
            await apiFetch("/api/claims/reject", {
                method: "POST",
                body: JSON.stringify({ claim_id: claimId })
            });
            refreshClaimStatus(claimId);
            fetchMessages();
            router.push("/messages");
        } catch (err: any) {
            alert(err.message);
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !claim || !currentUser) {
        return (
            <div className="p-4 text-center mt-10">
                <p className="text-red-500">{error || "Something went wrong"}</p>
                <Link href="/messages" className="text-blue-600 mt-4 block">Back to Messages</Link>
            </div>
        );
    }

    const isFinder = currentUser.id === claim.finder_id;
    const isClaimer = currentUser.id === claim.claimer_id;
    const isClosed = ["returned", "rejected"].includes(claim.status);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between z-10">
                <div className="flex items-center space-x-3">
                    <Link href="/messages" className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 className="font-bold text-gray-900">{claim.other_party_name}</h2>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{claim.item_title}</p>
                    </div>
                </div>
                <button className="text-gray-400 p-2">
                    <Phone size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;

                    if (msg.message_type === "system" || msg.message_type === "handover_confirm") {
                        return (
                            <div key={msg.id} className="flex justify-center my-4">
                                <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full italic text-center">
                                    {msg.content}
                                </span>
                            </div>
                        );
                    }

                    if (msg.message_type === "identity_form") {
                        // System message showing ID request
                        // If I am CLAIMER and status is identity_requested, I see the FORM.
                        // If I am anyone else, or status advanced, I see placeholder or Summary?
                        // Actually, the Form Component handles "Submitted" state.
                        if (isClaimer) {
                            return (
                                <div key={msg.id} className="max-w-md mx-auto w-full">
                                    <IdentityVerificationCard
                                        claimId={claimId}
                                        onSuccess={() => refreshClaimStatus(claimId)}
                                        isReadOnly={claim.status !== 'identity_requested'}
                                        initialData={null} // We don't have persisted incomplete form data
                                    />
                                </div>
                            );
                        } else {
                            return (
                                <div key={msg.id} className="flex justify-center my-2">
                                    <span className="bg-orange-50 text-orange-800 text-xs px-3 py-1 rounded-full border border-orange-200">
                                        Identity Verification Request Sent
                                    </span>
                                </div>
                            );
                        }
                    }

                    if (msg.message_type === "identity_response") {
                        const data = JSON.parse(msg.content);
                        return (
                            <div key={msg.id} className="max-w-md mx-auto w-full">
                                <IdentityVerificationCard
                                    claimId={claimId}
                                    onSuccess={() => { }}
                                    isReadOnly={true}
                                    initialData={data}
                                />
                            </div>
                        );
                    }

                    if (msg.message_type === "handover_init") {
                        // Only finder sees code card inside chat (replacing this message).
                        // Claimer shouldn't see this message per backend logic, but if backend fails to filter, we hide it here too.
                        if (isFinder) {
                            // Extract code from content "Code: #1234"
                            const codeMatch = msg.content.match(/Code: (#[0-9]+)/);
                            const code = codeMatch ? codeMatch[1] : "????";
                            return <HandoverCodeCard key={msg.id} code={code} isReturned={claim.status === 'returned'} />;
                        }
                        return null;
                    }

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                        ? "bg-[#6B3A4D] text-white rounded-tr-none"
                                        : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                                    }`}
                            >
                                <p>{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/70" : "text-gray-400"}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Bottom Bar */}
            <div className="bg-white border-t border-gray-200 p-3 pt-2 fixed bottom-0 w-full z-20">

                {/* Conditional Action Buttons */}
                {!isClosed && (
                    <div className="mb-3 flex gap-2 justify-center flex-wrap">
                        {isFinder && (claim.status === 'active' || claim.status === 'identity_submitted') && (
                            <button
                                onClick={handleRequestIdentity}
                                className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium border border-orange-200 hover:bg-orange-200"
                            >
                                Request Identity Verification
                            </button>
                        )}
                        {isFinder && claim.status === 'identity_submitted' && (
                            <button
                                onClick={handleInitiateHandover}
                                className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200 hover:bg-green-200"
                            >
                                Initiate Hand-Over
                            </button>
                        )}
                        {isFinder && (
                            <button
                                onClick={handleReject}
                                className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-medium border border-red-100 hover:bg-red-100"
                            >
                                Reject Claim
                            </button>
                        )}
                    </div>
                )}

                {isClaimer && claim.status === 'handover_initiated' && (
                    <div className="mb-2">
                        <HandoverCodeEntry claimId={claimId} onSuccess={() => refreshClaimStatus(claimId)} />
                        {/* Placeholder to push content up effectively */}
                        <div className="h-32"></div>
                    </div>
                )}

                {/* Input Area */}
                {/* If Handover Entry is active, input might be hidden or pushed up? Handover Entry is fixed bottom. 
            So we should hide standard input or put it behind? 
            If claimer & handover_initiated, the Code Entry replaces bottom bar? 
            Prompt: "Claimer + status `handover_initiated` -> `<HandoverCodeEntry />` card replaces bottom bar"
        */}

                {!(isClaimer && claim.status === 'handover_initiated') && (
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            placeholder={isClosed ? "This conversation is closed." : "Type a message..."}
                            disabled={isClosed || sending}
                            className="flex-1 bg-gray-100 text-gray-900 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3A4D]/50"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <button
                            disabled={!newMessage.trim() || isClosed || sending}
                            onClick={sendMessage}
                            className="bg-[#6B3A4D] text-white p-2 rounded-full hover:bg-[#5a3141] disabled:opacity-50 disabled:hover:bg-[#6B3A4D] transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
