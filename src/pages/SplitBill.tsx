import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { PersonAvatar } from "@/components/Avatar";
import { useStore, computeShares, SplitMode, Category } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { categoryIcons, groupIcons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ALL_CURRENCIES } from "@/lib/currency-data";

const MODES: { id: SplitMode; label: string }[] = [
  { id: "equal", label: "Equally" },
  { id: "unequal", label: "Unequally" },
  { id: "percent", label: "Percent" },
  { id: "shares", label: "Shares" },
];

const CATEGORIES: Category[] = ["Food", "Travel", "Rent", "Utilities", "Shopping", "Entertainment", "Fuel", "Bills", "Other"];

export default function SplitBill() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [groupId, setGroupId] = useState(initialGroupId);
  const group = groups.find((g) => g.id === groupId);
  const cur = group?.currency || profile?.currency || "USD";

  const recentGroupId = useMemo(() => {
    if (expenses.length > 0) {
      const sorted = [...expenses].sort((a, b) => b.createdAt - a.createdAt);
      const latest = sorted.find(e => groups.some(g => g.id === e.groupId));
      if (latest) return latest.groupId;
    }
    return groups[groups.length - 1]?.id || "";
  }, [expenses, groups]);

  const initialGroupId = params.get("group") || recentGroupId;

  const memberIds = group?.memberIds ?? [];

  const [title, setTitle] = useState("");
  const [total, setTotal] = useState<number>(0);
  const [paidBy, setPaidBy] = useState<string>(userId || "");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [selected, setSelected] = useState<string[]>(memberIds);
  const [values, setValues] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<Category>("Food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const onGroupChange = (id: string) => {
    setGroupId(id);
    const g = groups.find((x) => x.id === id);
    setSelected(g?.memberIds ?? []);
    setPaidBy(userId || "");
    setValues({});
  };

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const shares = useMemo(() => computeShares(total, selected, splitMode, values), [total, selected, splitMode, values]);
  const sum = Object.values(shares).reduce((a, b) => a + b, 0);
  const diff = total - sum;

  const isPersonal = appMode === "personal";

  const valid = isPersonal
    ? title.trim().length > 0 && total > 0
    : title.trim().length > 0 &&
    total > 0 &&
    selected.length > 0 &&
    group !== undefined &&
    (splitMode === "equal" || splitMode === "shares" ? true : Math.abs(diff) < 0.01);

  const save = () => {
    if (!valid) return toast.error("Please complete the expense");
    if (isPersonal) {
      addPersonalExpense({ description: title.trim(), amount: total, category, date });
      toast.success("Personal expense added", { description: `${fmt(total, cur)} · ${title}` });
      navigate("/");
      return;
    }
    if (!group) return;
    addExpense({
      groupId: group.id,
      description: title.trim(),
      amount: total,
      paidBy,
      splitMode,
      shares,
      category,
      date,
      createdAt: Date.now(),
    });
    toast.success("Expense added", { description: `${fmt(total, cur)} · ${title}` });
    navigate(`/groups/${group.id}`);
  };

  if (!isPersonal && groups.length === 0) {
    return (
      <div>
        <PageHeader title="Add expense" subtitle="Split a new bill" showActions={false} showBack />
        <div className="px-5 pt-20 text-center flex flex-col items-center">
          <div className="size-24 bg-surface-soft rounded-full flex items-center justify-center text-brand mb-6">
            <span className="text-4xl text-brand/50">✨</span>
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
    <div>
      <PageHeader title={isPersonal ? "Personal expense" : "Add expense"} subtitle={isPersonal ? "Private spending" : "Split a new bill"} showActions={false} />

      <div className="px-5 space-y-4 pb-4">
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
        <SurfaceCard variant="brand" padding="lg" className="relative overflow-hidden">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What is it for?"
            className="w-full bg-transparent text-base font-medium outline-none placeholder:text-brand-foreground/60"
          />
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tightest">{ALL_CURRENCIES.find(c => c.code === cur)?.symbol || "$"}</span>
            <input
              type="number"
              inputMode="decimal"
              value={total || ""}
              onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="text-5xl font-bold tracking-tightest bg-transparent outline-none w-full tabular-nums placeholder:text-brand-foreground/40"
            />
          </div>
          <div className="absolute -right-20 -bottom-20 size-56 rounded-full bg-brand-foreground/10" />
        </SurfaceCard>

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
                                  {splitMode === "percent" ? "%" : splitMode === "shares" ? "x" : (ALL_CURRENCIES.find(c => c.code === cur)?.symbol || "$")}
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
          <label className="text-xs font-semibold text-ink-soft px-1">Category</label>
          <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
            {CATEGORIES.map((c) => {
              const Icon = categoryIcons[c];
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5",
                    category === c ? "bg-brand text-brand-foreground" : "bg-surface text-ink-soft shadow-soft",
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={2.25} /> {c}
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

        <button
          onClick={save}
          disabled={!valid}
          className={cn(
            "w-full bg-brand text-brand-foreground py-4 rounded-full font-semibold text-sm tracking-wide transition-all shadow-brand",
            "hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none",
          )}
        >
          Save expense {total > 0 && `— ${fmt(total, cur)}`}
        </button>
      </div>
    </div>
  );
}
