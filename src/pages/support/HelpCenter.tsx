import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { Search, ChevronRight, HelpCircle, Shield, CreditCard, Users, Zap } from "lucide-react";

const FAQ = [
  { q: "How do I add a friend?", a: "Go to the Friends tab, search for their @username, and send a request.", icon: Users },
  { q: "Can I use multiple currencies?", a: "Yes, you can set a default currency in Settings or change it per group.", icon: CreditCard },
  { q: "Is my data secure?", a: "Absolutely. We use Firebase's secure infrastructure and industry-standard encryption.", icon: Shield },
  { q: "What is Personal Mode?", a: "It allows you to track your own private spending alongside shared group expenses.", icon: Zap },
];

export default function HelpCenter() {
  return (
    <div>
      <PageHeader title="Help Center" subtitle="Find answers & tutorials" showBack />
      
      <div className="px-5 pb-12 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
          <input 
            placeholder="Search help articles..."
            className="w-full bg-surface-soft rounded-full py-4 pl-12 pr-5 text-sm font-bold outline-none border border-transparent focus:border-brand transition-all shadow-soft"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SurfaceCard padding="md" className="flex flex-col items-center text-center gap-2 bg-brand/5 border-brand/10">
            <HelpCircle className="size-6 text-brand" />
            <p className="text-xs font-bold text-ink">Getting Started</p>
          </SurfaceCard>
          <SurfaceCard padding="md" className="flex flex-col items-center text-center gap-2">
            <CreditCard className="size-6 text-ink-soft" />
            <p className="text-xs font-bold text-ink">Payments</p>
          </SurfaceCard>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-ink-soft uppercase tracking-widest ml-1">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <SurfaceCard key={i} padding="md" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-surface-soft flex items-center justify-center text-ink-soft group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                      <item.icon className="size-4" />
                    </div>
                    <p className="text-sm font-bold text-ink">{item.q}</p>
                  </div>
                  <ChevronRight className="size-4 text-ink-soft group-hover:translate-x-1 transition-transform" />
                </div>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <div className="bg-brand rounded-[2rem] p-6 text-white shadow-brand/40 shadow-xl overflow-hidden relative">
          <div className="relative z-10">
            <h4 className="text-lg font-black tracking-tightest">Still need help?</h4>
            <p className="text-xs font-medium opacity-80 mt-1 mb-4">Our support team is available 24/7 to assist you.</p>
            <button className="bg-white text-brand px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
              Contact Us
            </button>
          </div>
          <HelpCircle className="absolute -right-8 -bottom-8 size-40 text-white/10" />
        </div>
      </div>
    </div>
  );
}
