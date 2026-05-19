import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { fmt } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { ArrowLeft, PlusCircle, Calendar, Receipt, ChevronRight, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import { categoryIcons } from "@/lib/icons";
import { BrandIcon } from "@/components/BrandIcon";
import { useState } from "react";
import { PromptModal } from "@/components/Modal";
import { toast } from "sonner";

export default function PersonalExpenseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { personal, profile, updatePersonalExpense } = useStore();
  const cur = profile?.currency || "USD";

  const [promptOpen, setPromptOpen] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [promptConfig, setPromptConfig] = useState<{ title: string; onSubmit: (val: string) => void; type?: string }>({ title: "", onSubmit: () => {} });

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

  const handleEditSubEntry = (sub: any) => {
    // 1. Prompt for Amount
    setPromptConfig({
      title: "Edit Amount",
      type: "number",
      onSubmit: (amt) => {
        const newAmt = Number(amt);
        // 2. Prompt for Date
        setPromptConfig({
          title: "Edit Date",
          type: "date",
          onSubmit: (chosenDate) => {
            // 3. Prompt for Note/Description
            setPromptConfig({
              title: "Edit Note",
              type: "text",
              onSubmit: async (noteText) => {
                if (sub.id === "original") {
                  await updatePersonalExpense(expense.id, {
                    amount: newAmt,
                    date: chosenDate,
                    description: noteText || expense.description
                  });
                } else {
                  const updatedSubEntries = expense.subEntries?.map((s) => {
                    if (s.id === sub.id) {
                      return { ...s, amount: newAmt, date: chosenDate, note: noteText };
                    }
                    return s;
                  }) || [];

                  const newTotal = updatedSubEntries.reduce((sum, s) => sum + s.amount, 0);

                  await updatePersonalExpense(expense.id, {
                    amount: newTotal,
                    subEntries: updatedSubEntries
                  });
                }

                setPromptOpen(false);
                toast.success("Transaction updated!");
              }
            });
            setPromptValue(sub.note || sub.description || "");
            setPromptOpen(true);
          }
        });
        setPromptValue(sub.date ? new Date(sub.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
        setPromptOpen(true);
      }
    });
    setPromptValue(String(sub.amount));
    setPromptOpen(true);
  };

  const listItems = expense.subEntries && expense.subEntries.length > 0
    ? expense.subEntries
    : [{
        id: "original",
        amount: expense.amount,
        date: expense.date,
        note: expense.description
      }];

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader 
        title={expense.description} 
        subtitle={`${expense.category} · ${expense.date ? new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No Date"}`}
        showBack={true}
        showActions={false}
      />

      <div className="px-5 space-y-6">
        <div className="flex items-center gap-4">
          <BrandIcon 
            description={expense.description} 
            size="lg" 
            className="size-14 rounded-2xl shadow-lg shadow-brand/10 shrink-0"
            fallback={
              <div className="size-14 rounded-2xl bg-brand text-white flex items-center justify-center shrink-0">
                <Icon className="size-6" />
              </div>
            }
          />
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
            {listItems.map((sub, idx) => (
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
                          {sub.date ? new Date(sub.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "No Date"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.note && <p className="text-[10px] text-ink-soft italic">{sub.note}</p>}
                      <button 
                        onClick={() => handleEditSubEntry(sub)}
                        className="size-8 rounded-xl bg-surface-soft hover:bg-hairline flex items-center justify-center text-ink-soft hover:text-ink transition-all active:scale-95 shrink-0"
                        title="Edit Transaction"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </SurfaceCard>
              </motion.div>
            ))}
          </div>
        </div>
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
    </div>
  );
}
