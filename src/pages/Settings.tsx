import { useNavigate, Link } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { useStore } from "@/lib/store";
import { ArrowLeft, Bell, Download, Moon, Sun, ShieldCheck, LogOut, FileText, Lock, Info, LifeBuoy, HelpCircle, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ALL_CURRENCIES } from "@/lib/currency-data";

export default function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile, expenses, personal, settlements } = useStore();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

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
    a.download = "smartsplit-export.csv";
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
            <div className="relative">
              <select
                value={profile.currency}
                onChange={(e) => {
                  updateProfile({ currency: e.target.value });
                }}
                className="w-full bg-surface-soft border border-hairline rounded-2xl py-4 px-4 text-sm font-bold text-ink outline-none focus:border-brand appearance-none"
              >
                {ALL_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-soft">
                <ArrowLeft className="size-4 -rotate-90" />
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard padding="md">
            <Row
              icon={dark ? Moon : Sun}
              title="Appearance"
              subtitle={dark ? "Dark mode" : "Light mode"}
              trailing={
                <Toggle on={dark} onChange={setDark} />
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

        <section className="space-y-3 pt-4">
          <SurfaceCard padding="md">
            <button
              onClick={() => {
                if (confirm("Reset local cache? This will NOT delete your Firebase data.")) {
                  location.reload();
                }
              }}
              className="w-full"
            >
              <Row icon={LogOut} title="Reset app" subtitle="Clear all local data" trailing={<span className="text-destructive font-bold text-[10px] uppercase tracking-wider">Reset</span>} />
            </button>
          </SurfaceCard>
          
          <div className="text-center py-4">
            <img src="/davns_logo.png" alt="DAVNS" className="size-8 mx-auto grayscale opacity-20 mb-2" />
            <p className="text-[10px] font-bold text-ink-soft uppercase tracking-widest">Version 2.4.0 (Build 89)</p>
            <p className="text-[9px] text-ink-soft/60 mt-1">SmartSplit by DAVNS Industries</p>
          </div>
        </section>
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
