import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";

export default function AboutDAVNS() {
  return (
    <div>
      <PageHeader title="About" subtitle="DAVNS Industries" showBack />
      
      <div className="px-5 space-y-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="size-32 rounded-3xl bg-white shadow-card flex items-center justify-center overflow-hidden mb-6 border border-hairline">
            <img src="/davns_logo.png" alt="DAVNS Industries" className="size-full object-contain p-4" />
          </div>
          <h1 className="text-2xl font-black tracking-tightest text-ink">DAVNS Industries</h1>
          <p className="text-xs font-bold text-brand uppercase tracking-widest mt-1">Parent Company</p>
        </div>

        <SurfaceCard padding="lg" className="space-y-4">
          <p className="text-sm text-ink leading-relaxed">
            DAVNS Industries is a global technology conglomerate dedicated to building tools that simplify human interaction and financial management.
          </p>
          <p className="text-sm text-ink leading-relaxed">
            SmartSplit is a product of our FinTech division, designed to bring transparency and ease to shared expenses.
          </p>
          <div className="pt-4 border-t border-hairline">
            <p className="text-[10px] text-ink-soft uppercase font-bold tracking-wider">Vision</p>
            <p className="text-sm font-semibold text-ink mt-1">To eliminate financial friction in social circles.</p>
          </div>
        </SurfaceCard>

        <div className="text-center pb-8">
          <p className="text-[10px] text-ink-soft font-medium">© 2026 DAVNS Industries. All rights reserved.</p>
          <p className="text-[10px] text-ink-soft mt-1">Build 2.4.0-premium</p>
        </div>
      </div>
    </div>
  );
}
