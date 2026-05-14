import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SurfaceCard } from "@/components/SurfaceCard";
import { AvatarStack, PersonAvatar } from "@/components/Avatar";
import { QRCode } from "@/components/QRCode";
import { useStore, netBalances, simplifyDebts, personById, SettleMethod } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { groupIcons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Plus, Check, X, XCircle, QrCode, UserPlus, Trash2, UserMinus, MessageSquare, ExternalLink, Download, MoreVertical, Edit3, ArrowDownLeft } from "lucide-react";
import { GroupChat } from "@/components/GroupChat";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/Modal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BrandIcon } from "@/components/BrandIcon";
import { Logo } from "@/components/Logo";

const METHODS: SettleMethod[] = ["Cash", "UPI", "Bank Transfer", "Other"];

export default function GroupDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { groups, expenses, settlements, people, friendIds, addSettlement, updateGroupMembers, userId, profile, deleteGroup, shoppingLists, addShoppingItem, toggleShoppingItem, deleteShoppingItem, deleteExpense, openModal, closeModal, closeGroup, reopenGroup } = useStore();
  const group = groups.find((g) => g.id === id);
  const cur = group?.currency || profile?.currency || "USD";

  const [settleIdx, setSettleIdx] = useState<number | null>(null);
  const [method, setMethod] = useState<SettleMethod>("UPI");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (showQR) openModal();
    else closeModal();
    return () => closeModal();
  }, [showQR, openModal, closeModal]);

  // Auto-close when expiry date has passed
  useEffect(() => {
    if (!group || group.status === "closed" || !group.expiryDate) return;
    const today = new Date().toISOString().slice(0, 10);
    if (today > group.expiryDate) {
      closeGroup(group.id);
      toast.info("Trip auto-closed", { description: `${group.name} reached its end date.` });
    }
  }, [group?.expiryDate, group?.status, group?.id]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<"balances" | "list">("balances");
  const [newItemText, setNewItemText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; personId: string; name: string }>({ open: false, personId: "", name: "" });
  const [expenseDeleteId, setExpenseDeleteId] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const net = useMemo(() => group ? netBalances(group, expenses, settlements) : {}, [group, expenses, settlements]);
  const plan = useMemo(() => simplifyDebts(net), [net]);
  const groupExpenses = useMemo(
    () => expenses.filter((e) => e.groupId === id).sort((a, b) => b.createdAt - a.createdAt),
    [expenses, id],
  );
  const groupSettlements = useMemo(
    () => settlements.filter((s) => s.groupId === id).sort((a, b) => b.createdAt - a.createdAt),
    [settlements, id],
  );

  const activity = useMemo(() => {
    const items: Array<{ id: string; ts: number; node: React.ReactNode }> = [];
    
    // Add Expenses
    for (const e of groupExpenses) {
      const payer = personById(people, e.paidBy)!;
      if (!payer) continue;
      items.push({
        id: e.id,
        ts: e.createdAt,
        node: (
          <li key={e.id} className="flex items-center justify-between group/item">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <PersonAvatar person={payer} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{e.description}</p>
                <p className="text-[11px] text-ink-soft">
                  {payer.id === userId ? "You" : payer.name.split(" ")[0]} paid · {e.category} · {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold tabular-nums text-ink shrink-0">{fmt(e.amount, cur)}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="size-8 rounded-full text-ink-soft hover:bg-surface-soft flex items-center justify-center shrink-0 transition-all opacity-0 group-hover/item:opacity-100">
                    <MoreVertical className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl shadow-2xl border-hairline min-w-[120px] p-1.5 glass backdrop-blur-xl">
                  <DropdownMenuItem onClick={() => navigate(`/split?edit=${e.id}`)} className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer hover:bg-surface-soft">
                    <Edit3 className="size-3.5" />
                    <span className="text-xs font-bold">Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExpenseDeleteId(e.id)} className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                    <Trash2 className="size-3.5" />
                    <span className="text-xs font-bold">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>
        )
      });
    }

    // Add Settlements
    for (const s of groupSettlements) {
      const from = personById(people, s.from)!;
      const to = personById(people, s.to)!;
      if (!from || !to) continue;
      items.push({
        id: s.id,
        ts: s.createdAt,
        node: (
          <li key={s.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-10 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                <ArrowDownLeft className="size-4" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 ml-1">
                <p className="text-xs font-semibold text-ink">
                  {from.id === userId ? "You" : from.name.split(" ")[0]} → {to.id === userId ? "you" : to.name.split(" ")[0]}
                </p>
                <p className="text-[11px] text-ink-soft">Settled{s.method ? ` · ${s.method}` : ""}</p>
              </div>
            </div>
            <p className="text-sm font-bold tabular-nums text-success">{fmt(s.amount, group?.currency)}</p>
          </li>
        )
      });
    }

    return items.sort((a, b) => b.ts - a.ts);
  }, [groupExpenses, groupSettlements, people, userId, cur, navigate, group?.currency]);

  const availableFriends = useMemo(() => {
    if (!group) return [];
    return friendIds
      .filter((fid) => !group.memberIds.includes(fid))
      .map((fid) => personById(people, fid))
      .filter(Boolean) as ReturnType<typeof personById>[];
  }, [friendIds, group, people]);

  if (!group) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="text-ink-soft">Group not found.</p>
        <Link to="/groups" className="text-brand font-semibold text-sm mt-3 inline-block">Back to groups</Link>
      </div>
    );
  }

  const Icon = groupIcons[group.type];
  const members = group.memberIds.map((mid) => personById(people, mid)!).filter(Boolean);
  const total = groupExpenses.reduce((a, e) => a + e.amount, 0);
  const myNet = net[userId || ""] ?? 0;

  // All settled when every net balance is within rounding tolerance
  const isAllSettled = Object.values(net).every(v => Math.abs(v) < 0.01);
  const isClosed = group.status === "closed";

  const confirmSettle = () => {
    if (settleIdx === null) return;
    const s = plan[settleIdx];
    addSettlement({ groupId: group.id, from: s.from, to: s.to, amount: s.amount, date: new Date().toISOString().slice(0, 10), method, createdAt: Date.now() });
    toast.success("Settled", { description: `${personById(people, s.from)?.name} → ${personById(people, s.to)?.name} · ${fmt(s.amount, group.currency)} · ${method}` });
    setSettleIdx(null);
  };

  const addMember = (pid: string) => {
    updateGroupMembers(group.id, [...group.memberIds, pid]);
  };

  const getUPIUri = (toId: string, amount: number) => {
    const to = personById(people, toId);
    if (!to?.upiId) return null;
    return `upi://pay?pa=${to.upiId}&pn=${encodeURIComponent(to.name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Split: ${group.name}`)}`;
  };

  return (
    <div>
      <header className="px-5 pt-8 pb-5 flex items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-surface border border-hairline flex items-center justify-center">
          <ArrowLeft className="size-4" />
        </button>
        <div className="text-center min-w-0 flex items-center gap-2">
          <Logo />
          <div className="min-w-0">
            <p className="text-xs text-ink-soft">{group.type}</p>
            <h1 className="text-lg font-bold tracking-tightest text-ink truncate">{group.name}</h1>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <button
            onClick={() => setShowChat(true)}
            className="size-10 rounded-full bg-surface border border-hairline flex items-center justify-center relative"
            aria-label="Group Chat"
          >
            <MessageSquare className="size-4" strokeWidth={2.25} />
            <span className="absolute top-2 right-2 size-2 bg-brand rounded-full border border-surface" />
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="size-10 rounded-full bg-surface border border-hairline flex items-center justify-center"
            aria-label="Group QR"
          >
            <QrCode className="size-4" strokeWidth={2.25} />
          </button>
          <button
            onClick={() => window.print()}
            className="size-10 rounded-full bg-surface border border-hairline flex items-center justify-center"
            aria-label="Export Statement"
          >
            <Download className="size-4" strokeWidth={2.25} />
          </button>
          <button
            onClick={() => navigate(`/split?group=${group.id}`)}
            disabled={isClosed}
            className={cn(
              "size-10 rounded-full flex items-center justify-center shadow-lg transition-all",
              isClosed ? "bg-surface text-ink-soft opacity-50" : "bg-ink text-background"
            )}
            aria-label="Add expense"
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <div className="px-5 space-y-4">
        <SurfaceCard variant="brand" padding="lg" className="relative overflow-hidden">
          <p className="text-sm font-medium opacity-90 mb-2">
            {myNet >= 0 ? "You are owed" : "You owe in this group"}
          </p>
          <p className="text-5xl font-bold tracking-tightest tabular-nums">
            {myNet >= 0 ? "+" : ""}{fmt(myNet, cur)}
          </p>
          <div className="mt-5 flex items-center justify-between">
            <AvatarStack people={members} max={6} size="sm" />
            <div className="text-right flex flex-col items-end">
              <span className="text-[11px] opacity-80">Total {fmt(total, cur)}</span>
              {members.length > 0 && total > 0 && (
                <span className="text-[10px] opacity-60 mt-0.5">{fmt(total / members.length, cur)} / person</span>
              )}
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 size-56 rounded-full bg-brand-foreground/10" />
        </SurfaceCard>

        {/* Trip lifecycle banner */}
        {isClosed ? (
          <div className="flex items-center justify-between bg-ink-soft/10 border border-ink-soft/20 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 text-ink-soft" strokeWidth={2} />
              <span className="text-xs font-bold text-ink-soft">This trip is closed</span>
            </div>
            <button
              onClick={async () => { await reopenGroup(group.id); toast.success("Trip reopened!"); }}
              className="text-xs font-black text-brand hover:opacity-80 transition-opacity"
            >
              Reopen
            </button>
          </div>
        ) : isAllSettled && total > 0 ? (
          <div className="flex items-center justify-between bg-success/10 border border-success/20 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-success" strokeWidth={2.5} />
              <div>
                <span className="text-xs font-black text-success">All settled up!</span>
                <p className="text-[10px] text-success/70">Everyone is even — ready to close?</p>
              </div>
            </div>
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="text-xs font-black text-success bg-success/10 hover:bg-success hover:text-white px-3 py-1.5 rounded-xl transition-all"
            >
              Close trip
            </button>
          </div>
        ) : group.expiryDate ? (
          <div className="flex items-center gap-2 bg-surface-soft rounded-xl px-3 py-2">
            <span className="text-[10px] text-ink-soft">
              {new Date().toISOString().slice(0,10) > group.expiryDate
                ? "Trip expired"
                : `Ends ${new Date(group.expiryDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
              }
            </span>
          </div>
        ) : null}

        {/* Tab Switcher */}
        <div className="flex bg-surface-soft/50 p-1 rounded-2xl border border-hairline no-print">
          <button 
            onClick={() => setActiveTab("balances")}
            className={cn(
              "flex-1 py-2 text-[10px] font-black rounded-xl transition-all",
              activeTab === "balances" ? "bg-white dark:bg-brand text-brand dark:text-white shadow-sm" : "text-ink-soft"
            )}
          >
            Balances
          </button>
          <button 
            onClick={() => setActiveTab("list")}
            className={cn(
              "flex-1 py-2 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2",
              activeTab === "list" ? "bg-white dark:bg-brand text-brand dark:text-white shadow-sm" : "text-ink-soft"
            )}
          >
            History
            {(shoppingLists[id]?.length ?? 0) > 0 && (
              <span className="size-4 rounded-full bg-brand/10 text-brand text-[8px] flex items-center justify-center">
                {shoppingLists[id].length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "balances" ? (
          <div className="space-y-4">
            <SurfaceCard padding="lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-ink">Members · {members.length}</h3>
                <button
                  onClick={() => setShowAddMembers(true)}
                  className="text-xs font-semibold text-brand flex items-center gap-1 no-print"
                >
                  <UserPlus className="size-3.5" strokeWidth={2.5} /> Add
                </button>
              </div>
              <ul className="space-y-3">
                {members.map((p) => {
                  const v = net[p.id] ?? 0;
                  return (
                    <li key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PersonAvatar person={p} size="md" />
                        <p className="text-sm font-semibold text-ink">{p.id === userId ? "You" : p.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={cn("text-sm font-bold tabular-nums", v > 0.01 ? "text-success" : v < -0.01 ? "text-destructive" : "text-ink-soft")}>
                          {v > 0.01 ? "+" : ""}{fmt(v, cur)}
                        </p>
                        {p.id !== userId && (
                          <button
                            onClick={() => {
                              setConfirmDelete({ open: true, personId: p.id, name: p.name });
                            }}
                            className="size-8 rounded-full flex items-center justify-center text-ink-soft hover:text-destructive hover:bg-destructive/10 transition-colors no-print"
                            aria-label="Remove member"
                          >
                            <UserMinus className="size-3.5" strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SurfaceCard>

            <SurfaceCard padding="lg" className="no-print">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-ink">Settle up</h3>
                <span className="text-[11px] text-ink-soft">{plan.length} payment{plan.length === 1 ? "" : "s"}</span>
              </div>
              <p className="text-xs text-ink-soft mb-4">Minimum payments to settle everyone.</p>
              {plan.length === 0 ? (
                <p className="text-sm text-success py-4 text-center font-medium">All settled up</p>
              ) : (
                <ul className="space-y-3">
                  {plan.map((s, i) => {
                    const from = personById(people, s.from);
                    const to = personById(people, s.to);
                    if (!from || !to) return null;
                    return (
                      <li key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <PersonAvatar person={from} size="sm" />
                          <ArrowRight className="size-3 text-ink-soft shrink-0" />
                          <PersonAvatar person={to} size="sm" />
                          <div className="min-w-0 ml-1">
                            <p className="text-xs font-semibold text-ink truncate">
                              {from.id === userId ? "You" : from.name.split(" ")[0]} → {to.id === userId ? "you" : to.name.split(" ")[0]}
                            </p>
                            <p className="text-[11px] text-ink-soft tabular-nums">{fmt(s.amount, group.currency)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {from.id === userId && getUPIUri(to.id, s.amount) && (
                            <a 
                              href={getUPIUri(to.id, s.amount)!} 
                              className="size-8 rounded-full bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-white transition-colors"
                              title="Pay via UPI"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setSettleIdx(i)}
                            className="size-8 rounded-full bg-brand-soft text-brand-soft-foreground hover:bg-brand hover:text-brand-foreground transition-colors flex items-center justify-center"
                          >
                            <Check className="size-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SurfaceCard>

            <SurfaceCard padding="lg">
              <h3 className="text-base font-bold text-ink mb-4">Expenses</h3>
              {groupExpenses.length === 0 ? (
                <p className="text-sm text-ink-soft text-center py-4">No expenses yet.</p>
              ) : (
                <ul className="space-y-4">
                  {groupExpenses.map((e) => {
                    const payer = personById(people, e.paidBy)!;
                    if (!payer) return null;
                    return (
                      <li key={e.id} className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <BrandIcon description={e.description} person={payer} size="md" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink truncate">{e.description}</p>
                            <p className="text-[11px] text-ink-soft">
                              {payer.id === userId ? "You" : payer.name.split(" ")[0]} paid · {e.category} · {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold tabular-nums text-ink shrink-0">{fmt(e.amount, cur)}</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="size-8 rounded-full text-ink-soft hover:bg-surface-soft flex items-center justify-center shrink-0 transition-all opacity-0 group-hover/item:opacity-100">
                                <MoreVertical className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl shadow-2xl border-hairline min-w-[120px] p-1.5 glass backdrop-blur-xl">
                              <DropdownMenuItem onClick={() => navigate(`/split?edit=${e.id}`)} className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer hover:bg-surface-soft">
                                <Edit3 className="size-3.5" />
                                <span className="text-xs font-bold">Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setExpenseDeleteId(e.id)} className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
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

            {groupSettlements.length > 0 && (
              <SurfaceCard padding="lg">
                <h3 className="text-base font-bold text-ink mb-4">Settled payments</h3>
                <ul className="space-y-3">
                  {groupSettlements.map((s) => {
                    const from = personById(people, s.from)!;
                    const to = personById(people, s.to)!;
                    if (!from || !to) return null;
                    return (
                      <li key={s.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <PersonAvatar person={from} size="sm" />
                          <ArrowRight className="size-3 text-ink-soft shrink-0" />
                          <PersonAvatar person={to} size="sm" />
                          <p className="text-xs font-semibold text-ink ml-1">
                            {from.id === userId ? "You" : from.name.split(" ")[0]} paid {to.id === userId ? "you" : to.name.split(" ")[0]}{s.method ? ` · ${s.method}` : ""}
                          </p>
                        </div>
                        <p className="text-sm font-bold tabular-nums text-success">{fmt(s.amount, group.currency)}</p>
                      </li>
                    );
                  })}
                </ul>
              </SurfaceCard>
            )}
          </div>
        ) : (
          <div className="space-y-4 no-print">
            <SurfaceCard padding="md">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newItemText.trim()) {
                    addShoppingItem(id, newItemText.trim());
                    setNewItemText("");
                  }
                }}
                className="flex gap-2"
              >
                <input 
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Add item (e.g. Milk)"
                  className="flex-1 bg-surface-soft rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                />
                <button 
                  type="submit"
                  className="size-10 rounded-xl bg-brand text-white flex items-center justify-center"
                >
                  <Plus className="size-5" />
                </button>
              </form>
            </SurfaceCard>

            <div className="space-y-2">
              {(shoppingLists[id] || []).sort((a,b) => b.createdAt - a.createdAt).map((item) => (
                <SurfaceCard key={item.id} padding="sm" className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleShoppingItem(item.id, !item.isCompleted)}
                    className={cn(
                      "size-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      item.isCompleted ? "bg-success border-success text-white" : "border-hairline text-transparent"
                    )}
                  >
                    <Check className="size-4" />
                  </button>
                  <span className={cn("text-sm font-medium flex-1", item.isCompleted && "line-through text-ink-soft")}>
                    {item.text}
                  </span>
                  <button 
                    onClick={() => deleteShoppingItem(item.id)}
                    className="size-8 rounded-full text-ink-soft hover:text-destructive transition-colors flex items-center justify-center"
                  >
                    <X className="size-4" />
                  </button>
                </SurfaceCard>
              ))}
              {(shoppingLists[id]?.length ?? 0) === 0 && (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                  <div className="size-16 rounded-3xl bg-surface flex items-center justify-center text-ink-soft shadow-soft">
                    <Check className="size-8 opacity-20" />
                  </div>
                  <p className="text-xs font-bold text-ink-soft uppercase tracking-widest">Nothing to buy yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {settleIdx !== null && (
        <div className="fixed inset-0 z-[70] bg-ink/40 flex items-end md:items-center justify-center" onClick={() => setSettleIdx(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full md:max-w-md bg-surface rounded-t-3xl md:rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tightest text-ink">Mark as settled</h2>
              <button onClick={() => setSettleIdx(null)} className="size-8 rounded-full bg-surface-soft flex items-center justify-center">
                <X className="size-4" />
              </button>
            </div>
            <p className="text-sm text-ink-soft">
              {personById(people, plan[settleIdx].from)?.name} → {personById(people, plan[settleIdx].to)?.name} · <span className="font-bold text-ink">{fmt(plan[settleIdx].amount, cur)}</span>
            </p>
            <div>
              <label className="text-xs font-semibold text-ink-soft">Payment method</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "rounded-2xl py-3 text-sm font-semibold transition-all",
                      method === m ? "bg-brand text-brand-foreground" : "bg-surface-soft text-ink",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              {plan[settleIdx].from === userId && getUPIUri(plan[settleIdx].to, plan[settleIdx].amount) && (
                <a
                  href={getUPIUri(plan[settleIdx].to, plan[settleIdx].amount)!}
                  className="flex-1 bg-success text-white py-4 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-success/20"
                >
                  Pay via UPI <ExternalLink className="size-4" />
                </a>
              )}
              <button
                onClick={confirmSettle}
                className={cn(
                  "py-4 rounded-full font-semibold text-sm shadow-brand hover:opacity-90 active:scale-[0.98] transition",
                  plan[settleIdx].from === userId && getUPIUri(plan[settleIdx].to, plan[settleIdx].amount) ? "flex-[0.6] bg-surface-soft text-ink" : "w-full bg-brand text-brand-foreground"
                )}
              >
                Confirm settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-[70] bg-ink/40 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-surface/95 backdrop-blur-xl rounded-3xl p-6 space-y-5 text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-hairline/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-left">
                <h2 className="text-xl font-black tracking-tightest text-ink">Group QR</h2>
                <p className="text-xs font-bold text-brand uppercase tracking-widest">{group.name}</p>
              </div>
              <button onClick={() => setShowQR(false)} className="size-10 rounded-full bg-surface-soft flex items-center justify-center shrink-0">
                <X className="size-5" />
              </button>
            </div>
            
            <div className="flex justify-center py-4">
              <QRCode value={`split://group/${group.id}`} size={220} label={`${group.name} · ${group.memberIds.length} members`} />
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const link = `${window.location.origin}/groups/${group.id}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Group link copied!");
                }}
                className="w-full bg-brand text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand/20 hover:opacity-90 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
              >
                <ExternalLink className="size-4" />
                Copy group link
              </button>
              <p className="text-[10px] text-ink-soft uppercase tracking-widest font-bold">
                Scan to join this group instantly
              </p>
            </div>
          </div>
        </div>
      )}

      {showAddMembers && (
        <div className="fixed inset-0 z-[70] bg-ink/40 flex items-end md:items-center justify-center" onClick={() => setShowAddMembers(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full md:max-w-md bg-surface rounded-t-3xl md:rounded-3xl p-6 space-y-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tightest text-ink">Add members</h2>
              <button onClick={() => setShowAddMembers(false)} className="size-8 rounded-full bg-surface-soft flex items-center justify-center">
                <X className="size-4" />
              </button>
            </div>
            {availableFriends.length === 0 ? (
              <p className="text-sm text-ink-soft text-center py-6">All your friends are already in this group.</p>
            ) : (
              <ul className="space-y-2">
                {availableFriends.map((p) => p && (
                  <li key={p.id} className="flex items-center justify-between p-3 bg-surface-soft rounded-2xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <PersonAvatar person={p} size="sm" />
                      <span className="text-sm font-semibold text-ink truncate">{p.name}</span>
                    </div>
                    <button
                      onClick={() => addMember(p.id)}
                      className="px-3 py-1.5 rounded-full bg-brand text-brand-foreground text-xs font-semibold active:scale-95 transition"
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showChat && (
        <GroupChat groupId={group.id} onClose={() => setShowChat(false)} />
      )}

      <ConfirmModal 
        isOpen={confirmDelete.open} 
        onClose={() => setConfirmDelete({ ...confirmDelete, open: false })} 
        title="Remove Member"
        onConfirm={() => {
          updateGroupMembers(group.id, group.memberIds.filter(id => id !== confirmDelete.personId));
        }}
        confirmText="Remove"
        confirmVariant="destructive"
      >
        Are you sure you want to remove <span className="font-bold text-ink">{confirmDelete.name}</span> from this group? This action cannot be undone.
      </ConfirmModal>

      <ConfirmModal
        isOpen={!!expenseDeleteId}
        onClose={() => setExpenseDeleteId(null)}
        title="Delete Expense"
        onConfirm={async () => {
          if (expenseDeleteId) {
            await deleteExpense(expenseDeleteId, false);
            setExpenseDeleteId(null);
            toast.success("Expense deleted");
          }
        }}
        confirmText="Delete"
        confirmVariant="destructive"
      >
        Are you sure you want to delete this expense? This action cannot be undone.
      </ConfirmModal>

      <ConfirmModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        title="Close trip"
        onConfirm={async () => {
          await closeGroup(group.id);
          toast.success("Trip closed!");
        }}
        confirmText="Yes, close it"
        confirmVariant="brand"
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-soft leading-relaxed">
            Closing <span className="font-bold text-ink">{group.name}</span> will mark it as finished. No new expenses can be added.
          </p>
          <p className="text-sm text-ink-soft">You can always reopen it later if needed.</p>
        </div>
      </ConfirmModal>
    </div>
  );
}
