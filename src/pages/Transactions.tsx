import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { PersonAvatar } from "@/components/Avatar";
import { useStore, personById, Category } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { Search, ArrowDownLeft, ArrowRight } from "lucide-react";
import { groupIcons } from "@/lib/icons";

const CATS: ("All" | Category)[] = ["All", "Food", "Travel", "Rent", "Utilities", "Shopping", "Entertainment", "Fuel", "Bills", "Other"];

export default function Transactions() {
  const { expenses, settlements, groups, people, userId, profile } = useStore();
  const cur = profile?.currency || "USD";
  const [filter, setFilter] = useState<typeof CATS[number]>("All");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    type Item = { kind: "expense" | "settle"; ts: number; date: string; node: React.ReactNode; cat?: Category; group: string };
    const out: Item[] = [];
    for (const e of expenses) {
      const g = groups.find((x) => x.id === e.groupId);
      const payer = personById(people, e.paidBy);
      if (!g || !payer) continue;
      if (filter !== "All" && e.category !== filter) continue;
      if (groupFilter !== "all" && g.id !== groupFilter) continue;
      if (q && !e.description.toLowerCase().includes(q.toLowerCase())) continue;
      out.push({
        kind: "expense", ts: e.createdAt, date: e.date, cat: e.category, group: g.name,
        node: (
          <li key={e.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <PersonAvatar person={payer} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{e.description}</p>
                <p className="text-[11px] text-ink-soft truncate">
                  {payer.id === userId ? "You" : payer.name.split(" ")[0]} paid · {g.name} · {e.category}
                </p>
              </div>
            </div>
            <p className="text-sm font-bold tabular-nums text-ink shrink-0">{fmt(e.amount, g.currency)}</p>
          </li>
        ),
      });
    }
    for (const s of settlements) {
      const g = groups.find((x) => x.id === s.groupId);
      const from = personById(people, s.from);
      const to = personById(people, s.to);
      if (!g || !from || !to) continue;
      if (filter !== "All") continue;
      if (groupFilter !== "all" && g.id !== groupFilter) continue;
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
                  <span className="truncate">{from.id === userId ? "You" : from.name.split(" ")[0]}</span>
                  <ArrowRight className="size-3 text-ink-soft shrink-0" />
                  <span className="truncate">{to.id === userId ? "you" : to.name.split(" ")[0]}</span>
                </div>
                <p className="text-[11px] text-ink-soft truncate">Settled{s.method ? ` · ${s.method}` : ""} · {g.name}</p>
              </div>
            </div>
            <p className="text-sm font-bold tabular-nums text-success shrink-0">{fmt(s.amount, g.currency)}</p>
          </li>
        ),
      });
    }
    return out.sort((a, b) => b.ts - a.ts);
  }, [expenses, settlements, groups, people, filter, groupFilter, q]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof items> = {};
    for (const it of items) {
      const d = new Date(it.date).toLocaleDateString("en-US", { month: "long", day: "numeric" });
      (g[d] ??= []).push(it);
    }
    return g;
  }, [items]);

  return (
    <div>
      <PageHeader title="Activity" subtitle="All expenses & settlements" showActions={false} />

      <div className="px-5 space-y-4">
        <div className="relative">
          <Search className="size-4 text-ink-soft absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search transactions"
            className="w-full bg-surface rounded-full pl-11 pr-4 py-3 text-sm text-ink placeholder:text-ink-soft outline-none shadow-soft focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
          <button
            onClick={() => setGroupFilter("all")}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
              groupFilter === "all" ? "bg-ink text-background" : "bg-surface text-ink-soft shadow-soft",
            )}
          >
            All groups
          </button>
          {groups.map((g) => {
            const Icon = groupIcons[g.type];
            return (
              <button
                key={g.id}
                onClick={() => setGroupFilter(g.id)}
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5",
                  groupFilter === g.id ? "bg-ink text-background" : "bg-surface text-ink-soft shadow-soft",
                )}
              >
                <Icon className="size-3.5" strokeWidth={2.25} /> {g.name}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                filter === c ? "bg-brand text-brand-foreground shadow-brand" : "bg-surface text-ink-soft shadow-soft",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {Object.entries(grouped).map(([date, list]) => (
          <div key={date}>
            <p className="text-[11px] font-semibold text-ink-soft px-1 mb-2 uppercase tracking-wider">{date}</p>
            <SurfaceCard padding="md">
              <ul className="space-y-4">{list.map((it) => it.node)}</ul>
            </SurfaceCard>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-center text-sm text-ink-soft py-12">No transactions match.</p>
        )}
      </div>
    </div>
  );
}
