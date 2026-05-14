import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { fmt } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { ArrowLeft, PlusCircle, Calendar, Receipt, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { categoryIcons } from "@/lib/icons";

export default function PersonalExpenseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { personal, profile } = useStore();
  const cur = profile?.currency || "USD";

  const expense = personal.find((e) => e.id === id);

  if (!expense) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="size-16 rounded-full bg-surface-soft flex items-center justify-center text-ink-soft">
          <Receipt className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-ink">Expense not found</h2>
        <button onClick={() => navigate(-1)} className="text-brand font-bold">Go back</button>
      </div>
    );
  }

  const Icon = categoryIcons[expense.category] || categoryIcons["Other"];

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader 
        title={expense.description} 
        subtitle={`${expense.category} · ${new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
      />

      <div className="px-5 space-y-6">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/10 shrink-0">
            <Icon className="size-6" />
          </div>
          <div className="h-px flex-1 bg-hairline/50" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <SurfaceCard padding="lg" variant="brand" className="relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Spent</p>
            <p className="text-2xl font-black tabular-nums">{fmt(expense.amount, cur)}</p>
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Receipt className="size-12" />
            </div>
          </SurfaceCard>
          <SurfaceCard padding="lg" className="relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-ink-soft mb-1">Items</p>
            <p className="text-2xl font-black tabular-nums text-ink">{expense.subEntries?.length || 1}</p>
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <PlusCircle className="size-12" />
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-ink-soft ml-1">Transaction History</h3>
          <div className="space-y-3">
            {expense.subEntries?.map((sub, idx) => (
              <motion.div 
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <SurfaceCard padding="md" className="group hover:border-brand/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-2xl bg-surface-soft flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                        <Calendar className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink tabular-nums">{fmt(sub.amount, cur)}</p>
                        <p className="text-[10px] font-semibold text-ink-soft">
                          {new Date(sub.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    {sub.note && <p className="text-[10px] text-ink-soft italic">{sub.note}</p>}
                    <ChevronRight className="size-4 text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </SurfaceCard>
              </motion.div>
            )) || (
              <SurfaceCard padding="lg" className="text-center py-12 border-dashed border-2">
                <p className="text-sm text-ink-soft italic font-medium">No sub-entries recorded yet.</p>
              </SurfaceCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
