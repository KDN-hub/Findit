"use client";

interface HandoverCodeCardProps {
    code: string;
    isReturned: boolean;
}

export default function HandoverCodeCard({ code, isReturned }: HandoverCodeCardProps) {
    if (isReturned) {
        return (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center my-4">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-xl font-bold text-green-800">Item Successfully Returned!</h3>
                <p className="text-green-700 mt-1">The claimer verified the code.</p>
            </div>
        );
    }

    return (
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 text-center my-4 shadow-sm">
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-4">
                Hand-Over Code
            </h3>

            <div className="text-5xl font-mono font-black text-gray-900 tracking-wider mb-4 select-all">
                {code}
            </div>

            <div className="bg-white/50 p-3 rounded-lg text-amber-900 text-sm leading-relaxed">
                <p className="font-medium">⚠️ Instruction:</p>
                <p>Read this code out loud to the claimer.</p>
                <p className="mt-1 font-bold">Do NOT share it digitally.</p>
            </div>

            <div className="mt-4 flex items-center justify-center space-x-2 text-amber-700/70 text-sm animate-pulse">
                <span className="block w-2 h-2 bg-amber-500 rounded-full" />
                <span>Waiting for claimer to enter code...</span>
            </div>
        </div>
    );
}
