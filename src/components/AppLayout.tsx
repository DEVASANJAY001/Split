import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Home, Users, BarChart3, Receipt, Plus, UserPlus, User, ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { PersonAvatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";

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
  const { requests, lastSeenRequests, isModalOpen } = useStore();
  const unreadCount = requests.filter(r => r.createdAt > lastSeenRequests).length;

  const showNav = ["/", "/groups", "/friends", "/transactions", "/reports"].includes(location.pathname) && !isModalOpen;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] size-[50%] bg-brand/5 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[10%] left-[-10%] size-[40%] bg-success/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-grid-white bg-[size:40px_40px] opacity-20" />
      </div>

      <main className={cn("mx-auto max-w-md md:max-w-2xl relative z-10", showNav ? "pb-nav-clearance" : "pb-10")}>
        <div className="w-full">
          <Outlet />
        </div>
      </main>

      {/* Floating FAB - Only on main tabs */}
      {showNav && (
        <button
          onClick={() => navigate("/split")}
          aria-label="Add expense"
          className="fixed bottom-28 right-6 md:right-[calc(50%-18rem)] z-40 size-14 rounded-2xl bg-brand text-brand-foreground flex items-center justify-center shadow-brand hover:scale-105 active:scale-95 transition-all group"
        >
          <Plus className="size-6 transition-transform group-hover:rotate-90" strokeWidth={3} />
        </button>
      )}

      {showNav && (
        <>
          {/* Glass Finish Blur Ending */}
          <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-40" />
          
          <nav className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50 glass rounded-[2.5rem] shadow-2xl pb-safe overflow-hidden">
            <div className="flex items-center justify-around h-16 px-4">
              {tabs.map(({ to, label, icon: Icon, hasBadge }) => {
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "relative flex flex-col items-center justify-center transition-all flex-1 h-full py-1",
                        isActive ? "text-brand" : "text-ink-soft hover:text-ink",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={cn("relative p-2 rounded-2xl transition-all", isActive && "bg-brand/10")}>
                          <Icon className={cn("size-5 transition-all", isActive ? "scale-110" : "scale-100")} strokeWidth={isActive ? 2.5 : 2} />
                          {hasBadge && unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 size-2.5 bg-destructive border-2 border-white dark:border-black rounded-full shadow-sm" />
                          )}
                        </div>
                        <span className={cn("text-[8px] mt-0.5 font-black tracking-widest transition-opacity", isActive ? "opacity-100" : "opacity-40")}>
                          {label}
                        </span>
                        {isActive && (
                          <div className="absolute inset-x-4 bottom-0 h-1 bg-brand rounded-t-full shadow-[0_-4px_10px_rgba(var(--brand),0.5)]" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </>
      )}
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
  rightAction?: React.ReactNode;
}

export const PageHeader = memo(function PageHeader({ title, subtitle, showActions = true, showModeSwitch = false, onAdd, showBack = false, rightAction }: PageHeaderProps) {
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
            <div className="flex items-center gap-2">
              <Logo />
              <h1 className="text-3xl font-black tracking-tightest text-ink truncate">{title}</h1>
            </div>
            {subtitle && (
              <p className="text-base text-ink-soft mt-0.5 tracking-tight truncate pl-8">{subtitle}</p>
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
          {rightAction ? (
            rightAction
          ) : (
            <button
              onClick={() => navigate("/profile")}
              aria-label="Profile"
              className="active:scale-95 transition"
            >
              <PersonAvatar person={profile || { name: "User" }} size="md" />
            </button>
          )}
        </div>
      </div>

      {showModeSwitch && (
        <div className="flex items-center bg-surface-soft/50 backdrop-blur-md rounded-[1.5rem] p-1 shadow-inner border border-white/10">
          <button
            onClick={() => setMode("group")}
            className={cn(
              "flex-1 py-2 rounded-[1.25rem] text-xs font-black tracking-widest transition-all flex items-center justify-center gap-1.5",
              mode === "group" ? "bg-white dark:bg-brand text-brand shadow-xl dark:text-white" : "text-ink-soft",
            )}
          >
            <Users className="size-3.5" strokeWidth={2.5} /> Group
          </button>
          <button
            onClick={() => setMode("personal")}
            className={cn(
              "flex-1 py-2 rounded-[1.25rem] text-xs font-black tracking-widest transition-all flex items-center justify-center gap-1.5",
              mode === "personal" ? "bg-white dark:bg-brand text-brand shadow-xl dark:text-white" : "text-ink-soft",
            )}
          >
            <User className="size-3.5" strokeWidth={2.5} /> Personal
          </button>
        </div>
      )}
    </header>
  );
});
