import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { AvatarStack, PersonAvatar } from "@/components/Avatar";
import { useStore, netBalances, personById } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { groupIcons, categoryIcons } from "@/lib/icons";
import { ArrowDownLeft, ArrowUpRight, Receipt, Wallet, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { groups, expenses, settlements, people, mode, personal, userId, profile } = useStore();
  const cur = profile?.currency || "USD";

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

  const recent = useMemo(() => {
    const items: Array<{ id: string; ts: number; node: React.ReactNode }> = [];
    for (const e of expenses) {
      const g = groups.find((x) => x.id === e.groupId);
      const payer = personById(people, e.paidBy);
      if (!g || !payer) continue;
      items.push({
        id: e.id, ts: e.createdAt,
        node: (
          <li key={e.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <PersonAvatar person={payer} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{e.description}</p>
                <p className="text-[11px] text-ink-soft truncate">
                  {payer.id === userId ? "You" : payer.name.split(" ")[0]} paid · {g.name}
                </p>
              </div>
            </div>
            <p className="text-sm font-bold tabular-nums text-ink shrink-0">{fmt(e.amount, cur)}</p>
          </li>
        ),
      });
    }
    for (const s of settlements) {
      const g = groups.find((x) => x.id === s.groupId);
      const from = personById(people, s.from);
      const to = personById(people, s.to);
      if (!g || !from || !to) continue;
      items.push({
        id: s.id, ts: s.createdAt,
        node: (
          <li key={s.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                <ArrowDownLeft className="size-4" strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">
                  {from.id === userId ? "You" : from.name.split(" ")[0]} → {to.id === userId ? "you" : to.name.split(" ")[0]}
                </p>
                <p className="text-[11px] text-ink-soft truncate">Settled · {g.name}</p>
              </div>
            </div>
            <p className="text-sm font-bold tabular-nums text-success shrink-0">{fmt(s.amount, cur)}</p>
          </li>
        ),
      });
    }
    return items.sort((a, b) => b.ts - a.ts).slice(0, 6);
  }, [expenses, settlements, groups, people, userId, cur]);

  // Personal mode aggregations
  const personalStats = useMemo(() => {
    const total = personal.reduce((a, e) => a + e.amount, 0);
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = personal.filter((e) => e.date.startsWith(monthKey)).reduce((a, e) => a + e.amount, 0);
    return { total, month };
  }, [personal]);

  const recentPersonal = useMemo(
    () => [...personal].sort((a, b) => b.date < a.date ? -1 : 1).slice(0, 8),
    [personal],
  );

  if (mode === "personal") {
    return (
      <div>
        <PageHeader title="SmartSplit" subtitle="Personal expenses" showModeSwitch />
        <div className="px-5 space-y-4">
          <SurfaceCard variant="brand" padding="lg" className="relative overflow-hidden">
            <p className="text-sm font-medium opacity-90 mb-2">Spent this month</p>
            <p className="text-5xl font-bold tracking-tightest tabular-nums">{fmt(personalStats.month, cur)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-brand-foreground/10 rounded-2xl p-3">
                <p className="text-[11px] opacity-90">All-time</p>
                <p className="text-lg font-bold tabular-nums">{fmt(personalStats.total, cur)}</p>
              </div>
              <div className="bg-brand-foreground/10 rounded-2xl p-3">
                <p className="text-[11px] opacity-90">Entries</p>
                <p className="text-lg font-bold tabular-nums">{personal.length}</p>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 size-56 rounded-full bg-brand-foreground/10" />
          </SurfaceCard>

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

          <div className="flex items-end justify-between pt-2 px-1">
            <h3 className="text-base font-bold text-ink">Recent personal</h3>
          </div>
          <SurfaceCard padding="md">
            {recentPersonal.length === 0 ? (
              <p className="text-sm text-ink-soft text-center py-4">No personal expenses yet.</p>
            ) : (
              <ul className="space-y-4">
                {recentPersonal.map((e) => {
                  const Icon = categoryIcons[e.category];
                  return (
                    <li key={e.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-full bg-brand-soft text-brand-soft-foreground flex items-center justify-center shrink-0">
                          <Icon className="size-4" strokeWidth={2.25} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{e.description}</p>
                          <p className="text-[11px] text-ink-soft">{e.category} · {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
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
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="SmartSplit" subtitle="Shared expenses, simplified" showModeSwitch />

      <div className="px-5 space-y-4">
        <SurfaceCard variant="brand" padding="lg" className="relative overflow-hidden">
          <p className="text-sm font-medium opacity-90 mb-2">Your overall balance</p>
          <p className="text-5xl font-bold tracking-tightest tabular-nums">
            {summary.owed - summary.owe >= 0 ? "+" : ""}{fmt(summary.owed - summary.owe, cur)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-brand-foreground/10 rounded-2xl p-3">
              <div className="flex items-center gap-1 opacity-90 text-[11px]"><TrendingUp className="size-3" /> You are owed</div>
              <p className="text-lg font-bold tabular-nums">{fmt(summary.owed, cur)}</p>
            </div>
            <div className="bg-brand-foreground/10 rounded-2xl p-3">
              <div className="flex items-center gap-1 opacity-90 text-[11px]"><TrendingDown className="size-3" /> You owe</div>
              <p className="text-lg font-bold tabular-nums">{fmt(summary.owe, cur)}</p>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 size-56 rounded-full bg-brand-foreground/10" />
        </SurfaceCard>

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

        <div className="flex items-end justify-between pt-2 px-1">
          <h3 className="text-base font-bold text-ink">Your groups</h3>
          <Link to="/groups" className="text-xs text-brand font-semibold">See all</Link>
        </div>

        <div className="space-y-3">
          {groups.map((g) => {
            const v = summary.perGroup[g.id] ?? 0;
            const members = g.memberIds.map((id) => personById(people, id)!).filter(Boolean);
            const Icon = groupIcons[g.type];
            return (
              <Link key={g.id} to={`/groups/${g.id}`} className="block">
                <SurfaceCard padding="md" className="hover:shadow-card transition-shadow">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-11 rounded-2xl bg-brand-soft text-brand-soft-foreground flex items-center justify-center shrink-0">
                        <Icon className="size-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-ink truncate">{g.name}</p>
                        <p className="text-[11px] text-ink-soft">{g.type} · {members.length} members</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-sm font-bold tabular-nums", v > 0.01 ? "text-success" : v < -0.01 ? "text-destructive" : "text-ink-soft")}>
                        {v > 0.01 ? "+" : ""}{fmt(v, cur)}
                      </p>
                      <p className="text-[10px] text-ink-soft">{v > 0.01 ? "you get back" : v < -0.01 ? "you owe" : "settled"}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <AvatarStack people={members} max={5} size="sm" />
                  </div>
                </SurfaceCard>
              </Link>
            );
          })}
        </div>

        <div className="flex items-end justify-between pt-2 px-1">
          <h3 className="text-base font-bold text-ink">Recent activity</h3>
          <Link to="/transactions" className="text-xs text-brand font-semibold">See all</Link>
        </div>

        <SurfaceCard padding="md">
          {recent.length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-4">No activity yet.</p>
          ) : (
            <ul className="space-y-4">{recent.map((r) => r.node)}</ul>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
