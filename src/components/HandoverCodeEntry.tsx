"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface HandoverCodeEntryProps {
    claimId: number;
    onSuccess: () => void;
}

export default function HandoverCodeEntry({ claimId, onSuccess }: HandoverCodeEntryProps) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await apiFetch("/api/claims/confirm-handover", {
                method: "POST",
                body: JSON.stringify({
                    claim_id: claimId,
                    code: code,
                }),
            });
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Invalid code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border-t border-gray-200 p-4 shadow-up-lg fixed bottom-0 left-0 right-0 z-50">
            <div className="max-w-md mx-auto">
                <h3 className="text-center font-bold text-gray-800 mb-2">Enter Hand-Over Code</h3>

                {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}

                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        required
                        placeholder="#0000"
                        className="w-full text-center text-2xl font-mono font-bold tracking-widest p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                        maxLength={5}
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                    />
                    <button
                        type="submit"
                        disabled={loading || code.length < 4}
                        className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300 transition-colors"
                    >
                        {loading ? "Verifying..." : "Confirm"}
                    </button>
                </form>
                <p className="text-xs text-center text-gray-500 mt-2">
                    Ask the finder for the code to confirm you have received the item.
                </p>
            </div>
        </div>
    );
}
