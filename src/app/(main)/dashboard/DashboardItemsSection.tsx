'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { formatTimeAgo } from '@/services/items';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { ItemImage } from '@/components/ItemImage';
import { getDashboardItems, type ApiItem } from './dashboardItemsResource';

export function DashboardItemsSection() {
  const data = getDashboardItems();
  const { todaysItems, previousItems } = data;

  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (todaysItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % todaysItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [todaysItems.length]);

  useEffect(() => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: currentSlide * slideWidth,
        behavior: 'smooth',
      });
    }
  }, [currentSlide]);

  return (
    <>
      {/* Today's Items Carousel */}
      <section className="px-4 mb-6">
        <div className="relative">
          <div
            ref={carouselRef}
            className="flex overflow-x-hidden rounded-2xl bg-[#F1F5F9]"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {todaysItems.length > 0 ? (
              todaysItems.map((item: ApiItem) => {
                const isCompleted = item.status === 'Completed' || item.status === 'Returned';
                return (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  prefetch={true}
                  className="w-full flex-shrink-0 h-64 flex flex-col items-center justify-center relative"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {item.image_url ? (
                    <div className="w-full h-full" style={isCompleted ? { filter: 'grayscale(60%)' } : undefined}>
                      <ItemImage
                        src={item.image_url}
                        alt={item.title}
                        className={`w-full h-full object-cover ${isCompleted ? 'opacity-70' : ''}`}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    (() => {
                      const { Icon, bg, color } = getCategoryIcon(item.category);
                      return (
                        <div className={`w-full h-full flex flex-col items-center justify-center gap-3 ${bg} ${isCompleted ? 'opacity-60' : ''}`}>
                          <Icon className={`w-16 h-16 ${color}`} strokeWidth={1.2} />
                          <p className="text-sm font-semibold text-slate-500">{item.title}</p>
                          <p className="text-[11px] text-slate-400">{item.location}</p>
                        </div>
                      );
                    })()
                  )}
                  {isCompleted && (
                    <div className="absolute top-3 right-3 bg-slate-700/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                      ✅ Handed Over
                    </div>
                  )}
                </Link>
              );})
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-slate-400">
                <p>No items reported today</p>
              </div>
            )}
          </div>

          {todaysItems.length > 1 && (
            <>
              <button
                onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : todaysItems.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-[#003898] hover:bg-white hover:scale-110 active:scale-95 transition-all z-10"
                aria-label="Previous item"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev < todaysItems.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-[#003898] hover:bg-white hover:scale-110 active:scale-95 transition-all z-10"
                aria-label="Next item"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {todaysItems.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {todaysItems.map((_: ApiItem, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'bg-[#003898] w-6' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Previously Section */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#003898]">Previously</h2>
          <Link href="/items" prefetch={true} className="text-sm text-[#003898] font-medium underline">
            See more
          </Link>
        </div>

        <div className="space-y-3">
          {previousItems.length > 0 ? (
            previousItems.map((item: ApiItem) => {
              const isCompleted = item.status === 'Completed' || item.status === 'Returned';
              return (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                prefetch={true}
                className={`flex items-center gap-4 p-3 rounded-2xl transition-colors ${
                  isCompleted ? 'bg-slate-50/60 hover:bg-slate-100/80' : 'bg-[#F8FAFC] hover:bg-slate-100'
                }`}
              >
                {(() => {
                  const { Icon, bg, color } = getCategoryIcon(item.category);
                  return (
                    <div
                      className={`relative w-24 h-24 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${item.image_url ? 'bg-[#E8ECF4]' : bg}`}
                    >
                      {item.image_url ? (
                        <div className="w-full h-full" style={isCompleted ? { filter: 'grayscale(60%)' } : undefined}>
                          <ItemImage
                            src={item.image_url}
                            alt={item.title}
                            className={`w-full h-full object-cover rounded-xl ${isCompleted ? 'opacity-60' : ''}`}
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <Icon className={`w-9 h-9 ${color} ${isCompleted ? 'opacity-50' : ''}`} strokeWidth={1.5} />
                      )}
                      {isCompleted && (
                        <div className="absolute top-0 right-0 bg-slate-700/75 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-xl leading-tight tracking-wide">
                          ✅ Handed Over
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-500">{item.location}</p>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg font-semibold truncate ${isCompleted ? 'text-slate-500' : 'text-[#003898]'}`}>{item.title}</h3>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full shrink-0 uppercase tracking-wide">
                        ✅ Handed Over
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{item.keywords || item.category}</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-[#003898]">
                    {item.created_at ? formatTimeAgo(item.created_at) : ''}
                  </span>
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );})
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">No previous items yet</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
