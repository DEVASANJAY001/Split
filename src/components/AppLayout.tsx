import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Users, BarChart3, Receipt, Plus, UserPlus, User, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/friends", label: "Friends", icon: UserPlus, hasBadge: true },
  { to: "/transactions", label: "Activity", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { requests, lastSeenRequests } = useStore();
  const unreadCount = requests.filter(r => r.createdAt > lastSeenRequests).length;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-md md:max-w-2xl pb-32">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.2, 
              ease: "linear"
            }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating FAB - Adjusted for bottom bar */}
      <button
        onClick={() => navigate("/split")}
        aria-label="Add expense"
        className="fixed bottom-28 right-6 md:right-[calc(50%-18rem)] z-40 size-14 rounded-full bg-brand text-brand-foreground flex items-center justify-center shadow-brand-lg hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-t border-hairline safe-area-pb">
        <div className="mx-auto max-w-md md:max-w-2xl flex items-center justify-around px-2 py-2">
          {tabs.map(({ to, label, icon: Icon, hasBadge }) => {
            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 transition-all relative",
                    isActive ? "text-brand" : "text-ink-soft hover:text-ink",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon className={cn("size-6 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.25 : 1.75} />
                      {hasBadge && unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 size-2.5 bg-destructive border-2 border-surface rounded-full" />
                      )}
                    </div>
                    <span className={cn("text-[10px] font-bold tracking-tight transition-all", isActive ? "opacity-100" : "opacity-60")}>
                      {label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="navTab"
                        className="absolute -top-2 inset-x-2 h-0.5 bg-brand rounded-full"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showActions?: boolean;
  showModeSwitch?: boolean;
  onAdd?: () => void;
  showBack?: boolean;
}

export function PageHeader({ title, subtitle, showActions = true, showModeSwitch = false, onAdd, showBack = false }: PageHeaderProps) {
  const navigate = useNavigate();
  const { mode, setMode, profile } = useStore();
  const handleAdd = onAdd ?? (() => navigate("/groups?create=true"));
  return (
    <header className="px-5 pt-8 pb-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="size-10 rounded-full bg-surface border border-hairline flex items-center justify-center shrink-0 hover:bg-surface-soft active:scale-95 transition-all outline-none"
            >
              <ArrowLeft className="size-4" strokeWidth={2.25} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tightest text-ink truncate">{title}</h1>
            {subtitle && (
              <p className="text-base text-ink-soft mt-0.5 tracking-tight truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showActions && (
            <button
              onClick={handleAdd}
              aria-label="Create group"
              className="px-4 h-10 rounded-full bg-ink text-background flex items-center gap-1.5 focus:outline-none hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              <span className="text-xs font-bold whitespace-nowrap">Create group</span>
            </button>
          )}
          <button
            onClick={() => navigate("/profile")}
            aria-label="Profile"
            className="size-10 rounded-full overflow-hidden border border-hairline bg-surface-soft active:scale-95 transition flex items-center justify-center text-ink-soft"
          >
            {profile?.avatar ? (
              <img src={profile.avatar} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-5" />
            )}
          </button>
        </div>
      </div>

      {showModeSwitch && (
        <div className="flex items-center bg-surface-soft rounded-full p-1 shadow-soft">
          <button
            onClick={() => setMode("group")}
            className={cn(
              "flex-1 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              mode === "group" ? "bg-brand text-brand-foreground shadow-brand" : "text-ink-soft",
            )}
          >
            <Users className="size-3.5" strokeWidth={2.5} /> Group
          </button>
          <button
            onClick={() => setMode("personal")}
            className={cn(
              "flex-1 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              mode === "personal" ? "bg-brand text-brand-foreground shadow-brand" : "text-ink-soft",
            )}
          >
            <User className="size-3.5" strokeWidth={2.5} /> Personal
          </button>
        </div>
      )}
    </header>
  );
}
