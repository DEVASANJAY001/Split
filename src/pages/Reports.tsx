import { useMemo } from "react";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { useStore, Category } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const CAT_COLORS: Record<Category, string> = {
  Food: "hsl(var(--brand))",
  Travel: "hsl(232 90% 70%)",
  Rent: "hsl(var(--ink))",
  Utilities: "hsl(38 92% 55%)",
  Shopping: "hsl(330 80% 60%)",
  Entertainment: "hsl(280 70% 60%)",
  Fuel: "hsl(20 85% 55%)",
  Bills: "hsl(var(--ink-soft))",
  Other: "hsl(220 14% 80%)",
};

export default function Reports() {
  const { expenses, groups, people, userId, profile } = useStore();
  const cur = profile?.currency || "USD";

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) m[e.category] = (m[e.category] ?? 0) + e.amount;
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const byMonth = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) {
      const k = new Date(e.date).toLocaleDateString("en-US", { month: "short" });
      m[k] = (m[k] ?? 0) + e.amount;
    }
    return Object.entries(m).map(([m, v]) => ({ m, v }));
  }, [expenses]);

  const byMember = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) m[e.paidBy] = (m[e.paidBy] ?? 0) + e.amount;
    return Object.entries(m)
      .map(([id, v]) => ({ name: people.find((p) => p.id === id)?.name ?? id, v }))
      .sort((a, b) => b.v - a.v);
  }, [expenses, people]);

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const myPaid = expenses.filter((e) => e.paidBy === userId).reduce((a, e) => a + e.amount, 0);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Spending insights" showActions={false} />

      <div className="px-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <SurfaceCard padding="md">
            <p className="text-xs text-ink-soft">Total spent</p>
            <p className="text-2xl font-bold tracking-tightest text-ink tabular-nums mt-1">{fmt(total)}</p>
          </SurfaceCard>
          <SurfaceCard padding="md">
            <p className="text-xs text-ink-soft">You paid</p>
            <p className="text-2xl font-bold tracking-tightest text-ink tabular-nums mt-1">{fmt(myPaid)}</p>
          </SurfaceCard>
        </div>

        <SurfaceCard padding="lg">
          <h3 className="text-base font-bold text-ink mb-4">By category</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {byCategory.map((d, i) => (
                    <Cell key={i} fill={CAT_COLORS[d.name as Category] ?? "hsl(var(--ink-soft))"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--hairline))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => fmt(v, cur)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
            {byCategory.map((c) => (
              <li key={c.name} className="flex items-center gap-2 text-xs">
                <span className="size-2.5 rounded-full" style={{ background: CAT_COLORS[c.name as Category] }} />
                <span className="text-ink-soft flex-1 truncate">{c.name}</span>
                <span className="font-semibold text-ink tabular-nums">{fmt(c.value)}</span>
              </li>
            ))}
          </ul>
        </SurfaceCard>

        <SurfaceCard padding="lg">
          <h3 className="text-base font-bold text-ink mb-4">Monthly spending</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMonth} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--ink-soft))", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--ink-soft))", fontSize: 10 }} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--surface-soft))" }}
                  contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--hairline))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => fmt(v, cur)}
                />
                <Bar dataKey="v" fill="hsl(var(--brand))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        <SurfaceCard padding="lg">
          <h3 className="text-base font-bold text-ink mb-3">Member contributions</h3>
          <ul className="space-y-3">
            {byMember.map((m) => {
              const pct = total ? (m.v / total) * 100 : 0;
              return (
                <li key={m.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-ink">{m.name}</span>
                    <span className="text-ink-soft tabular-nums">{fmt(m.v, cur)} · {Math.round(pct)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-soft overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </SurfaceCard>
      </div>
    </div>
  );
}
