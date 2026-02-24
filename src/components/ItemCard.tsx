import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/config';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    location: string;
    category: string;
    photo_url?: string | null;
    image_url?: string | null;
    status?: string;
    created_at: Date;
  };
}

export function ItemCard({ item }: ItemCardProps) {
  const imageUrl = item.image_url
    ? `${API_BASE_URL}${item.image_url}`
    : item.photo_url || null;

  const isRecovered = item.status === 'Recovered';
  const { Icon: CategoryIcon, bg: catBg, color: catColor } = getCategoryIcon(item.category);

  return (
    <Link
      href={`/items/${item.id}`}
      className={`flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.99] border ${
        isRecovered
          ? 'bg-emerald-50/50 border-emerald-200'
          : 'bg-white border-slate-100 hover:border-slate-200'
      }`}
    >
      {/* Image */}
      <div className={`relative w-20 h-20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${imageUrl ? 'bg-[#F1F5F9]' : catBg}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className={`w-full h-full object-cover ${isRecovered ? 'opacity-70' : ''}`}
          />
        ) : (
          <CategoryIcon className={`w-8 h-8 ${catColor}`} strokeWidth={1.5} />
        )}
        {isRecovered && (
          <div className="absolute inset-0 bg-emerald-900/30 flex items-center justify-center rounded-xl">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{item.location}</p>
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className={`text-base font-semibold truncate ${isRecovered ? 'text-emerald-700' : 'text-[#003898]'}`}>
            {item.title}
          </h3>
          {isRecovered && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full shrink-0 uppercase tracking-wide">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Recovered
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">{item.category}</p>
      </div>

      {/* Right Side */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-xs text-slate-400">{formatRelativeTime(item.created_at)}</span>
        <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}
