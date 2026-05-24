import { useNavigate, Link } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { useStore } from "@/lib/store";
import { ArrowLeft, Bell, Download, Moon, Sun, ShieldCheck, LogOut, FileText, Lock, Info, LifeBuoy, HelpCircle, ChevronRight, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ALL_CURRENCIES } from "@/lib/currency-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile, expenses, personal, settlements, theme, setTheme } = useStore();
  const [notify, setNotify] = useState(true);
  const [open, setOpen] = useState(false);

  const selectedCurrency = ALL_CURRENCIES.find(c => c.code === profile?.currency) || ALL_CURRENCIES[0];

  if (!profile) return null;

  const exportCSV = () => {
    const rows = [
      ["type", "title", "amount", "category", "date"],
      ...expenses.map((e) => ["group", e.description, String(e.amount), e.category, e.date]),
      ...personal.map((e) => ["personal", e.description, String(e.amount), e.category, e.date]),
      ...settlements.map((s) => ["settlement", `From:${s.from} To:${s.to}`, String(s.amount), "Settlement", s.date]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Split-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Preferences & App settings" showActions={false} showBack />

      <div className="px-5 space-y-4 pb-12">
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-ink-soft uppercase tracking-widest ml-1">General</h3>
          <SurfaceCard padding="lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-ink">Currency</h3>
              <span className="text-[10px] uppercase tracking-widest font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">Global</span>
            </div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  className="w-full bg-surface-soft border border-hairline rounded-2xl py-4 px-4 text-sm font-bold text-ink outline-none focus:border-brand flex items-center justify-between text-left transition-all active:scale-[0.99]"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-ink">{selectedCurrency.code} ({selectedCurrency.symbol})</span>
                    <span className="text-[10px] text-ink-soft font-bold uppercase tracking-widest">{selectedCurrency.name}</span>
                  </div>
                  <ChevronRight className={cn("size-4 text-ink-soft transition-transform", open ? "-rotate-90" : "rotate-90")} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[--radix-popover-trigger-width] rounded-2xl shadow-2xl glass backdrop-blur-xl border-hairline overflow-hidden" align="start">
                <Command className="bg-transparent">
                  <CommandInput placeholder="Search currency..." className="h-12" />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>No currency found.</CommandEmpty>
                    <CommandGroup>
                      {ALL_CURRENCIES.map((c) => (
                        <CommandItem
                          key={c.code}
                          value={`${c.code} ${c.name} ${c.symbol}`}
                          onSelect={() => {
                            updateProfile({ currency: c.code });
                            setOpen(false);
                          }}
                          className="rounded-xl flex items-center justify-between py-3 px-3 cursor-pointer hover:bg-surface-soft data-[selected='true']:bg-surface-soft"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-ink text-sm">{c.code} ({c.symbol})</span>
                            <span className="text-[10px] text-ink-soft font-bold uppercase tracking-widest">{c.name}</span>
                          </div>
                          {profile.currency === c.code && <Check className="size-4 text-brand" strokeWidth={3} />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </SurfaceCard>

          <SurfaceCard padding="lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-brand" />
                <h3 className="text-base font-bold text-ink">Monthly Budget</h3>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">Personal</span>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Set your monthly budget"
                value={profile.budget || ""}
                onChange={(e) => {
                  updateProfile({ budget: parseFloat(e.target.value) || 0 });
                }}
                className="w-full bg-surface-soft border border-hairline rounded-2xl py-4 px-4 text-sm font-bold text-ink outline-none focus:border-brand"
              />
            </div>
            <p className="text-[10px] text-ink-soft mt-2 px-1">Track your personal spending against this limit on your dashboard.</p>
          </SurfaceCard>

          <SurfaceCard padding="lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-brand font-bold">UPI</span>
                <h3 className="text-base font-bold text-ink">UPI ID (VPA)</h3>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">Payments</span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="yourname@upi"
                value={profile.upiId || ""}
                onChange={(e) => {
                  updateProfile({ upiId: e.target.value });
                }}
                className="w-full bg-surface-soft border border-hairline rounded-2xl py-4 px-4 text-sm font-bold text-ink outline-none focus:border-brand"
              />
            </div>
            <p className="text-[10px] text-ink-soft mt-2 px-1">Used to generate payment links for your friends to settle up.</p>
          </SurfaceCard>

          <SurfaceCard padding="md">
            <Row
              icon={theme === "dark" ? Moon : Sun}
              title="Appearance"
              subtitle={theme === "dark" ? "Dark mode" : "Light mode"}
              trailing={
                <Toggle on={theme === "dark"} onChange={(v) => setTheme(v ? "dark" : "light")} />
              }
            />
          </SurfaceCard>
 
          <SurfaceCard padding="md">
            <Row
              icon={Bell}
              title="Notifications"
              subtitle="Expense, balance & settlement alerts"
              trailing={<Toggle on={notify} onChange={setNotify} />}
            />
          </SurfaceCard>
 
          <SurfaceCard padding="md">
            <button onClick={exportCSV} className="w-full">
              <Row icon={Download} title="Export data" subtitle="Download as CSV" trailing={<ChevronRight className="size-4 text-ink-soft" />} />
            </button>
          </SurfaceCard>
        </section>
 
        <section className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-ink-soft uppercase tracking-widest ml-1">Support</h3>
          <SurfaceCard padding="md">
            <Link to="/support/tickets" className="w-full">
              <Row icon={LifeBuoy} title="Support Tickets" subtitle="Get help from our team" trailing={<ChevronRight className="size-4 text-ink-soft" />} />
            </Link>
          </SurfaceCard>
          <SurfaceCard padding="md">
            <Link to="/support/help" className="w-full">
              <Row icon={HelpCircle} title="Help Center" subtitle="FAQ and tutorials" trailing={<ChevronRight className="size-4 text-ink-soft" />} />
            </Link>
          </SurfaceCard>
        </section>
 
        <section className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-ink-soft uppercase tracking-widest ml-1">Legal</h3>
          <SurfaceCard padding="md">
            <Link to="/legal/terms" className="w-full">
              <Row icon={FileText} title="Terms of Service" subtitle="Rules of the platform" trailing={<ChevronRight className="size-4 text-ink-soft" />} />
            </Link>
          </SurfaceCard>
          <SurfaceCard padding="md">
            <Link to="/legal/privacy" className="w-full">
              <Row icon={Lock} title="Privacy Policy" subtitle="How we handle your data" trailing={<ChevronRight className="size-4 text-ink-soft" />} />
            </Link>
          </SurfaceCard>
          <SurfaceCard padding="md">
            <Link to="/legal/about" className="w-full">
              <Row icon={Info} title="About DAVNS" subtitle="Corporate & Parent company" trailing={<ChevronRight className="size-4 text-ink-soft" />} />
            </Link>
          </SurfaceCard>
        </section>

        <div className="text-center py-4">
          <div className="h-10 mx-auto mb-2 flex items-center justify-center">
            <img src="/davnslogo-b.png" alt="DAVNS" className="h-full object-contain opacity-70 dark:hidden" />
            <img src="/davnslogo-w.png" alt="DAVNS" className="h-full object-contain opacity-70 hidden dark:block" />
          </div>
          <p className="text-[9px] text-ink-soft/60 mt-1">Split by DAVNS Industries</p>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, title, subtitle, trailing }: { icon: any; title: string; subtitle: string; trailing: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="size-11 rounded-2xl bg-surface-soft text-ink flex items-center justify-center shrink-0 border border-hairline/50">
          <Icon className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-ink leading-tight truncate">{title}</p>
          <p className="text-[11px] text-ink-soft leading-tight mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>
      <div className="shrink-0 flex items-center">
        {trailing}
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cn(
        "w-11 h-6 rounded-full transition-all duration-300 relative outline-none",
        on ? "bg-brand" : "bg-ink/10"
      )}
    >
      <div 
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow-md transition-all duration-300 transform",
          on ? "translate-x-5 scale-100" : "translate-x-0 scale-90"
        )} 
      />
    </button>
  );
}
