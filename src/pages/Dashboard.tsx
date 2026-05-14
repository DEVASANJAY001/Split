import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { AvatarStack, PersonAvatar } from "@/components/Avatar";
import { useStore, netBalances, personById } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { groupIcons, categoryIcons } from "@/lib/icons";
import { ArrowDownLeft, ArrowUpRight, Receipt, Wallet, TrendingDown, TrendingUp, Sparkles, Target, Trophy, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { PromptModal, ConfirmModal } from "@/components/Modal";
import { Trash2, MoreVertical, Edit3, PlusCircle, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { BrandIcon } from "@/components/BrandIcon";
import { Modal } from "@/components/Modal";
import { PersonalExpense } from "@/lib/store";

export default function Dashboard() {
  const navigate = useNavigate();
  const { groups, expenses, settlements, people, mode, personal, userId, profile, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, savingsGoals, deleteExpense, addSubEntry } = useStore();
  const cur = profile?.currency || "USD";

  const [promptOpen, setPromptOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [subEntryModalOpen, setSubEntryModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<PersonalExpense | null>(null);
  const [deleteId, setDeleteId] = useState<{ id: string; isPersonal: boolean } | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<{ id: string; title: string } | null>(null);
  const [promptConfig, setPromptConfig] = useState<{ title: string; onSubmit: (val: string) => void; type?: string }>({ title: "", onSubmit: () => {} });
  const [promptValue, setPromptValue] = useState("");

  const summary = useMemo(() => {
    let owe = 0, owed = 0;
    const perGroup: Record<string, number> = {};
    for (const g of groups) {
      const net = netBalances(g, expenses, settlements);
      const v = net[userId || ""] ?? 0;
      perGroup[g.id] = v;
      if (v > 0) owed += v;
      else owe += -v;
    }
    return { owe, owed, perGroup };
  }, [groups, expenses, settlements, userId]);

  const groupExpenses = useMemo(() => expenses.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5), [expenses]);
  const groupSettlements = useMemo(() => settlements.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5), [settlements]);

  const personalStats = useMemo(() => {
    const total = personal.reduce((a, e) => a + e.amount, 0);
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = personal.filter((e) => e.date.startsWith(monthKey)).reduce((a, e) => a + e.amount, 0);
    const budget = profile?.budget || 0;
    const progress = budget > 0 ? Math.min((month / budget) * 100, 100) : 0;
    
    const catMap: Record<string, number> = {};
    personal.filter(e => e.date.startsWith(monthKey)).forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

    return { total, month, budget, progress, topCat };
  }, [personal, profile]);

  const recentPersonal = useMemo(
    () => [...personal].sort((a, b) => b.date < a.date ? -1 : 1).slice(0, 8),
    [personal],
  );

  const sortedGroups = useMemo(() => {
    return groups.map(g => {
      const groupExpenses = expenses.filter(e => e.groupId === g.id);
      const lastExp = groupExpenses.length > 0 ? Math.max(...groupExpenses.map(e => e.createdAt)) : 0;
      const groupSetts = settlements.filter(s => s.groupId === g.id);
      const lastSett = groupSetts.length > 0 ? Math.max(...groupSetts.map(s => s.createdAt)) : 0;
      const lastActivity = Math.max(g.createdAt || 0, lastExp, lastSett);
      return { ...g, lastActivity };
    }).sort((a, b) => b.lastActivity - a.lastActivity).slice(0, 4);
  }, [groups, expenses, settlements]);

  return (
    <div className="min-h-screen bg-background pb-nav-clearance">
      <PageHeader title="Split" subtitle={mode === "personal" ? "Personal expenses" : "Shared expenses, simplified"} showModeSwitch />

      <div className="px-5 space-y-4">
        {mode === "personal" ? (
          <>
            <SurfaceCard variant="brand" padding="lg" className="relative overflow-hidden">
              <p className="text-sm font-medium opacity-90 mb-2">Spent this month</p>
              <p className="text-5xl font-bold tracking-tightest tabular-nums">{fmt(personalStats.month, cur)}</p>
              
              {personalStats.budget > 0 && (
                <div className="mt-6 space-y-2 relative z-10">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest opacity-90">
                    <span>Monthly Budget</span>
                    <span>{Math.round(personalStats.progress)}%</span>
                  </div>
                  <div className="h-3 bg-brand-foreground/20 rounded-full overflow-hidden p-0.5">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 rounded-full shadow-lg",
                        personalStats.progress > 90 ? "bg-warning" : "bg-white"
                      )} 
                      style={{ width: `${personalStats.progress}%` }} 
                    />
                  </div>
                  <div className="flex justify-between items-center opacity-80">
                    <p className="text-[10px] font-bold tracking-tight">
                      {fmt(personalStats.month, cur)} / {fmt(personalStats.budget, cur)}
                    </p>
                    <p className="text-[10px] font-bold tracking-tight">
                      {fmt(personalStats.budget - personalStats.month, cur)} left
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">All-time</p>
                  <p className="text-xl font-black tabular-nums">{fmt(personalStats.total, cur)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Top Category</p>
                  <p className="text-xl font-black truncate">{personalStats.topCat}</p>
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 size-56 rounded-full bg-brand-foreground/10" />
            </SurfaceCard>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-ink/70">Savings Goals</h3>
                <button 
                  onClick={() => {
                    setPromptConfig({
                      title: "New Goal Title",
                      onSubmit: (title) => {
                        setPromptConfig({
                          title: "Target Amount",
                          type: "number",
                          onSubmit: (target) => {
                            addSavingsGoal({
                              title,
                              targetAmount: Number(target),
                              currentAmount: 0,
                              category: "Shopping"
                            });
                            setPromptOpen(false);
                          }
                        });
                        setPromptValue("");
                        setPromptOpen(true);
                      }
                    });
                    setPromptValue("");
                    setPromptOpen(true);
                  }}
                  className="size-8 rounded-xl bg-surface border border-hairline flex items-center justify-center text-brand hover:scale-105 active:scale-95 transition-all shadow-soft"
                >
                  <Plus className="size-4" strokeWidth={3} />
                </button>
              </div>

              {savingsGoals.length === 0 ? (
                <SurfaceCard variant="outline" className="border-dashed border-2 py-8 text-center flex flex-col items-center gap-2">
                  <div className="size-10 rounded-2xl bg-brand-soft flex items-center justify-center text-brand">
                    <Target className="size-5" />
                  </div>
                  <p className="text-xs font-bold text-ink-soft">No active goals. Start saving for something special!</p>
                </SurfaceCard>
              ) : (
                <div className="space-y-3">
                  {savingsGoals.map((goal) => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    return (
                      <SurfaceCard key={goal.id} variant="glass" padding="md" className="group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                            progress === 100 ? "bg-success/20 text-success" : "bg-brand/10 text-brand"
                          )}>
                            {progress === 100 ? <Trophy className="size-6" /> : <Target className="size-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-black text-ink uppercase tracking-tight">{goal.title}</p>
                              <p className="text-xs font-black tabular-nums text-brand">{fmt(goal.currentAmount, cur)}</p>
                            </div>
                            <div className="h-2 bg-brand/5 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all duration-1000", progress === 100 ? "bg-success" : "bg-brand")} 
                                style={{ width: `${progress}%` }} 
                              />
                            </div>
                            <div className="flex justify-between mt-1.5 opacity-60">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[9px] font-bold uppercase tracking-widest">Progress {Math.round(progress)}%</p>
                                {goal.streak > 0 && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-warning/20 text-warning text-[8px] font-black">
                                    🔥 {goal.streak}
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] font-bold uppercase tracking-widest">Target {fmt(goal.targetAmount, cur)}</p>
                            </div>
                            {progress < 100 && goal.currentAmount > 0 && (
                              <p className="text-[8px] font-bold text-brand mt-1 opacity-80 italic">
                                💡 Est. {Math.ceil((goal.targetAmount - goal.currentAmount) / (goal.currentAmount / Math.max(1, (Date.now() - goal.createdAt) / (1000 * 60 * 60 * 24))))} days to target
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedGoal({ id: goal.id, title: goal.title });
                              setConfirmOpen(true);
                            }}
                            className="size-8 rounded-xl bg-surface-soft text-ink-soft hover:text-destructive flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setPromptConfig({
                                title: `Add to ${goal.title}`,
                                type: "number",
                                onSubmit: (amt) => {
                                  updateSavingsGoal(goal.id, { currentAmount: goal.currentAmount + Number(amt) });
                                  setPromptOpen(false);
                                }
                              });
                              setPromptValue("");
                              setPromptOpen(true);
                            }}
                            className="size-8 rounded-xl bg-ink text-background flex items-center justify-center shadow-lg"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                      </SurfaceCard>
                    );
                  })}
                </div>
              )}
            </div>
            
            <PromptModal 
              isOpen={promptOpen} 
              onClose={() => setPromptOpen(false)} 
              title={promptConfig.title}
              value={promptValue}
              onChange={setPromptValue}
              onSubmit={() => promptConfig.onSubmit(promptValue)}
              type={promptConfig.type}
            />

            <ConfirmModal
              isOpen={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              title="Delete Goal"
              onConfirm={() => {
                if (selectedGoal) deleteSavingsGoal(selectedGoal.id);
              }}
              confirmText="Delete"
              confirmVariant="destructive"
            >
              Are you sure you want to delete the goal <span className="font-bold text-ink">"{selectedGoal?.title}"</span>? This will permanently remove your progress.
            </ConfirmModal>

            <div>
              <Link to="/split" className="block">
                <SurfaceCard padding="md" className="hover:shadow-card transition-shadow flex items-center gap-3">
                  <div className="size-10 rounded-full bg-brand text-brand-foreground flex items-center justify-center">
                    <Wallet className="size-5" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Add personal expense</p>
                    <p className="text-[11px] text-ink-soft">Track a private spend</p>
                  </div>
                </SurfaceCard>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between pt-2 px-1">
                <h3 className="text-base font-bold text-ink">Recent personal</h3>
                <Link to="/transactions?mode=personal" className="text-xs text-brand font-semibold">See all</Link>
              </div>
              <SurfaceCard padding="md">
                {recentPersonal.length === 0 ? (
                  <p className="text-sm text-ink-soft text-center py-4">No personal expenses yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {recentPersonal.map((e) => {
                      const Icon = categoryIcons[e.category] || categoryIcons["Other"];
                      return (
                        <li key={e.id}>
                          <div className="flex items-center justify-between group/item">
                            <Link key={e.id} to={`/split?edit=${e.id}`} className="flex items-center justify-between flex-1 min-w-0">
                              <div className="flex items-center gap-3 min-w-0">
                                <BrandIcon 
                                  description={e.description} 
                                  size="md" 
                                  fallback={
                                    <div className="size-10 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                      <Icon className="size-4" strokeWidth={2} />
                                    </div>
                                  } 
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-ink truncate">{e.description}</p>
                                  <p className="text-[11px] text-ink-soft">{e.category} · {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                                </div>
                              </div>
                              <p className="text-sm font-bold tabular-nums text-ink shrink-0 mr-2">{fmt(e.amount, cur)}</p>
                            </Link>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="size-8 rounded-full bg-surface-soft text-ink-soft flex items-center justify-center shrink-0 hover:bg-surface hover:text-ink transition-all">
                                  <MoreVertical className="size-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl shadow-2xl border-hairline min-w-[150px] p-1.5 glass backdrop-blur-xl">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedExpense(e);
                                    setPromptConfig({
                                      title: `Add to ${e.description}`,
                                      type: "number",
                                      onSubmit: (amt) => {
                                        addSubEntry(e.id, { amount: Number(amt), date: new Date().toISOString() });
                                        setPromptOpen(false);
                                        toast.success("Sub-entry added!");
                                      }
                                    });
                                    setPromptValue("");
                                    setPromptOpen(true);
                                  }}
                                  className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer hover:bg-surface-soft text-brand"
                                >
                                  <PlusCircle className="size-3.5" />
                                  <span className="text-xs font-bold">+ ADD</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/personal/${e.id}`)}
                                  className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer hover:bg-surface-soft"
                                >
                                  <Eye className="size-3.5" />
                                  <span className="text-xs font-bold">View Details</span>
                                </DropdownMenuItem>
                                <div className="h-px bg-hairline my-1" />
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/split?edit=${e.id}`)}
                                  className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer hover:bg-surface-soft"
                                >
                                  <Edit3 className="size-3.5" />
                                  <span className="text-xs font-bold">Edit</span>
                                </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setDeleteId({ id: e.id, isPersonal: true })}
                                    className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                  >
                                  <Trash2 className="size-3.5" />
                                  <span className="text-xs font-bold">Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SurfaceCard>
            </div>
          </>
        ) : (
          <>
            <div>
              <SurfaceCard variant="brand" padding="lg" className="relative overflow-hidden shadow-brand bg-gradient-to-br from-brand to-[#4338ca]">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Net Balance</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-extrabold tracking-tightest tabular-nums">
                    {summary.owed - summary.owe >= 0 ? "+" : ""}{fmt(summary.owed - summary.owe, cur)}
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                    <div className="flex items-center gap-1.5 opacity-80 text-[10px] font-bold uppercase tracking-wider mb-1"><TrendingUp className="size-3" /> Owed</div>
                    <p className="text-xl font-bold tabular-nums">{fmt(summary.owed, cur)}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                    <div className="flex items-center gap-1.5 opacity-80 text-[10px] font-bold uppercase tracking-wider mb-1"><TrendingDown className="size-3" /> Owes</div>
                    <p className="text-xl font-bold tabular-nums">{fmt(summary.owe, cur)}</p>
                  </div>
                </div>
              </SurfaceCard>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/split" className="block">
                <SurfaceCard padding="md" className="h-full hover:shadow-card transition-shadow">
                  <div className="size-9 rounded-full bg-brand text-brand-foreground flex items-center justify-center mb-3">
                    <Receipt className="size-4" strokeWidth={2.25} />
                  </div>
                  <p className="text-sm font-bold text-ink">Add expense</p>
                  <p className="text-[11px] text-ink-soft">Split a new bill</p>
                </SurfaceCard>
              </Link>
              <Link to="/groups" className="block">
                <SurfaceCard padding="md" className="h-full hover:shadow-card transition-shadow">
                  <div className="size-9 rounded-full bg-brand-soft text-brand-soft-foreground flex items-center justify-center mb-3">
                    <ArrowUpRight className="size-4" strokeWidth={2.25} />
                  </div>
                  <p className="text-sm font-bold text-ink">Settle up</p>
                  <p className="text-[11px] text-ink-soft">Mark debts as paid</p>
                </SurfaceCard>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between pt-2 px-1">
                <h3 className="text-base font-bold text-ink">Your groups</h3>
                <Link to="/groups" className="text-xs text-brand font-semibold">See all</Link>
              </div>

              <div className="space-y-3">
                {sortedGroups.map((g) => {
                  const v = summary.perGroup[g.id] ?? 0;
                  const members = g.memberIds.map((id) => personById(people, id)!).filter(Boolean);
                  const Icon = groupIcons[g.type];
                  return (
                    <div key={g.id}>
                      <Link to={`/groups/${g.id}`} className="block">
                        <SurfaceCard padding="md" className="hover:shadow-card transition-all border-none bg-surface/50 backdrop-blur-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="size-12 rounded-2xl bg-brand text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand/20">
                                <Icon className="size-6" strokeWidth={2} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-base text-ink truncate">{g.name}</p>
                                <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">{g.type} · {members.length} members</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={cn("text-base font-black tabular-nums", v > 0.01 ? "text-success" : v < -0.01 ? "text-destructive" : "text-ink-soft")}>
                                {v > 0.01 ? "+" : ""}{fmt(v, cur)}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-tight text-ink-soft opacity-60">{v > 0.01 ? "Receivable" : v < -0.01 ? "Payable" : "Settled"}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <AvatarStack people={members} max={5} size="sm" />
                            <div className="px-2 py-1 bg-surface-soft rounded-full text-[10px] font-bold text-ink-soft">
                              View Details
                            </div>
                          </div>
                        </SurfaceCard>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between pt-2 px-1">
                <h3 className="text-base font-bold text-ink">Recent shared expenses</h3>
                <Link to="/transactions?mode=group" className="text-xs text-brand font-semibold">See all</Link>
              </div>
              <SurfaceCard padding="md">
                {groupExpenses.length === 0 ? (
                  <p className="text-sm text-ink-soft text-center py-4">No shared expenses yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {groupExpenses.map((e) => {
                      const g = groups.find((x) => x.id === e.groupId);
                      const payer = personById(people, e.paidBy);
                      if (!g || !payer) return null;
                      return (
                        <li key={e.id} className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="size-10 rounded-full bg-surface-soft text-ink-soft flex items-center justify-center shrink-0 hover:bg-surface hover:text-ink transition-all">
                                  <MoreVertical className="size-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="rounded-2xl shadow-2xl border-hairline min-w-[120px] p-1.5 glass backdrop-blur-xl">
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/split?edit=${e.id}`)}
                                  className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer hover:bg-surface-soft"
                                >
                                  <Edit3 className="size-3.5" />
                                  <span className="text-xs font-bold">Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeleteId({ id: e.id, isPersonal: false })}
                                  className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="size-3.5" />
                                  <span className="text-xs font-bold">Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <BrandIcon description={e.description} person={payer} size="md" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ink truncate">{e.description}</p>
                              <p className="text-[11px] text-ink-soft truncate">
                                {payer.id === userId ? "You" : payer?.name?.split(" ")[0] || "User"} paid · {g.name}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-bold tabular-nums text-ink shrink-0">{fmt(e.amount, cur)}</p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SurfaceCard>
            </div>

            {groupSettlements.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-ink px-1 pt-2">Recent settlements</h3>
                <SurfaceCard padding="md">
                  <ul className="space-y-4">
                    {groupSettlements.map((s) => {
                      const g = groups.find((x) => x.id === s.groupId);
                      const from = personById(people, s.from);
                      const to = personById(people, s.to);
                      if (!g || !from || !to) return null;
                      return (
                        <li key={s.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                              <ArrowDownLeft className="size-4" strokeWidth={2.25} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ink truncate">
                                {from.id === userId ? "You" : from?.name?.split(" ")[0] || "User"} → {to.id === userId ? "you" : to?.name?.split(" ")[0] || "User"}
                              </p>
                              <p className="text-[11px] text-ink-soft truncate">Settled · {g.name}</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold tabular-nums text-success shrink-0">{fmt(s.amount, cur)}</p>
                        </li>
                      );
                    })}
                  </ul>
                </SurfaceCard>
              </div>
            )}
          </>
        )}
      </div>
      
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await deleteExpense(deleteId.id, deleteId.isPersonal);
            setDeleteId(null);
            toast.success("Expense deleted");
          }
        }}
        title="Delete Expense"
        confirmText="Delete"
        confirmVariant="destructive"
      >
        Are you sure you want to delete this expense? This action cannot be undone.
      </ConfirmModal>
    </div>
  );
}
