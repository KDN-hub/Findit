"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface IdentityVerificationCardProps {
    claimId: number;
    onSuccess: () => void;
    isReadOnly?: boolean;
    initialData?: any;
}

export default function IdentityVerificationCard({
    claimId,
    onSuccess,
    isReadOnly = false,
    initialData,
}: IdentityVerificationCardProps) {
    const [formData, setFormData] = useState({
        full_name: initialData?.full_name || "",
        place_found: initialData?.place_found || "",
        date_of_loss: initialData?.date_of_loss || "",
        location_of_loss: initialData?.location_of_loss || "",
        unlock_description: initialData?.unlock_description || "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(isReadOnly || !!initialData);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await apiFetch("/api/claims/submit-identity", {
                method: "POST",
                body: JSON.stringify({
                    claim_id: claimId,
                    ...formData,
                }),
            });
            setSubmitted(true);
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to submit identity verification");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 my-2">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-purple-800">Identity Verification</h3>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Submitted ✓</span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium">Name:</span> {formData.full_name}</p>
                    <p><span className="font-medium">Found Where?</span> {formData.place_found}</p>
                    <p><span className="font-medium">Date Lost:</span> {formData.date_of_loss}</p>
                    <p><span className="font-medium">Location Lost:</span> {formData.location_of_loss}</p>
                    <p><span className="font-medium">Description:</span> {formData.unlock_description}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm my-2">
            <h3 className="font-semibold text-gray-800 mb-1">Identity Verification Required</h3>
            <p className="text-sm text-gray-500 mb-4">Please fill in the details below to verify ownership.</p>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700">Full Name</label>
                    <input
                        type="text"
                        required
                        className="w-full mt-1 p-2 border rounded-md text-sm"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700">Where was the item found? (Guess)</label>
                    <input
                        type="text"
                        className="w-full mt-1 p-2 border rounded-md text-sm"
                        value={formData.place_found}
                        onChange={(e) => setFormData({ ...formData, place_found: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700">Date you lost it</label>
                    <input
                        type="date"
                        className="w-full mt-1 p-2 border rounded-md text-sm"
                        value={formData.date_of_loss}
                        onChange={(e) => setFormData({ ...formData, date_of_loss: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700">Location where you lost it</label>
                    <input
                        type="text"
                        className="w-full mt-1 p-2 border rounded-md text-sm"
                        value={formData.location_of_loss}
                        onChange={(e) => setFormData({ ...formData, location_of_loss: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700">Unique Identifier / Unlock Description</label>
                    <textarea
                        className="w-full mt-1 p-2 border rounded-md text-sm"
                        rows={2}
                        value={formData.unlock_description}
                        onChange={(e) => setFormData({ ...formData, unlock_description: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Submitting..." : "Submit Verification"}
                </button>
            </form>
        </div>
    );
}
