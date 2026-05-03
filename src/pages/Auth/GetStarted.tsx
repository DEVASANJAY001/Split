import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Wallet, Users, Receipt, PieChart, Calculator, CheckCircle2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GetStarted() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Efficient Splitting",
      desc: "Split expenses across your entire team effortlessly.",
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      icon: Receipt,
      title: "Quick Entries",
      desc: "Log every expense on the go with smart insights.",
      color: "bg-amber-500/10 text-amber-500"
    },
    {
      icon: Calculator,
      title: "Auto Settle",
      desc: "Instant calculations for who owes who, zero effort.",
      color: "bg-emerald-500/10 text-emerald-500"
    }
  ];

  const handleStart = () => {
    localStorage.setItem("onboarded", "true");
    navigate("/signup");
  };

  return (
    <div className="h-[100dvh] bg-background text-ink overflow-hidden relative flex flex-col">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 font-black italic">
          <div className="size-7 bg-brand rounded-lg flex items-center justify-center shadow-brand shadow-sm">
            <span className="text-brand-foreground font-black text-[10px] italic">S</span>
          </div>
          <span className="text-lg tracking-tightest">Split</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center px-8 pb-12 z-10 max-w-lg mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-10"
        >
          <div className="size-16 bg-brand rounded-[24px] flex items-center justify-center shadow-brand shadow-lg mx-auto mb-6 rotate-3">
             <Wallet className="size-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black tracking-tightest leading-[1.05] italic">
            Journey Together, <br/> 
            <span className="text-brand">Split Better.</span>
          </h1>
          <p className="text-ink-soft text-sm font-medium leading-relaxed max-w-[240px] mx-auto">
            The ultimate way to manage group money and trip expenses without the stress.
          </p>
        </motion.div>

        {/* Feature Highlights - Simple & Small */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {[
            { icon: Users, label: "Group Split" },
            { icon: Receipt, label: "Quick Scan" },
            { icon: Calculator, label: "Auto Settle" },
            { icon: CheckCircle2, label: "Zero Debt" }
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 p-3 bg-surface/50 border border-hairline rounded-2xl shadow-sm"
            >
              <f.icon className="size-3.5 text-brand" strokeWidth={3} />
              <span className="text-[11px] font-bold tracking-tight text-ink">{f.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={handleStart}
            className="w-full bg-ink text-background rounded-full py-4 font-bold text-base shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <span>Get Started</span>
            <ArrowRight className="size-5" strokeWidth={3} />
          </button>
        </motion.div>
      </main>
    </div>
  );
}

