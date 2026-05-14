import { useState, useMemo, useRef, useEffect } from "react";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { useStore } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { getFilteredData, TimeRange } from "@/lib/reports-engine";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import { 
  TrendingUp, Wallet, PieChart as PieIcon, Calendar, 
  ArrowUpRight, ArrowDownRight, ShoppingBag, Target, 
  Repeat, Sparkles, AlertCircle, Download, Check, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandIcon } from "@/components/BrandIcon";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", 
  "#8b5cf6", "#f43f5e", "#06b6d4", "#fb923c", "#a855f7"
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Reports() {
  const { personal, expenses, userId, profile, savingsGoals, recurringTemplates } = useStore();
  const [range, setRange] = useState<TimeRange>("this-month");
  const [context, setContext] = useState<"all" | "personal" | "group">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [tempSalary, setTempSalary] = useState(profile?.salary?.toString() || "");
  const pulseScrollRef = useRef<HTMLDivElement>(null);

  const handleSalarySubmit = async () => {
    const val = parseFloat(tempSalary);
    if (isNaN(val)) {
        toast.error("Please enter a valid amount");
        return;
    }
    await useStore.getState().updateProfile({ salary: val });
    setIsEditingSalary(false);
    toast.success("Income source updated!");
  };

  const data = useMemo(() => {
    if (!userId) return null;
    return getFilteredData(
      personal, expenses, userId, range, context, 
      savingsGoals, recurringTemplates, 
      customStart, customEnd, selectedDate
    );
  }, [personal, expenses, userId, range, context, savingsGoals, recurringTemplates, customStart, customEnd, selectedDate]);

  const budget = profile?.budget || 0;
  const budgetProgress = budget > 0 ? Math.min((data?.totalSpend || 0) / budget * 100, 100) : 0;
  
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedSpend = (data?.dailyAverage || 0) * daysInMonth;
  const isProjectedOver = budget > 0 && projectedSpend > budget;

  // Heatmap Data (last 14 days) - Always calculated from full store data for consistency
  const heatmapData = useMemo(() => {
    const dates = [];
    const allBaseExpenses = [
      ...personal.map(e => ({ ...e, isGroup: false })),
      ...expenses.map(e => ({ ...e, amount: e.shares[userId] || 0, isGroup: true }))
    ];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysToToday = today.getDate();

    for (let i = 1; i <= daysToToday; i++) {
      const d = new Date(currentYear, currentMonth, i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTotal = allBaseExpenses
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0) || 0;
      dates.push({ date: dateStr, amount: dayTotal, day: d.getDate() });
    }
    return dates;
  }, [personal, expenses, userId]);

  // Auto-scroll pulse to recent data
  useEffect(() => {
    if (pulseScrollRef.current) {
      pulseScrollRef.current.scrollTo({
        left: pulseScrollRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [heatmapData]);

  const filteredMerchants = useMemo(() => {
    if (!data) return [];
    if (!selectedCategory) return data.merchantData;
    
    const byMerchant = data.allExpenses
      .filter(e => e.category === selectedCategory)
      .reduce((acc, e) => {
        const desc = e.description;
        acc[desc] = (acc[desc] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(byMerchant)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data, selectedCategory]);

  const handleExport = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
      loading: 'Generating PDF report...',
      success: 'Report downloaded successfully!',
      error: 'Failed to generate report.',
    });
  };

  if (!data) return null;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen pb-32"
    >
      <PageHeader 
        title="Financial Reports" 
        subtitle="Insights & Spending Trends" 
        showActions={true}
        customActions={
          <button 
            onClick={handleExport}
            className="size-10 bg-brand/10 text-brand rounded-full flex items-center justify-center hover:bg-brand hover:text-white transition-all active:scale-95"
          >
            <Download className="size-5" />
          </button>
        }
      />

      <div className="px-5 space-y-6">
        {/* Filters Header */}
        <div className="space-y-4">
          <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
            {[
              { id: "this-month", label: "This Month" },
              { id: "last-month", label: "Last Month" },
              { id: "this-quarter", label: "This Quarter" },
              { id: "all-time", label: "All Time" },
              { id: "custom", label: "Custom Range" }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => { setRange(r.id as TimeRange); setSelectedCategory(null); }}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all",
                  range === r.id ? "bg-brand text-white shadow-brand" : "bg-surface text-ink-soft border border-hairline/50"
                )}
              >
                {r.label}
              </button>
            ))}
          </motion.div>

          <AnimatePresence>
            {range === "custom" && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 p-3 bg-surface-soft/50 rounded-2xl border border-hairline/50">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-black uppercase text-ink-soft ml-1">Start</label>
                    <input 
                      type="date" 
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full bg-white dark:bg-surface rounded-xl px-3 py-2 text-xs border border-hairline outline-none focus:border-brand transition-all"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-black uppercase text-ink-soft ml-1">End</label>
                    <input 
                      type="date" 
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full bg-white dark:bg-surface rounded-xl px-3 py-2 text-xs border border-hairline outline-none focus:border-brand transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Income & Expense Pulse */}
        <motion.div variants={itemVariants}>
          <SurfaceCard padding="lg" className="relative overflow-hidden group border-brand/10">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-ink-soft">Monthly Salary</h3>
                  <div className="flex items-center gap-2">
                    {isEditingSalary ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input 
                          type="number"
                          value={tempSalary}
                          onChange={(e) => setTempSalary(e.target.value)}
                          className="w-24 bg-white dark:bg-surface border border-brand/20 rounded-lg px-2 py-1 text-sm font-bold outline-none"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSalarySubmit()}
                        />
                        <button onClick={handleSalarySubmit} className="size-8 bg-brand text-white rounded-lg flex items-center justify-center active:scale-90 transition-all">
                          <Check className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/salary cursor-pointer" onClick={() => setIsEditingSalary(true)}>
                        <span className="text-2xl font-black text-ink">{fmt(profile?.salary || 0, profile?.currency || "USD")}</span>
                        <div className="size-6 rounded-full bg-brand/10 text-brand flex items-center justify-center opacity-0 group-hover/salary:opacity-100 transition-all">
                          <Plus className="size-3" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-ink-soft">Remaining Balance</span>
                  <p className={cn(
                    "text-sm font-black",
                    ((profile?.salary || 0) - data.totalSpend) < 0 ? "text-red-500" : "text-brand"
                  )}>
                    {fmt((profile?.salary || 0) - data.totalSpend, profile?.currency || "USD")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase text-ink-soft px-1">
                  <span>Budget Used</span>
                  <span>{profile?.salary ? Math.round(Math.min((data.totalSpend / profile.salary) * 100, 100)) : 0}%</span>
                </div>
                <div className="h-2.5 bg-surface-soft rounded-full overflow-hidden border border-hairline/30 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${profile?.salary ? Math.min((data.totalSpend / profile.salary) * 100, 100) : 0}%` }}
                    className={cn(
                      "h-full rounded-full transition-colors relative",
                      profile?.salary && (data.totalSpend / profile.salary) > 0.9 ? "bg-gradient-to-r from-red-500 to-rose-600" : "bg-gradient-to-r from-brand to-indigo-600"
                    )}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-shimmer opacity-20" />
                  </motion.div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <TrendingUp className="size-24" />
            </div>
          </SurfaceCard>
        </motion.div>

        {/* Hero Summary */}
        <motion.div variants={itemVariants}>
          <SurfaceCard variant="glass" padding="lg" className="relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-brand mb-1">
                <Wallet className="size-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Total Spending</span>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-black tracking-tightest text-ink">
                  {fmt(data.totalSpend, profile?.currency || "USD")}
                </h2>
                {range === "this-month" && (
                  <div className={cn(
                    "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    data.spendingChange > 0 ? "text-red-500 bg-red-500/10" : "text-success bg-success/10"
                  )}>
                    {data.spendingChange > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {Math.abs(Math.round(data.spendingChange))}%
                  </div>
                )}
              </div>
              <p className="text-xs text-ink-soft mt-1 font-medium">
                {data.count} transactions identified
              </p>

              {budget > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tightest">
                    <span className="text-ink-soft">Budget Progress</span>
                    <span className={cn(budgetProgress > 90 ? "text-red-500" : "text-brand")}>
                      {Math.round(budgetProgress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${budgetProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn("h-full", budgetProgress > 90 ? "bg-red-500" : "bg-brand")}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="absolute -right-8 -bottom-8 size-40 bg-brand/5 rounded-full blur-3xl group-hover:bg-brand/10 transition-colors" />
          </SurfaceCard>
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-ink-soft">
              Daily Activity 
              <span className="ml-2 text-brand/60">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </h3>
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-[9px] font-black uppercase text-brand hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          
          <div className="relative">
            <div 
              ref={pulseScrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-8 py-4 snap-x"
              style={{ 
                maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
              }}
            >
              {heatmapData.map((d, i) => {
                const opacity = d.amount === 0 ? 0.05 : Math.min(d.amount / (data.totalSpend / 10 + 1), 1);
                const isSelected = selectedDate === d.date;
                return (
                  <button 
                    key={i} 
                    onClick={() => setSelectedDate(isSelected ? null : d.date)}
                    className="flex flex-col items-center gap-1.5 group outline-none shrink-0 snap-center"
                  >
                    <div 
                      className={cn(
                        "size-8 rounded-full transition-all duration-300",
                        isSelected ? "ring-2 ring-brand ring-offset-2 scale-110" : "group-hover:scale-105 shadow-soft"
                      )}
                      style={{ 
                        backgroundColor: d.amount > 0 ? '#6366f1' : 'currentColor',
                        opacity: isSelected ? 1 : opacity
                      }}
                    />
                    <span className={cn(
                      "text-[8px] font-bold transition-colors",
                      isSelected ? "text-brand" : "text-ink-soft/40"
                    )}>{d.day}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Forecast & Savings Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <SurfaceCard padding="md" className="bg-emerald-500/5 border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-500 mb-3">
              <Target className="size-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Savings</span>
            </div>
            <p className="text-lg font-black text-ink">{Math.round(data.savingsProgress)}%</p>
            <div className="h-1.5 bg-emerald-500/10 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${data.savingsProgress}%` }} />
            </div>
            <p className="text-[9px] font-bold text-ink-soft mt-2 uppercase tracking-tighter">{fmt(data.savingsTotal, profile?.currency || "USD")} Saved</p>
          </SurfaceCard>

          <SurfaceCard padding="md" className="bg-amber-500/5 border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-500 mb-3">
              <Repeat className="size-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Forecast</span>
            </div>
            <p className="text-lg font-black text-ink">{fmt(data.recurringForecast, profile?.currency || "USD")}</p>
            <p className="text-[9px] font-bold text-ink-soft mt-1.5 uppercase tracking-widest">Upcoming Bills</p>
          </SurfaceCard>
        </motion.div>

        {/* Context Toggles */}
        <motion.div variants={itemVariants} className="flex bg-surface-soft/50 p-1 rounded-2xl border border-hairline/50">
          {[
            { id: "all", label: "Overview" },
            { id: "personal", label: "Personal" },
            { id: "group", label: "Shared" }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => { setContext(c.id as any); setSelectedCategory(null); }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                context === c.id ? "bg-white dark:bg-brand text-brand dark:text-white shadow-sm" : "text-ink-soft hover:text-ink"
              )}
            >
              {c.label}
            </button>
          ))}
        </motion.div>

        {/* Main Intelligence Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Spending Trends - Area Chart */}
          <motion.div variants={itemVariants}>
            <SurfaceCard padding="md" className="h-full rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-tight text-ink">Trends</h3>
                  <p className="text-[8px] text-ink-soft uppercase tracking-widest font-bold">Spending Velocity</p>
                </div>
                <TrendingUp className="size-4 text-brand" />
              </div>

              <div className="h-[180px] w-full pr-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyTrends}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      formatter={(value: number) => [fmt(value, profile?.currency || "USD"), "Spent"]}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SurfaceCard>
          </motion.div>

          {/* Categories Chart */}
          <motion.div variants={itemVariants}>
            <SurfaceCard padding="md" className="h-full rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-tight text-ink">Categories</h3>
                  <p className="text-[8px] text-ink-soft uppercase tracking-widest font-bold truncate max-w-[60px]">
                    {selectedCategory || "Breakdown"}
                  </p>
                </div>
                {selectedCategory ? (
                  <button onClick={() => setSelectedCategory(null)} className="text-[8px] font-black uppercase text-brand">Clear</button>
                ) : (
                  <PieIcon className="size-4 text-ink-soft/40" />
                )}
              </div>

              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                      onClick={(entry) => setSelectedCategory(entry.name === selectedCategory ? null : entry.name)}
                      className="cursor-pointer"
                    >
                      {data.categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke={selectedCategory === entry.name ? "#fff" : "transparent"}
                          strokeWidth={2}
                          opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} formatter={(value: number) => fmt(value, profile?.currency || "USD")} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </SurfaceCard>
          </motion.div>
        </div>

        {/* Wallet Share & Merchants */}
        <motion.div variants={itemVariants}>
          <SurfaceCard padding="lg">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-ink">Top Merchants</h3>
                <p className="text-[10px] text-ink-soft uppercase tracking-widest font-bold mt-0.5">Vendor Breakdown</p>
              </div>
              <ShoppingBag className="size-5 text-ink-soft/40" />
            </div>
            
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredMerchants.map((m, idx) => (
                  <motion.div 
                    key={m.name} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <BrandIcon description={m.name} size="sm" className="rounded-xl p-1 bg-white" />
                      <div>
                        <p className="text-xs font-bold text-ink truncate max-w-[120px]">{m.name}</p>
                        <div className="w-24 h-1 bg-black/5 dark:bg-white/5 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-brand/30" style={{ width: `${(m.value / data.totalSpend) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-ink">{fmt(m.value, profile?.currency || "USD")}</p>
                      <p className="text-[9px] font-bold text-ink-soft uppercase tracking-tightest">{Math.round((m.value / data.totalSpend) * 100)}% share</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SurfaceCard>
        </motion.div>

        {/* Strategic Advisory */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-ink-soft">Strategic Advisory</h3>
            <Sparkles className="size-3 text-brand" />
          </div>
          
          <AnimatePresence>
            {isProjectedOver && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <SurfaceCard padding="md" className="bg-red-500/5 border-red-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-5 text-red-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-ink">Budget Overrun Forecast</h4>
                      <p className="text-[11px] text-ink-soft mt-1 leading-relaxed">
                        At your current burn rate, you will exceed your budget by **{fmt(projectedSpend - budget, profile?.currency || "USD")}** this month.
                      </p>
                    </div>
                  </div>
                </SurfaceCard>
              </motion.div>
            )}
          </AnimatePresence>

          <SurfaceCard padding="md" className="border-l-4 border-l-brand">
            <div className="flex items-start gap-4">
              <div className="size-10 bg-brand/5 rounded-xl flex items-center justify-center shrink-0"><TrendingUp className="size-5 text-brand" /></div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-ink">Spending Trajectory</h4>
                <p className="text-[11px] text-ink-soft mt-1 leading-relaxed">
                  {data.spendingChange > 0 
                    ? `Velocity is up **${Math.abs(Math.round(data.spendingChange))}%** MoM. Use drill-downs to investigate.`
                    : `Spending is down **${Math.abs(Math.round(data.spendingChange))}%**. Your efficiency is improving.`}
                </p>
              </div>
            </div>
          </SurfaceCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
