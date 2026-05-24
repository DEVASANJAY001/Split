import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { Search, ChevronRight, HelpCircle, Shield, CreditCard, Users, Zap, LifeBuoy } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FAQ = [
  { q: "How do I add a friend?", a: "Go to the Friends tab, search for their @username, and send a request.", icon: Users, category: "getting-started" },
  { q: "Can I use multiple currencies?", a: "Yes, you can set a default currency in Settings or change it per group.", icon: CreditCard, category: "payments" },
  { q: "Is my data secure?", a: "Absolutely. We use Firebase's secure infrastructure and industry-standard encryption.", icon: Shield, category: "getting-started" },
  { q: "What is Personal Mode?", a: "It allows you to track your own private spending alongside shared group expenses.", icon: Zap, category: "getting-started" },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFAQ = useMemo(() => {
    return FAQ.filter((item) => {
      const matchesSearch = item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.a.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div>
      <PageHeader title="Help Center" subtitle="Find answers & tutorials" showBack />
      
      <div className="px-5 pb-12 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
          <input 
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExpandedIndex(null);
            }}
            className="w-full bg-surface-soft rounded-full py-4 pl-12 pr-5 text-sm font-bold outline-none border border-transparent focus:border-brand transition-all shadow-soft text-ink"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => {
              setSelectedCategory(selectedCategory === "getting-started" ? null : "getting-started");
              setExpandedIndex(null);
            }}
            className="w-full text-left outline-none"
          >
            <SurfaceCard 
              padding="sm" 
              className={cn(
                "flex flex-col items-center text-center gap-1.5 h-full justify-center transition-all border",
                selectedCategory === "getting-started" ? "bg-brand/10 border-brand/30 text-brand" : "border-hairline/40 hover:bg-surface-soft"
              )}
            >
              <HelpCircle className={cn("size-5", selectedCategory === "getting-started" ? "text-brand" : "text-ink-soft")} />
              <p className="text-[9px] font-black uppercase tracking-wider text-ink">Getting Started</p>
            </SurfaceCard>
          </button>
          
          <button 
            onClick={() => {
              setSelectedCategory(selectedCategory === "payments" ? null : "payments");
              setExpandedIndex(null);
            }}
            className="w-full text-left outline-none"
          >
            <SurfaceCard 
              padding="sm" 
              className={cn(
                "flex flex-col items-center text-center gap-1.5 h-full justify-center transition-all border",
                selectedCategory === "payments" ? "bg-brand/10 border-brand/30 text-brand" : "border-hairline/40 hover:bg-surface-soft"
              )}
            >
              <CreditCard className={cn("size-5", selectedCategory === "payments" ? "text-brand" : "text-ink-soft")} />
              <p className="text-[9px] font-black uppercase tracking-wider text-ink">Payments</p>
            </SurfaceCard>
          </button>

          <button 
            onClick={() => toast.info("Support tickets are coming soon! Please contact us via email.")}
            className="w-full text-left outline-none relative overflow-hidden group"
          >
            <SurfaceCard 
              padding="sm" 
              className="flex flex-col items-center text-center gap-1.5 h-full justify-center border border-hairline/40 hover:bg-surface-soft"
            >
              <LifeBuoy className="size-5 text-ink-soft group-hover:rotate-45 transition-transform" />
              <p className="text-[9px] font-black uppercase tracking-wider text-ink">Tickets</p>
              <span className="absolute top-1 right-1 text-[6px] font-black text-brand bg-brand/10 px-1 py-0.5 rounded-md uppercase tracking-widest scale-90">Soon</span>
            </SurfaceCard>
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-ink-soft uppercase tracking-widest ml-1">
            {selectedCategory ? `${selectedCategory.replace("-", " ")} FAQs` : "Frequently Asked Questions"}
          </h3>
          
          {filteredFAQ.length > 0 ? (
            <div className="space-y-2">
              {filteredFAQ.map((item, i) => {
                const isExpanded = expandedIndex === i;
                return (
                  <SurfaceCard 
                    key={i} 
                    padding="md" 
                    className="group cursor-pointer transition-all duration-300"
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "size-8 rounded-lg bg-surface-soft flex items-center justify-center text-ink-soft transition-colors",
                            isExpanded ? "bg-brand/10 text-brand" : "group-hover:bg-brand/10 group-hover:text-brand"
                          )}>
                            <item.icon className="size-4" />
                          </div>
                          <p className="text-sm font-bold text-ink">{item.q}</p>
                        </div>
                        <ChevronRight className={cn(
                          "size-4 text-ink-soft transition-all duration-300",
                          isExpanded ? "rotate-90 text-brand" : "group-hover:translate-x-1"
                        )} />
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-3 pl-11 text-xs text-ink-soft leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                          {item.a}
                        </div>
                      )}
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-ink-soft">
              No matching help articles found.
            </div>
          )}
        </div>

        <div className="bg-brand rounded-[2rem] p-6 text-white shadow-brand/40 shadow-xl overflow-hidden relative">
          <div className="relative z-10">
            <h4 className="text-lg font-black tracking-tightest">Still need help?</h4>
            <p className="text-xs font-medium opacity-80 mt-1 mb-4">Our support team is available 24/7 to assist you.</p>
            <a 
              href="mailto:davnsindustries@hotmail.com?subject=Split%20App%20Support%20Request"
              className="inline-block bg-white text-brand px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all text-center"
            >
              Contact Us
            </a>
          </div>
          <HelpCircle className="absolute -right-8 -bottom-8 size-40 text-white/10" />
        </div>
      </div>
    </div>
  );
}
