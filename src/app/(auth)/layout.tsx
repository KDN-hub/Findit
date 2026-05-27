import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex bg-[#f8f9ff]">
      {/* Left Panel - Form Container */}
      <div className="w-full lg:w-[45%] flex flex-col min-h-dvh overflow-y-auto bg-white relative px-8 md:px-16 lg:px-24">
        {/* Logo at top left */}
        <div className="pt-12 pb-8 auth-layout-logo">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-full bg-[#003898] flex items-center justify-center shadow-sm">
              <svg width="13" height="19" viewBox="0 0 96 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="translate-y-[-0.5px]">
                <path fillRule="evenodd" clipRule="evenodd" d="M36.2547 0.613763C12.8768 5.84511 -3.04936 28.7341 0.492814 52.0114C1.4985 58.6218 3.26935 63.1821 9.11803 74.2227C13.7248 82.9195 19.3498 93.6563 35.9347 125.411C39.3815 132.011 42.7876 138.004 43.5034 138.731C45.0884 140.338 46.7941 140.42 48.4701 138.971C49.1566 138.377 52.1842 133.139 55.1975 127.331C58.2112 121.523 64.0579 110.238 68.1904 102.252C72.3228 94.2663 75.9263 87.7323 76.198 87.7323C76.4702 87.7323 79.2313 90.245 82.3351 93.316L87.9783 98.8991L90.2488 98.6428C92.069 98.4374 92.8309 98.0457 94.0929 96.6663C95.4483 95.1841 95.6663 94.6014 95.6663 92.4563V89.9666L88.9586 83.1893C85.2693 79.4612 82.2508 76.1791 82.2508 75.8954C82.2508 75.6117 83.8559 72.057 85.8179 67.9963C90.9258 57.4237 91.5928 54.78 91.5521 45.2537C91.5228 38.3496 91.3896 37.1482 90.2359 33.3559C88.8038 28.6506 86.3794 23.5498 83.6858 19.5746C77.9094 11.0515 68.5751 4.34132 58.2945 1.32126C53.5919 -0.0596548 41.0633 -0.461881 36.2547 0.613763ZM55.8884 14.2971C64.9189 17.359 71.4781 23.0343 75.5795 31.3342C86.2093 52.8466 70.2688 78.1326 46.0768 78.1326C33.4265 78.1326 22.1349 71.3884 16.7174 60.5964C14.0458 55.2743 13.0402 51.1023 13.0761 45.4937C13.1379 35.9358 16.3557 28.4058 23.1435 21.9356C27.7196 17.5735 32.5914 14.9725 38.8899 13.5282C43.1417 12.5534 51.9159 12.9503 55.8884 14.2971Z" fill="white"/>
              </svg>
            </div>
            <span className="text-[#003898] font-bold text-xl tracking-tight">Findit</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center w-full pb-12 z-10 max-w-md mx-auto lg:mx-0">
          {children}
        </div>
      </div>

      {/* Right Panel - Soft Background with White Card */}
      <div className="hidden lg:flex flex-col w-[55%] bg-[#EEF2FF] relative overflow-hidden items-center justify-center p-12">
        <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-[40px] shadow-sm border border-white flex flex-col items-center justify-center p-16 aspect-[4/3] max-h-[80vh]">
          {/* Circular Logo Avatar */}
          <div className="w-32 h-32 rounded-full bg-[#EEF2FF] flex items-center justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#003898] flex items-center justify-center shadow-xl shadow-[#003898]/20">
              <svg width="32" height="47" viewBox="0 0 96 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="translate-y-[-1px]">
                <path fillRule="evenodd" clipRule="evenodd" d="M36.2547 0.613763C12.8768 5.84511 -3.04936 28.7341 0.492814 52.0114C1.4985 58.6218 3.26935 63.1821 9.11803 74.2227C13.7248 82.9195 19.3498 93.6563 35.9347 125.411C39.3815 132.011 42.7876 138.004 43.5034 138.731C45.0884 140.338 46.7941 140.42 48.4701 138.971C49.1566 138.377 52.1842 133.139 55.1975 127.331C58.2112 121.523 64.0579 110.238 68.1904 102.252C72.3228 94.2663 75.9263 87.7323 76.198 87.7323C76.4702 87.7323 79.2313 90.245 82.3351 93.316L87.9783 98.8991L90.2488 98.6428C92.069 98.4374 92.8309 98.0457 94.0929 96.6663C95.4483 95.1841 95.6663 94.6014 95.6663 92.4563V89.9666L88.9586 83.1893C85.2693 79.4612 82.2508 76.1791 82.2508 75.8954C82.2508 75.6117 83.8559 72.057 85.8179 67.9963C90.9258 57.4237 91.5928 54.78 91.5521 45.2537C91.5228 38.3496 91.3896 37.1482 90.2359 33.3559C88.8038 28.6506 86.3794 23.5498 83.6858 19.5746C77.9094 11.0515 68.5751 4.34132 58.2945 1.32126C53.5919 -0.0596548 41.0633 -0.461881 36.2547 0.613763ZM55.8884 14.2971C64.9189 17.359 71.4781 23.0343 75.5795 31.3342C86.2093 52.8466 70.2688 78.1326 46.0768 78.1326C33.4265 78.1326 22.1349 71.3884 16.7174 60.5964C14.0458 55.2743 13.0402 51.1023 13.0761 45.4937C13.1379 35.9358 16.3557 28.4058 23.1435 21.9356C27.7196 17.5735 32.5914 14.9725 38.8899 13.5282C43.1417 12.5534 51.9159 12.9503 55.8884 14.2971Z" fill="white"/>
              </svg>
            </div>
          </div>
          <h2 className="text-[#1e293b] font-extrabold text-[40px] mb-4 tracking-tight">Findit</h2>
          <p className="text-[#64748b] text-xl text-center leading-relaxed max-w-md">
            The smart, effortless way to manage your lost items and help others on campus.
          </p>
        </div>
      </div>
    </div>
  );
}
