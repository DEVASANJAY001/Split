import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { PersonAvatar } from "@/components/Avatar";
import { useStore, personById, Category } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/select";
import { ArrowDownLeft, ArrowUpRight, Search, SlidersHorizontal, Trash2, ArrowRight, MoreVertical, Edit3, History as HistoryIcon } from "lucide-react";
import { categoryIcons, groupIcons } from "@/lib/icons";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { getBrandIcon } from "@/lib/brand-icons";
import { ConfirmModal } from "@/components/Modal";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const CATS: ("All" | Category)[] = ["All", "Food", "Travel", "Rent", "Utilities", "Shopping", "Entertainment", "Fuel", "Bills", "Other"];

export default function Transactions() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { expenses, settlements, personal, groups, people, userId, profile, mode, deleteExpense } = useStore();
  const cur = profile?.currency || "USD";
  const [filter, setFilter] = useState<typeof CATS[number]>("All");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [amountRange, setAmountRange] = useState<[number, number] | null>(null);
  const [deleteConfirm, setDeleteId] = useState<{ id: string, isPersonal: boolean } | null>(null);

  const items = useMemo(() => {
    const out: { kind: string, ts: number, date: string, node: React.ReactNode, cat?: string, group?: string }[] = [];
    
    // Group Expenses
    if (filter === "All" || filter !== "All") {
      for (const e of expenses) {
        const g = groups.find((x) => x.id === e.groupId);
        if (!g) continue;
        if (filter !== "All" && e.category !== filter) continue;
        if (groupFilter !== "all" && g.id !== groupFilter) continue;
        if (mode === "personal") continue;
        if (q && !e.description.toLowerCase().includes(q.toLowerCase())) continue;
        if (amountRange && (e.amount < amountRange[0] || e.amount > amountRange[1])) continue;

        const payer = personById(people, e.paidBy, profile);
        const Icon = categoryIcons[e.category] || categoryIcons["Other"];
        const isIncome = e.paidBy !== userId;
        
        out.push({
          kind: "expense", ts: new Date(e.date).getTime(), date: e.date, cat: e.category, group: g.name,
          node: (
            <li key={e.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getBrandIcon(e.description) ? (
                  <div className="size-10 rounded-full bg-surface shadow-soft flex items-center justify-center p-2.5 shrink-0 border border-hairline/50">
                    <img src={getBrandIcon(e.description)!} alt="" className="size-full object-contain dark:invert" />
                  </div>
                ) : (
                  <div className="size-10 rounded-full bg-brand-soft text-brand-soft-foreground flex items-center justify-center shrink-0">
                    <Icon className="size-4" strokeWidth={2.25} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{e.description}</p>
                  <p className="text-[11px] text-ink-soft truncate">{g.name} · {payer?.name?.split(" ")[0] || "User"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className={cn("text-sm font-bold tabular-nums", isIncome ? "text-emerald-500" : "text-ink")}>
                  {isIncome ? "+" : "-"}{fmt(e.amount, cur)}
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="size-8 rounded-full text-ink-soft hover:bg-surface-soft flex items-center justify-center shrink-0 transition-all">
                      <MoreVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl shadow-2xl border-hairline min-w-[120px] p-1.5 glass backdrop-blur-xl bg-white/80 dark:bg-ink/80">
                    <DropdownMenuItem onClick={() => navigate(`/split?edit=${e.id}`)} className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer hover:bg-surface-soft">
                      <Edit3 className="size-3.5" />
                      <span className="text-xs font-bold">Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteId({ id: e.id, isPersonal: false })} className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer text-red-500 hover:bg-red-50">
                      <Trash2 className="size-3.5" />
                      <span className="text-xs font-bold">Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ),
        });
      }
    }

    // Personal Expenses
    if (mode === "personal") {
      for (const e of personal) {
        if (filter !== "All" && e.category !== filter) continue;
        if (q && !e.description.toLowerCase().includes(q.toLowerCase())) continue;
        if (amountRange && (e.amount < amountRange[0] || e.amount > amountRange[1])) continue;
        const Icon = categoryIcons[e.category] || categoryIcons["Other"];
        out.push({
          kind: "expense", ts: new Date(e.date).getTime(), date: e.date, cat: e.category, group: "Personal",
          node: (
            <li key={e.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getBrandIcon(e.description) ? (
                  <div className="size-10 rounded-full bg-surface shadow-soft flex items-center justify-center p-2.5 shrink-0 border border-hairline/50">
                    <img src={getBrandIcon(e.description)!} alt="" className="size-full object-contain dark:invert" />
                  </div>
                ) : (
                  <div className="size-10 rounded-full bg-brand-soft text-brand-soft-foreground flex items-center justify-center shrink-0">
                    <Icon className="size-4" strokeWidth={2.25} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{e.description}</p>
                  <p className="text-[11px] text-ink-soft truncate">Personal · {e.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold tabular-nums text-ink shrink-0">{fmt(e.amount, cur)}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="size-8 rounded-full text-ink-soft hover:bg-surface-soft flex items-center justify-center shrink-0 transition-all">
                      <MoreVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl shadow-2xl border-hairline min-w-[120px] p-1.5 glass backdrop-blur-xl bg-white/80 dark:bg-ink/80">
                    <DropdownMenuItem onClick={() => navigate(`/split?edit=${e.id}`)} className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer hover:bg-surface-soft">
                      <Edit3 className="size-3.5" />
                      <span className="text-xs font-bold">Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteId({ id: e.id, isPersonal: true })} className="rounded-xl flex items-center gap-2 py-2.5 px-3 cursor-pointer text-red-500 hover:bg-red-50">
                      <Trash2 className="size-3.5" />
                      <span className="text-xs font-bold">Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ),
        });
      }
    }

    // Settlements
    if (filter === "All") {
      for (const s of settlements) {
        const g = groups.find((x) => x.id === s.groupId);
        const from = personById(people, s.from);
        const to = personById(people, s.to);
        if (!g || !from || !to) continue;
        if (groupFilter !== "all" && g.id !== groupFilter) continue;
        if (mode === "personal") continue;
        if (q && !`${from.name} ${to.name} settled`.toLowerCase().includes(q.toLowerCase())) continue;
        out.push({
          kind: "settle", ts: s.createdAt, date: s.date, group: g.name,
          node: (
            <li key={s.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="size-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-ink min-w-0">
                    <span className="truncate">{from.id === userId ? "You" : from?.name?.split(" ")[0] || "User"}</span>
                    <ArrowRight className="size-3 text-ink-soft shrink-0" />
                    <span className="truncate">{to.id === userId ? "you" : to?.name?.split(" ")[0] || "User"}</span>
                  </div>
                  <p className="text-[11px] text-ink-soft truncate">Settled{s.method ? ` · ${s.method}` : ""} · {g.name}</p>
                </div>
              </div>
              <p className="text-sm font-bold tabular-nums text-success shrink-0">{fmt(s.amount, g.currency)}</p>
            </li>
          ),
        });
      }
    }

    return out.sort((a, b) => b.ts - a.ts);
  }, [expenses, settlements, personal, groups, people, userId, profile, filter, groupFilter, mode, q, amountRange, cur, navigate]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof items> = {};
    for (const it of items) {
      const d = new Date(it.date).toLocaleDateString("en-US", { month: "long", day: "numeric" });
      (g[d] ??= []).push(it);
    }
    return g;
  }, [items]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader title="Activity" subtitle="Track shared and personal spendings" showActions={false} />

      <div className="px-5 space-y-6">
        {/* Advanced Filters */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="size-4 text-ink-soft absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search activity..."
              className="w-full bg-surface-soft/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-ink outline-none border border-hairline focus:ring-2 focus:ring-brand transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shrink-0",
                  filter === c ? "bg-brand text-white border-brand" : "bg-white text-ink-soft border-hairline hover:border-ink/20"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {mode === "group" && (
            <CustomSelect
              value={groupFilter}
              onChange={setGroupFilter}
              options={[
                { value: "all", label: "All Groups" },
                ...groups.map(g => ({ value: g.id, label: g.name }))
              ]}
              variant="surface"
              className="w-full"
            />
          )}
        </div>

        {/* Transactions List */}
        <div className="space-y-10">
          {Object.entries(grouped).length > 0 ? (
            Object.entries(grouped).map(([date, entries]) => (
              <div key={date} className="space-y-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-soft ml-2">{date}</p>
                <SurfaceCard padding="lg" className="border-none bg-white shadow-xl rounded-xl">
                  <ul className="divide-y divide-hairline">
                    {entries.map((it, idx) => (
                      <div key={idx} className={cn(idx !== 0 && "pt-4", idx !== entries.length - 1 && "pb-4")}>
                        {it.node}
                      </div>
                    ))}
                  </ul>
                </SurfaceCard>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <HistoryIcon className="size-12 text-ink-soft/30 mx-auto mb-4" />
              <p className="text-sm font-bold text-ink-soft">No activity found matching your filters.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteConfirm) {
            await deleteExpense(deleteConfirm.id, deleteConfirm.isPersonal);
            toast.success("Transaction deleted successfully");
            setDeleteId(null);
          }
        }}
        title="Delete Transaction?"
        message="This action cannot be undone. All related data will be permanently removed."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
