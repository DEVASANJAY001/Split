import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { PersonAvatar } from "@/components/Avatar";
import { useStore, computeShares, SplitMode, Category, RecurringInterval, personById } from "@/lib/store";
import { fmt, getCurrencySymbol } from "@/lib/finance";
import { categoryIcons, groupIcons } from "@/lib/icons";
import { Users, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ALL_CURRENCIES } from "@/lib/currency-data";
import { CustomSelect } from "@/components/ui/select";
import { CATEGORY_LIBRARY, ALL_ICONS, suggestCategory } from "@/lib/categories";
import { Modal } from "@/components/Modal";
import { Search, ChevronRight, Grid, LayoutGrid, Sparkles, Image as ImageIcon } from "lucide-react";
import { getBrandIcon } from "@/lib/brand-icons";
import { BrandIcon } from "@/components/BrandIcon";

const MODES: { id: SplitMode; label: string }[] = [
  { id: "equal", label: "Equally" },
  { id: "unequal", label: "Unequally" },
  { id: "percent", label: "Percent" },
  { id: "shares", label: "Shares" },
];

const COMMON_CATEGORIES = CATEGORY_LIBRARY.slice(0, 8);

export default function SplitBill() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { groups, expenses, personal, profile, userId, addExpense, addPersonalExpense, updateExpense, updatePersonalExpense, people, mode: appMode, addRecurringTemplate } = useStore();
  const isPersonal = appMode === "personal";
 
  const recentGroupId = useMemo(() => {
    if (expenses.length > 0) {
      const sorted = [...expenses].sort((a, b) => b.createdAt - a.createdAt);
      const latest = sorted.find(e => groups.some(g => g.id === e.groupId));
      if (latest) return latest.groupId;
    }
    return groups[groups.length - 1]?.id || "";
  }, [expenses, groups]);
 
  const initialGroupId = params.get("group") || recentGroupId;
  const [groupId, setGroupId] = useState(initialGroupId);
  const group = groups.find((g) => g.id === groupId);
  const [expenseCurrency, setExpenseCurrency] = useState(group?.currency || profile?.currency || "USD");
  const cur = expenseCurrency;

  const memberIds = group?.memberIds ?? [];

  const [title, setTitle] = useState("");
  const [total, setTotal] = useState<number>(0);
  const [paidBy, setPaidBy] = useState<string>(userId || "");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [selected, setSelected] = useState<string[]>(memberIds);
  const [values, setValues] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<Category>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState<RecurringInterval>("Monthly");
  const [catSearch, setCatSearch] = useState("");
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const identifyTimeout = useRef<NodeJS.Timeout | null>(null);
  const editId = params.get("edit");

  useEffect(() => {
    if (editId) {
      const exp = isPersonal 
        ? personal.find(e => e.id === editId)
        : expenses.find(e => e.id === editId);
      
      if (exp) {
        setTitle(exp.description);
        setTotal(exp.amount);
        setCategory(exp.category);
        setDate(exp.date);
        setNotes(exp.notes || "");
        if (!isPersonal) {
          const e = exp as any;
          setGroupId(e.groupId);
          setExpenseCurrency(e.originalCurrency || e.currency || "USD");
          setPaidBy(e.paidBy);
          setSplitMode(e.splitMode);
          setSelected(Object.keys(e.shares));
          // For unequal/percent modes, we'd ideally reconstruct values here, 
          // but shares contains the final amounts. Re-syncing is complex, 
          // so we'll default to equal if they want to re-edit.
          // Simple fix: if it was unequal, we might need more logic.
        }
      }
    }
  }, [editId, isPersonal, personal, expenses]);

  const onGroupChange = (id: string) => {
    setGroupId(id);
    const g = groups.find((x) => x.id === id);
    if (g) setExpenseCurrency(g.currency);
    setSelected(g?.memberIds ?? []);
    setPaidBy(userId || "");
    setValues({});
  };

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const shares = useMemo(() => computeShares(total, selected, splitMode, values), [total, selected, splitMode, values]);
  const sum = Object.values(shares).reduce((a, b) => a + b, 0);
  const diff = total - sum;


  const valid = (isPersonal
    ? title.trim().length > 0 && total > 0
    : title.trim().length > 0 &&
    total > 0 &&
    selected.length > 0 &&
    group !== undefined &&
    (splitMode === "equal" || splitMode === "shares" ? true : Math.abs(diff) < 0.01)) && category !== "";

  const onTitleChange = (val: string) => {
    setTitle(val);
    if (!val.trim()) {
      setSuggestedName(null);
      setIsIdentifying(false);
      return;
    }
    
    setIsIdentifying(true);
    const suggestion = suggestCategory(val);
    setSuggestedName(suggestion);

    if (identifyTimeout.current) clearTimeout(identifyTimeout.current);

    // Brief delay to make it feel "smart"
    identifyTimeout.current = setTimeout(() => {
      if (suggestion) setCategory(suggestion as Category);
      setIsIdentifying(false);
    }, 600);
  };

  const save = () => {
    if (!valid) return toast.error("Please complete the expense");
    if (isPersonal) {
      if (editId) {
        updatePersonalExpense(editId, { description: title.trim(), amount: total, category, date, notes });
        toast.success("Expense updated!");
      } else {
        addPersonalExpense({ description: title.trim(), amount: total, category, date, notes });
        toast.success("Expense added!");
      }
      navigate("/");
      return;
    }
    if (!group) return;
    
    const payload = {
      groupId: group.id,
      description: title.trim(),
      amount: total,
      paidBy,
      splitMode,
      shares,
      category,
      date,
      notes,
      originalAmount: total,
      originalCurrency: expenseCurrency,
    };

    if (editId) {
      updateExpense(editId, payload);
      toast.success("Expense updated!");
    } else {
      addExpense({ ...payload, createdAt: Date.now() });
      toast.success("Expense split!");
    }
    if (isRecurring) {
      const templateData = isPersonal 
        ? { description: title.trim(), amount: total, category, notes }
        : { groupId: group.id, description: title.trim(), amount: total, paidBy, splitMode, shares, category, notes };
      
      const nextDate = new Date(date);
      if (interval === "Daily") nextDate.setDate(nextDate.getDate() + 1);
      else if (interval === "Weekly") nextDate.setDate(nextDate.getDate() + 7);
      else if (interval === "Monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      else if (interval === "Yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);

      addRecurringTemplate({
        isPersonal,
        interval,
        nextDate: nextDate.toISOString().slice(0, 10),
        isActive: true,
        data: templateData
      });
    }

    navigate(isPersonal ? "/" : `/groups/${group.id}`);
  };

  if (!isPersonal && groups.length === 0) {
    return (
      <div>
        <PageHeader title="Add expense" subtitle="Split a new bill" showActions={false} showBack />
        <div className="px-5 pt-20 text-center flex flex-col items-center">
          <div className="size-24 bg-brand/5 rounded-full flex items-center justify-center text-brand mb-6">
            <Users className="size-10 opacity-40" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold tracking-tightest text-ink">No groups yet</h2>
          <p className="text-sm text-ink-soft mt-2 mb-8 max-w-xs">You need to create a group before you can split bills with others.</p>
          <button
            onClick={() => navigate("/groups?create=true")}
            className="w-full max-w-[200px] bg-brand text-brand-foreground py-3.5 rounded-full font-bold shadow-brand hover:opacity-90 active:scale-95 transition-all"
          >
            Create a group
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
      <PageHeader 
        title={editId ? `Edit ${isPersonal ? 'expense' : 'bill'}` : (isPersonal ? "Personal expense" : "Add expense")} 
        subtitle={isPersonal ? "Private spending" : "Split a new bill"} 
        showActions={false} 
        showBack
      />

      <div className="px-5 space-y-4 pb-32">
        {/* Group selector — group mode only */}
        {!isPersonal && (
          <div>
            <label className="text-xs font-semibold text-ink-soft px-1">Group</label>
            <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
              {groups.map((g) => {
                const Icon = groupIcons[g.type];
                return (
                  <button
                    key={g.id}
                    onClick={() => onGroupChange(g.id)}
                    className={cn(
                      "shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5",
                      g.id === groupId ? "bg-brand text-brand-foreground shadow-brand" : "bg-surface text-ink-soft shadow-soft",
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={2.25} /> {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Title + amount hero */}
        <SurfaceCard variant="brand" padding="lg" className="relative group focus-within:ring-2 focus-within:ring-brand ring-offset-2 transition-all">
          <div className="space-y-1 relative z-10">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Description</label>
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Add - enter here"
              className="w-full bg-transparent text-lg font-bold outline-none placeholder:text-brand-foreground/40"
            />
          </div>

          <div className="mt-6 space-y-1 relative z-10">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Amount</label>
            <div className="flex items-baseline gap-2">
              <CustomSelect 
                variant="glass"
                value={expenseCurrency}
                onChange={setExpenseCurrency}
                options={ALL_CURRENCIES.map(c => ({ value: c.code, label: c.code, symbol: c.symbol }))}
                className="w-24 shrink-0"
              />
              <input
                type="number"
                inputMode="decimal"
                value={total || ""}
                onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="text-4xl font-black tracking-tightest bg-transparent outline-none w-full tabular-nums placeholder:text-brand-foreground/30 focus:placeholder:opacity-0 transition-all"
                autoFocus
              />
            </div>
          </div>
          
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
            <div className="absolute -right-20 -bottom-20 size-56 rounded-full bg-brand-foreground/10" />
          </div>
        </SurfaceCard>

        {/* Smart Discovery Container */}
        {(isIdentifying || (suggestedName && title.trim()) || getBrandIcon(title)) && (
          <div className="animate-in slide-in-from-top-1 duration-200">
            <SurfaceCard padding="sm" className="bg-surface-soft/40 border-dashed border-brand/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BrandIcon 
                    description={title} 
                    size="md" 
                    className="rounded-xl bg-white border-hairline/30 p-1.5"
                    fallback={
                      <div className="size-9 rounded-xl bg-brand/5 text-brand flex items-center justify-center shrink-0">
                        <Sparkles className={cn("size-4", isIdentifying && "animate-spin-slow")} />
                      </div>
                    }
                  />
                  
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand/80">
                      {isIdentifying ? "AI Analysis..." : "Smart Discovery"}
                    </p>
                    <p className="text-xs font-bold text-ink">
                      {isIdentifying ? "Scanning..." : (suggestedName ? `Suggesting ${suggestedName}` : "Brand detected")}
                    </p>
                  </div>
                </div>
                
                {suggestedName && !isIdentifying && (
                  <div className="bg-brand text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
                    Selected
                  </div>
                )}
              </div>
            </SurfaceCard>
          </div>
        )}

        {/* Group-mode-only: paid by + split */}
        {!isPersonal && group && (
          <>
            <div>
              <label className="text-xs font-semibold text-ink-soft px-1">Paid by</label>
              <div className="mt-2 flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5">
                {memberIds.map((id) => {
                  const p = people.find((x) => x.id === id)!;
                  const on = paidBy === id;
                  return (
                    <button key={id} onClick={() => setPaidBy(id)} className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className={cn("rounded-full transition-all", on ? "ring-2 ring-brand ring-offset-2 ring-offset-background" : "opacity-60 grayscale")}>
                        <PersonAvatar person={p} size="lg" />
                      </div>
                      <span className="text-[11px] text-ink font-medium truncate max-w-[60px]">
                        {p.id === userId ? "You" : p.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-soft px-1">Split</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSplitMode(m.id); setValues({}); }}
                    className={cn(
                      "py-3 rounded-2xl text-xs font-semibold transition-all",
                      splitMode === m.id ? "bg-brand text-brand-foreground" : "bg-surface-soft text-ink",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-soft px-1">Split among</label>
              <ul className="mt-2 space-y-2">
                {memberIds.map((id) => {
                  const p = people.find((x) => x.id === id)!;
                  const on = selected.includes(id);
                  const share = shares[id] || 0;
                  return (
                    <SurfaceCard key={id} padding="md" className="!py-3">
                      <div className="flex items-center justify-between gap-3">
                        <button onClick={() => toggle(id)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                          <div className={cn("rounded-full transition-all", !on && "opacity-40 grayscale")}>
                            <PersonAvatar person={p} size="md" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink">{p.id === userId ? "You" : p.name}</p>
                            <p className="text-[11px] text-ink-soft truncate">{on ? "Included" : "Tap to include"}</p>
                          </div>
                        </button>
                        {on && (
                          <div className="text-right shrink-0">
                            {splitMode === "equal" ? (
                              <p className="text-sm font-bold tabular-nums text-ink">{fmt(share, cur)}</p>
                            ) : (
                              <div className="flex items-center gap-1 bg-surface-soft rounded-full px-3 py-1.5">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  value={values[id] ?? ""}
                                  placeholder="0"
                                  onChange={(e) => setValues((v) => ({ ...v, [id]: parseFloat(e.target.value) || 0 }))}
                                  className="w-14 bg-transparent text-right text-sm tabular-nums outline-none font-semibold"
                                />
                                <span className="text-xs text-ink-soft">
                                  {splitMode === "percent" ? "%" : splitMode === "shares" ? "x" : getCurrencySymbol(cur)}
                                </span>
                              </div>
                            )}
                            {splitMode !== "equal" && <p className="text-[11px] text-ink-soft mt-1 tabular-nums">{fmt(share, cur)}</p>}
                          </div>
                        )}
                      </div>
                    </SurfaceCard>
                  );
                })}
              </ul>
              {(splitMode === "unequal" || splitMode === "percent") && (
                <div className="flex items-center justify-between text-xs px-2 mt-2">
                  <span className="text-ink-soft">Allocated</span>
                  <span className={cn("tabular-nums font-semibold", Math.abs(diff) < 0.01 ? "text-success" : "text-warning")}>
                    {fmt(sum, cur)} / {fmt(total, cur)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Category */}
        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-ink-soft">Category</label>
            </div>
            <button 
              onClick={() => setIsCatModalOpen(true)}
              className="text-[10px] font-black uppercase tracking-widest text-brand flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <LayoutGrid className="size-3" /> All Categories
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 py-3">
            {COMMON_CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id as Category)}
                  className={cn(
                    "shrink-0 px-4 py-2.5 rounded-2xl flex items-center gap-2 border transition-all",
                    isActive 
                      ? "bg-brand text-white border-brand shadow-lg scale-105" 
                      : "bg-surface-soft border-hairline text-ink-soft"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="text-xs font-bold">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date + notes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-ink-soft px-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full bg-surface-soft rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-soft px-1">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="optional"
              className="mt-2 w-full bg-surface-soft rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        {/* Recurring */}
        <SurfaceCard padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-brand/5 text-brand flex items-center justify-center">
                <Repeat className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Repeat expense</p>
                <p className="text-[10px] text-ink-soft">Automatically add this every period</p>
              </div>
            </div>
            <button 
              onClick={() => setIsRecurring(!isRecurring)}
              className={cn(
                "w-11 h-6 rounded-full transition-all relative",
                isRecurring ? "bg-brand" : "bg-surface-soft"
              )}
            >
              <div className={cn(
                "absolute top-1 left-1 size-4 rounded-full bg-white transition-all",
                isRecurring ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </div>

          {isRecurring && (
            <div className="grid grid-cols-4 gap-2 pt-1">
              {(["Daily", "Weekly", "Monthly", "Yearly"] as RecurringInterval[]).map((i) => (
                <button
                  key={i}
                  onClick={() => setInterval(i)}
                  className={cn(
                    "py-2 rounded-xl text-[10px] font-bold transition-all",
                    interval === i ? "bg-brand text-brand-foreground shadow-brand" : "bg-surface-soft text-ink-soft"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          )}
        </SurfaceCard>

        <button
          onClick={save}
          disabled={!valid}
          className={cn(
            "w-full bg-brand text-brand-foreground py-4 rounded-full font-semibold text-sm tracking-wide transition-all shadow-brand",
            "hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none",
          )}
        >
          {editId ? "Update expense" : "Save expense"} {total > 0 && `— ${fmt(total, cur)}`}
        </button>
      </div>
    </div>

      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Category & Icons"
        className="md:max-w-md"
      >
        <div className="space-y-5">
          {/* Unified Search & Custom Add */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="size-4 text-ink-soft absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full bg-surface-soft rounded-xl pl-11 pr-4 py-3 text-sm outline-none border border-hairline focus:ring-2 focus:ring-brand transition-all"
              />
            </div>
            
            {!catSearch && (
              <div className="flex gap-2">
                <input 
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Or enter custom name..."
                  className="flex-1 bg-surface-soft/50 rounded-xl px-4 py-2.5 text-[11px] outline-none border border-hairline/50 focus:border-brand transition-all"
                />
                <button 
                  disabled={!customCategory.trim()}
                  onClick={() => {
                    setCategory(customCategory.trim() as Category);
                    setIsCatModalOpen(false);
                  }}
                  className="px-4 rounded-xl bg-brand text-white font-bold text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all active:scale-95"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Main Grid: Horizontal Style */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-ink-soft/60 px-1">Library Categories</h3>
            <div className="grid grid-cols-2 gap-2 max-h-[30vh] overflow-y-auto p-2 pr-1 custom-scrollbar pb-2">
              {CATEGORY_LIBRARY.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).map((c) => {
                const Icon = c.icon;
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCategory(c.id as Category);
                      setIsCatModalOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-xl border transition-all text-left",
                      isSelected 
                        ? "bg-brand/10 border-brand text-brand ring-1 ring-brand/20" 
                        : "bg-surface-soft/30 border-hairline/50 text-ink hover:bg-surface-soft hover:border-hairline"
                    )}
                  >
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-brand text-white shadow-brand" : "bg-white dark:bg-surface shadow-soft border border-hairline/20"
                    )}>
                      <Icon className="size-4" strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] font-bold truncate pr-1">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Usage Library: Compact Icons */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-ink-soft/60 px-1">Visual Glyphs</h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-[20vh] overflow-y-auto p-2 pr-1 custom-scrollbar">
              {ALL_ICONS.slice(0, 32).map((item) => {
                const Icon = item.icon;
                const isSelected = category === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setCategory(item.name as Category);
                      setIsCatModalOpen(false);
                    }}
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center transition-all",
                      isSelected 
                        ? "bg-brand text-white shadow-brand ring-2 ring-brand/20 scale-110" 
                        : "bg-surface-soft/50 text-ink-soft hover:bg-brand/10 hover:text-brand"
                    )}
                  >
                    <Icon className="size-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
