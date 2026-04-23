import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Wallet, Users, Receipt, PieChart, Calculator, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GetStarted() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Efficient Splitting",
      desc: "We help you efficiently split your money across your entire team.",
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      icon: UserPlus,
      title: "Trip Members",
      desc: "Add trip members to watch, track and manage their shares easily.",
      color: "bg-purple-500/10 text-purple-500"
    },
    {
      icon: Receipt,
      title: "Quick Entries",
      desc: "Log every expense entry on the go during your team journey.",
      color: "bg-amber-500/10 text-amber-500"
    },
    {
      icon: Calculator,
      title: "Auto Calculation",
      desc: "Instant calculations for who owes who, with zero effort.",
      color: "bg-emerald-500/10 text-emerald-500"
    },
    {
      icon: Wallet,
      title: "Money Management",
      desc: "Manage money along your journey for you with smart insights.",
      color: "bg-rose-500/10 text-rose-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-ink overflow-x-hidden relative flex flex-col">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Top Header */}
      <header className="px-6 py-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 font-black italic">
          <div className="size-8 bg-brand rounded-lg flex items-center justify-center shadow-brand shadow-sm">
            <span className="text-brand-foreground font-black text-xs italic">T</span>
          </div>
          <span className="text-xl tracking-tightest">TeamSplt</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 pt-6 pb-6 space-y-12 z-10 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-5xl font-black tracking-tightest leading-[1.1] italic">
            Journey Together, <br/> 
            <span className="text-brand">Split Better.</span>
          </h1>
          <p className="text-ink-soft text-lg font-medium leading-tight">
            The ultimate way to manage group money and trip expenses with your team.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-surface/50 backdrop-blur-xl border border-hairline p-5 rounded-[32px] shadow-soft hover:shadow-card transition-all"
            >
              <div className="flex gap-4">
                <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", f.color)}>
                  <f.icon className="size-6" strokeWidth={2.25} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[17px] font-extrabold tracking-tightest">{f.title}</h3>
                  <p className="text-[13px] text-ink-soft leading-snug font-medium">
                    {f.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4"
        >
          <button
            onClick={() => navigate("/signup")}
            className="w-full bg-ink text-background rounded-full py-5 font-bold text-lg shadow-brand hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-brand/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative z-10">Start Splitting</span>
            <ArrowRight className="size-6 relative z-10" strokeWidth={2.5} />
          </button>
          <p className="text-center text-[10px] text-ink-soft mt-3 font-bold uppercase tracking-widest opacity-40">
            Trusted by teams worldwide
          </p>
        </motion.div>
      </main>
    </div>
  );
}

// Helper to keep icons consistent
import { UserPlus } from "lucide-react";
