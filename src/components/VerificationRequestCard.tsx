'use client';

interface VerificationRequestCardProps {
  claimerName: string;
  itemName: string;
  location: string;
  date: string;
  imageUrl?: string | null;
  onClick?: () => void;
}

export function VerificationRequestCard({
  claimerName,
  itemName,
  location,
  date,
  imageUrl,
  onClick,
}: VerificationRequestCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#F1F5F9] rounded-2xl overflow-hidden border border-slate-200 ${onClick ? 'cursor-pointer hover:border-slate-300 transition-colors' : ''}`}
    >
      {/* Image Area */}
      <div className="w-full h-32 bg-[#E8ECF4] flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={itemName} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        )}
      </div>

      {/* Details */}
      <div className="p-3 space-y-1">
        <p className="text-sm text-slate-700">
          <span className="text-slate-500">Claimer&apos;s name</span>
          <span className="float-right font-medium">{claimerName}</span>
        </p>
        <p className="text-sm text-slate-700">
          <span className="text-slate-500">Item name</span>
          <span className="float-right font-medium">{itemName}</span>
        </p>
        <p className="text-sm text-slate-700">
          <span className="text-slate-500">Location</span>
          <span className="float-right font-medium">{location}</span>
        </p>
        <p className="text-sm text-slate-700">
          <span className="text-slate-500">Date</span>
          <span className="float-right font-medium">{date}</span>
        </p>
      </div>
    </div>
  );
}
