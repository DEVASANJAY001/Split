import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";

export default function AboutDAVNS() {
  return (
    <div>
      <PageHeader title="About" subtitle="DAVNS Industries" showBack />
      
      <div className="px-5 space-y-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-full flex justify-center mb-8">
            <img src="/davnslogo-b.png" alt="DAVNS Industries" className="h-16 object-contain dark:hidden" />
            <img src="/davnslogo-w.png" alt="DAVNS Industries" className="h-16 object-contain hidden dark:block" />
          </div>
          <p className="text-xs font-bold text-brand uppercase tracking-widest mt-1">A product by DAVNS</p>
        </div>

        <SurfaceCard padding="lg" className="space-y-6">
          <p className="text-sm text-ink leading-relaxed font-medium text-center">
            DAVNS Industries is an AI-driven startup developing advanced platforms and intelligent products through research and innovation.
          </p>
          
          <div className="pt-6 border-t border-hairline text-center">
            <p className="text-[10px] text-ink-soft uppercase font-bold tracking-wider mb-2">Our Mission</p>
            <p className="text-sm font-semibold text-ink">Building intelligent platforms that solve real user problems.</p>
          </div>
        </SurfaceCard>

        <div className="text-center pb-8">
          <p className="text-[10px] text-ink-soft font-medium">© 2026 DAVNS Industries. All rights reserved.</p>
          <p className="text-[10px] text-ink-soft mt-1">Building Intelligent Platforms</p>
        </div>
      </div>
    </div>
  );
}
