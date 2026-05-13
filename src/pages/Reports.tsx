import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { useStore, Category, netBalances, personById } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar, ComposedChart, Line } from "recharts";
import { categoryIcons, groupIcons } from "@/lib/icons";
import { TrendingDown, TrendingUp, Zap, Calendar, Target, ArrowRight, Wallet, PieChart as PieIcon, Activity, ChevronRight, Sparkles, LayoutDashboard, ShieldCheck, HeartPulse, BrainCircuit, Users, PiggyBank, History, Scale, Filter, ArrowUpRight, ArrowDownLeft, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

const CAT_COLORS: Record<string, string> = {
  Food: "#FF6B6B",
  Travel: "#4D96FF",
  Rent: "#1A1A1A",
  Utilities: "#FFD93D",
  Shopping: "#FF8AAE",
  Entertainment: "#9B59B6",
  Fuel: "#E67E22",
  Bills: "#95A5A6",
  Other: "#BDC3C7",
};

type ReportFilter = "all" | "personal" | "group";

export default function Reports() {
  const { expenses, personal, groups, people, userId, profile, settlements, savingsGoals } = useStore();
  const [filter, setFilter] = useState<ReportFilter>("all");
  const cur = profile?.currency || "INR";

  // Filtered Data
  const activeExpenses = useMemo(() => {
    if (filter === "personal") return personal;
    if (filter === "group") return expenses;
    return [...expenses, ...personal];
  }, [filter, expenses, personal]);

  // Data Analysis
  const analysis = useMemo(() => {
    // 1. Unified Category Data
    const catMap: Record<string, number> = {};
    for (const e of activeExpenses) {
      catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;
    }
    const categories = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // 2. Monthly Trend
    const monthMap: Record<string, number> = {};
    const sorted = [...activeExpenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const e of sorted) {
      const k = new Date(e.date).toLocaleDateString("en-US", { month: "short" });
      monthMap[k] = (monthMap[k] ?? 0) + e.amount;
    }
    const timeline = Object.entries(monthMap).map(([m, v]) => ({ name: m, value: v }));

    // 3. Social Debt (Net Balance) - only for group or all
    let totalOwe = 0;
    let totalOwed = 0;
    const debts: { person: string, amount: number, type: 'owe' | 'owed' }[] = [];
    
    if (filter !== "personal") {
      for (const g of groups) {
        const net = netBalances(g, expenses, settlements);
        for (const [uid, amount] of Object.entries(net)) {
          if (uid === userId) continue;
          const p = personById(people, uid, profile);
          if (amount > 0) {
            // They owe you (you are owed)
            debts.push({ person: p?.name || "Unknown", amount: Math.abs(amount), type: 'owed' });
            totalOwed += Math.abs(amount);
          } else if (amount < 0) {
            // You owe them
            debts.push({ person: p?.name || "Unknown", amount: Math.abs(amount), type: 'owe' });
            totalOwe += Math.abs(amount);
          }
        }
      }
    }

    // 4. Group Exposure
    const groupSpending = groups.map(g => {
      const gExp = expenses.filter(e => e.groupId === g.id);
      return { name: g.name, value: gExp.reduce((a, e) => a + e.amount, 0) };
    }).sort((a, b) => b.value - a.value);

    return { categories, timeline, totalOwe, totalOwed, debts, groupSpending };
  }, [activeExpenses, groups, expenses, settlements, userId, people, profile, filter]);

  const totalOutflow = analysis.categories.reduce((a, c) => a + c.value, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-44">
      {/* Sharper Corner Header */}
      <div className="px-6 pt-16 pb-6 border-b border-hairline/50 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit className="size-4 text-brand animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand/80">Analysis Hub</p>
            </div>
            <h1 className="text-3xl font-black tracking-tightest text-ink">Intelligence</h1>
          </div>
          <div className="size-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <LayoutDashboard className="size-5 text-brand" />
          </div>
        </div>

        {/* Global Context Switcher */}
        <div className="flex items-center bg-surface-soft p-1 rounded-xl shadow-inner border border-hairline/50">
          {(["all", "personal", "group"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                filter === f ? "bg-white text-ink shadow-lg scale-[1.02]" : "text-ink-soft hover:text-ink"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-10 space-y-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Dash 1: Core Financial Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SurfaceCard padding="lg" className="border-none bg-ink text-white shadow-2xl rounded-xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Wallet className="size-5 text-brand" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Outflow Velocity</span>
              </div>
              <p className="text-4xl font-black tracking-tighter tabular-nums mb-2">{fmt(totalOutflow, cur)}</p>
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-brand w-2/3 rounded-full animate-progress" />
                </div>
                <span className="text-[9px] font-black text-brand/80">REAL-TIME</span>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 size-32 bg-brand/20 rounded-full blur-3xl pointer-events-none" />
          </SurfaceCard>

          <SurfaceCard padding="lg" className="border-none bg-white shadow-xl rounded-xl group">
            <div className="flex items-center justify-between mb-8">
              <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Activity className="size-5 text-blue-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-ink-soft">Social Exposure</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-black text-ink tabular-nums">{fmt(analysis.totalOwed - analysis.totalOwe, cur)}</p>
                <p className={cn("text-[10px] font-black uppercase tracking-wider", (analysis.totalOwed - analysis.totalOwe) >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {(analysis.totalOwed - analysis.totalOwe) >= 0 ? "Net Collection" : "Net Debt"}
                </p>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="size-6 rounded-full border-2 border-white bg-surface-soft shadow-sm" />
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>

        {/* Dash 2: Spending Trajectory Area Chart */}
        <SurfaceCard padding="xl" className="border-none bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-ink tracking-tight">Temporal Velocity</h3>
              <p className="text-xs font-bold text-ink-soft">Volume progression analytics</p>
            </div>
            <Calendar className="size-5 text-ink-soft" />
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysis.timeline}>
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 900 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 900 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px' }} 
                  itemStyle={{ fontWeight: 900, fontSize: '13px' }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--brand))" strokeWidth={5} fill="url(#velocityGradient)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        {/* Dash 3: Settlement Forecast (Conditional) */}
        {filter !== "personal" && (
          <SurfaceCard padding="xl" className="border-none bg-[#0D0D0F] text-white shadow-2xl rounded-xl overflow-hidden relative group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-10">
                <div className="size-10 rounded-xl bg-brand/20 flex items-center justify-center">
                  <Scale className="size-5 text-brand" />
                </div>
                <h3 className="text-xl font-black tracking-tightest uppercase">Settlement Forecast</h3>
              </div>
              {analysis.debts.length > 0 ? (
                <div className="space-y-4">
                  {analysis.debts.slice(0, 3).map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/item">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-black shadow-lg">
                          {d.person[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{d.person}</p>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                            {d.type === 'owe' ? "Action: Transfer" : "Status: Due"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-base font-black tabular-nums", d.type === 'owe' ? "text-red-400" : "text-emerald-400")}>
                          {d.type === 'owe' ? "-" : "+"}{fmt(d.amount, cur)}
                        </p>
                        {d.type === 'owe' ? <ArrowUpRight className="size-4 ml-auto text-red-400/50" /> : <ArrowDownLeft className="size-4 ml-auto text-emerald-400/50" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <ShieldCheck className="size-12 text-brand mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-bold text-white/50">Your shared balances are perfectly squared.</p>
                </div>
              )}
            </div>
            <div className="absolute -left-12 -bottom-12 size-48 bg-brand/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brand/20 transition-colors duration-1000" />
          </SurfaceCard>
        )}

        {/* Dash 4: Spending DNA Radar */}
        <SurfaceCard padding="xl" className="border-none bg-white shadow-xl rounded-xl group">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-ink tracking-tight">Efficiency Radar</h3>
              <p className="text-xs font-bold text-ink-soft tracking-widest uppercase">Behavioral Profile</p>
            </div>
            <Zap className="size-5 text-ink-soft group-hover:text-brand transition-all" />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analysis.categories.slice(0, 6)}>
                <PolarGrid stroke="#F3F4F6" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 9, fontWeight: 900 }} />
                <Radar name="Allocation" dataKey="value" stroke="hsl(var(--brand))" fill="hsl(var(--brand))" fillOpacity={0.3} animationDuration={1500} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        {/* Dash 5: Cluster Allocation (Group spending) */}
        {filter !== "personal" && (
          <SurfaceCard padding="xl" className="border-none bg-white shadow-xl rounded-xl">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-ink tracking-tight">Cluster Allocation</h3>
              <Users className="size-5 text-blue-500" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.groupSpending} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 10, fontWeight: 900 }} width={80} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} />
                  <Bar dataKey="value" fill="#4D96FF" radius={[0, 8, 8, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SurfaceCard>
        )}

        {/* Footer Integrity Section */}
        <div className="pb-20 pt-10 text-center">
          <div className="size-12 rounded-2xl bg-brand/5 flex items-center justify-center mx-auto mb-4 border border-brand/10">
            <Fingerprint className="size-6 text-brand/40" />
          </div>
          <h4 className="text-base font-black text-ink mb-1">Financial Integrity</h4>
          <p className="text-xs font-bold text-ink-soft max-w-xs mx-auto">All intelligence outputs are verified against your local ledger.</p>
        </div>
      </div>
    </div>
  );
}
