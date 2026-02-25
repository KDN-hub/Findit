'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';
import { CAMPUS_LOCATIONS } from '@/lib/constants';

const categories = [
  'Electronics',
  'ID Cards',
  'ATM Card',
  'Books',
  'Clothing',
  'Accessories',
  'Keys',
  'Documents',
  'Other',
];

type ReportType = 'found' | 'lost';

export default function ReportItemPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reportType, setReportType] = useState<ReportType>('found');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [campusStatus, setCampusStatus] = useState<'on_campus' | 'off_campus'>('on_campus');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [offCampusLocation, setOffCampusLocation] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    startTransition(async () => {
      try {
        const form = e.currentTarget;
        const formData = new FormData(form);

        const token = localStorage.getItem('access_token');
        if (!token) {
          setSubmitError('You must be logged in to report an item.');
          return;
        }

        const body = new FormData();
        body.append('title', formData.get('title') as string);
        body.append('description', formData.get('description') as string);
        body.append('status', reportType === 'found' ? 'Found' : 'Lost');
        body.append('category', formData.get('category') as string);

        let finalLocation = '';
        if (campusStatus === 'off_campus') {
          finalLocation = `Off Campus - ${offCampusLocation.trim()}`;
        } else {
          finalLocation = selectedLocation === 'Other' ? customLocation : selectedLocation;
        }
        if (!finalLocation.trim()) {
          setSubmitError('Please provide a location.');
          return;
        }
        body.append('location', finalLocation);

        const keywords = formData.get('keywords') as string;
        if (keywords) body.append('keywords', keywords);

        const dateFound = formData.get('date_found') as string;
        if (dateFound) body.append('date_found', dateFound);

        const contactPref = formData.get('contact_preference') as string;
        if (contactPref) body.append('contact_preference', contactPref);

        // Attach the image file if selected
        const imageFile = formData.get('photo') as File;
        const hasImage = imageFile && imageFile.size > 0;

        if (reportType === 'found' && !hasImage) {
          setSubmitError('A photo is required when reporting a found item.');
          return;
        }

        if (hasImage) {
          body.append('image', imageFile);
        }

        const res = await fetch(`${API_BASE_URL}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: body,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.detail || `Server error: ${res.status}`);
        }

        setShowSuccess(true);

        // Redirect after showing success
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setSubmitError(message);
      }
    });
  };

  const handleTabChange = (type: ReportType) => {
    setReportType(type);
    setImagePreview(null); // Reset image when switching tabs
  };

  return (
    <div className="min-h-dvh bg-white pb-8">
      {/* Header */}
      <header className="px-4 pt-24 mt-4 pb-4 safe-area-top">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-10 h-10 bg-[#F1F5F9] rounded-full flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-[#003898]">Report an Item</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex bg-[#F1F5F9] rounded-xl p-1">
          <button
            type="button"
            onClick={() => handleTabChange('found')}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${reportType === 'found'
              ? 'bg-[#003898] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
              }`}
          >
            Found Item
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('lost')}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${reportType === 'lost'
              ? 'bg-[#003898] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
              }`}
          >
            Lost Item
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 mb-4">
        <p className="text-sm text-slate-500">
          {reportType === 'found'
            ? 'Found something? Fill in the details below to help the owner find it.'
            : 'Lost something? Fill in the details below so finders can match your item.'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 space-y-5">
        {/* Item Name */}
        <div>
          <label className="block text-sm font-medium text-[#003898] mb-2">
            Item name
          </label>
          <input
            type="text"
            name="title"
            placeholder={reportType === 'found' ? "e.g., iPhone 14 Pro" : "e.g., My iPhone 14 Pro"}
            className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
            required
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-[#003898] mb-2">
            Photo
            {reportType === 'found'
              ? <span className="text-red-500 font-normal"> *</span>
              : <span className="text-slate-400 font-normal"> (optional)</span>
            }
          </label>
          <div className="relative">
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className={`flex flex-col items-center justify-center w-full h-32 bg-[#F1F5F9] rounded-xl border-2 border-dashed cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden ${
                reportType === 'found' && !imagePreview ? 'border-slate-300' : 'border-slate-300'
              }`}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <span className="text-sm text-slate-500">Tap to upload photo</span>
                </>
              )}
            </label>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            {reportType === 'found'
              ? 'Required — helps the owner identify their item'
              : 'Optional — add one if you have it'}
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-[#003898] mb-2">
            Item type
          </label>
          <select
            name="category"
            className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all appearance-none cursor-pointer"
            required
            defaultValue=""
          >
            <option value="" disabled>Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Date and Time Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#003898] mb-2">
              {reportType === 'found' ? 'Date found' : 'Date lost'}
            </label>
            <input
              type="date"
              name="date_found"
              className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#003898] mb-2">
              Time <span className="text-slate-400 font-normal">(approx)</span>
            </label>
            <input
              type="time"
              name="time_found"
              className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-[#003898] mb-2">
            {reportType === 'found' ? 'Where was it found?' : 'Where did you lose it?'}
          </label>

          {/* On/Off Campus Toggle */}
          <div className="flex bg-[#F1F5F9] rounded-xl p-1 mb-3">
            <button
              type="button"
              onClick={() => {
                setCampusStatus('on_campus');
                setOffCampusLocation('');
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                campusStatus === 'on_campus'
                  ? 'bg-white text-[#003898] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              On Campus
            </button>
            <button
              type="button"
              onClick={() => {
                setCampusStatus('off_campus');
                setSelectedLocation('');
                setCustomLocation('');
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                campusStatus === 'off_campus'
                  ? 'bg-white text-[#003898] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Off Campus
            </button>
          </div>

          {campusStatus === 'on_campus' ? (
            <>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  if (e.target.value !== 'Other') setCustomLocation('');
                }}
                className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Select a location on campus...</option>
                {Object.entries(CAMPUS_LOCATIONS).map(([group, locations]) =>
                  group === 'Other' ? (
                    <option key="Other" value="Other">Other (on campus)</option>
                  ) : (
                    <optgroup key={group} label={group}>
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </optgroup>
                  )
                )}
              </select>
              {selectedLocation === 'Other' && (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Specify the on-campus location..."
                  className="w-full h-14 px-4 mt-3 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
                  required
                />
              )}
            </>
          ) : (
            <input
              type="text"
              value={offCampusLocation}
              onChange={(e) => setOffCampusLocation(e.target.value)}
              placeholder="Enter the off-campus location (e.g., Ilishan Market, specific street...)"
              className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
              required
            />
          )}
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-[#003898] mb-2">
            Keywords
          </label>
          <input
            type="text"
            name="keywords"
            placeholder="e.g., black, phone, case"
            className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#003898] mb-2">
            Description
          </label>
          <textarea
            name="description"
            placeholder={
              reportType === 'found'
                ? "Describe the item in detail to help the owner identify it..."
                : "Describe your item in detail to help finders match it..."
            }
            rows={4}
            className="w-full px-4 py-3 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all resize-none"
            required
          />
        </div>

        {/* Contact Preference - Only for Lost Items */}
        {reportType === 'lost' && (
          <div>
            <label className="block text-sm font-medium text-[#003898] mb-2">
              Preferred contact method
            </label>
            <select
              name="contact_preference"
              className="w-full h-14 px-4 bg-[#F1F5F9] rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all appearance-none cursor-pointer"
              defaultValue="in_app"
            >
              <option value="in_app">In-app messages only</option>
              <option value="email">Email notification</option>
            </select>
          </div>
        )}


        {/* Error Message */}
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-14 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
        >
          {isPending ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            `Report ${reportType === 'found' ? 'Found' : 'Lost'} Item`
          )}
        </button>
      </form>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#003898] mb-2">
              {reportType === 'found' ? 'Item Reported!' : 'Lost Item Posted!'}
            </h2>
            <p className="text-slate-500 text-sm">
              {reportType === 'found'
                ? 'Your found item has been added successfully. The owner will be able to find and claim it.'
                : 'Your lost item has been posted. We\'ll notify you if someone finds a match!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
