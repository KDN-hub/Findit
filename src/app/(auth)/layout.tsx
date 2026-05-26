import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex bg-white">
      {/* Left Panel - Hidden on mobile, 50% width on desktop */}
      <div className="hidden lg:flex flex-col w-1/2 bg-[#0a0f1c] text-white p-10 relative overflow-hidden">
        {/* Abstract background graphics matching the landing page style */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 mb-8">
          <Image src="/favicon.svg" alt="Findit" width={32} height={32} />
          <span className="text-2xl font-bold tracking-tight text-white">Findit</span>
        </div>

        {/* Hero Image & Quote */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center w-full">
          <div className="w-full max-w-[440px] aspect-[4/5] relative rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10 mb-10">
            <Image
              src="/auth-hero.png"
              alt="Student finding lost item"
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Tagline/Quote */}
          <div className="w-full max-w-[440px]">
            <p className="text-[#10B981] font-medium text-[22px] italic leading-tight">
              Never lose it — let the campus community help you find your items safely.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-dvh overflow-y-auto bg-white">
        <div className="flex-1 flex flex-col justify-center w-full py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
