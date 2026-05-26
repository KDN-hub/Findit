import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex bg-white">
      {/* Left Panel - Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-dvh overflow-y-auto bg-white relative">
        <div className="flex-1 flex flex-col justify-center w-full py-8 z-10">
          {children}
        </div>
      </div>

      {/* Right Panel - Graphic (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col w-1/2 bg-[#F8FAFC] relative overflow-hidden border-l border-slate-100 items-center justify-center">
        {/* Full bleed vector graphic */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/auth-hero.png"
            alt="Findit lost and found concept"
            fill
            className="object-cover object-center mix-blend-multiply opacity-95"
            priority
          />
        </div>
        
        {/* Modern Tagline Overlay */}
        <div className="absolute bottom-12 left-0 right-0 text-center z-10 px-8">
          <div className="inline-block bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl shadow-[#003898]/5 border border-white/50">
            <p className="text-[#003898] font-bold text-xl tracking-tight">
              Never lose it. Let the campus help you find it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
