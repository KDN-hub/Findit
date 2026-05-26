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
        <div className="pt-12 pb-8">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-full bg-[#003898] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M12 0C6.48 0 2 4.48 2 10C2 15.52 12 24 12 24C12 24 22 15.52 22 10C22 4.48 17.52 0 12 0ZM12 13.5C10.07 13.5 8.5 11.93 8.5 10C8.5 8.07 10.07 6.5 12 6.5C13.93 6.5 15.5 8.07 15.5 10C15.5 11.93 13.93 13.5 12 13.5Z" fill="white"/>
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
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M12 0C6.48 0 2 4.48 2 10C2 15.52 12 24 12 24C12 24 22 15.52 22 10C22 4.48 17.52 0 12 0ZM12 13.5C10.07 13.5 8.5 11.93 8.5 10C8.5 8.07 10.07 6.5 12 6.5C13.93 6.5 15.5 8.07 15.5 10C15.5 11.93 13.93 13.5 12 13.5Z" fill="white"/>
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
