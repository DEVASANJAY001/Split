import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { AvatarStack, PersonAvatar } from "@/components/Avatar";
import { useStore, netBalances, personById, GroupType } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { groupIcons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Search, X, Check, ChevronDown, Globe } from "lucide-react";
import { toast } from "sonner";
import { ALL_CURRENCIES } from "@/lib/currency-data";

const TYPES: GroupType[] = ["Trip", "Roommates", "Couple", "Friends", "Office", "Other"];

export default function Groups() {
  const { groups, expenses, settlements, people, friendIds, addGroup, userId, profile } = useStore();
  const cur = profile?.currency || "USD";
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<GroupType>("Trip");
  const [members, setMembers] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [groupCurrency, setGroupCurrency] = useState(profile?.currency || "USD");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreate(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (profile?.currency && !groupCurrency) {
      setGroupCurrency(profile.currency);
    }
  }, [profile?.currency]);

  useEffect(() => {
    if (userId && showCreate && members.length === 0) {
      setMembers([userId]);
    }
  }, [userId, showCreate]);

  const friends = useMemo(
    () => friendIds.map((id) => personById(people, id)).filter(Boolean) as ReturnType<typeof personById>[],
    [friendIds, people],
  );

  const filteredFriends = useMemo(() => {
    return friends.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, searchQuery]);

  const summaries = useMemo(() => {
    return groups.map((g) => {
      const net = netBalances(g, expenses, settlements);
      const groupExpenses = expenses.filter((e) => e.groupId === g.id);
      const total = groupExpenses.reduce((a, e) => a + e.amount, 0);
      
      const lastExp = groupExpenses.length > 0 ? Math.max(...groupExpenses.map(e => e.createdAt)) : 0;
      const groupSetts = settlements.filter(s => s.groupId === g.id);
      const lastSett = groupSetts.length > 0 ? Math.max(...groupSetts.map(s => s.createdAt)) : 0;
      const lastActivity = Math.max(g.createdAt || 0, lastExp, lastSett);

      return { g, mine: net[userId || ""] ?? 0, total, lastActivity };
    }).sort((a, b) => b.lastActivity - a.lastActivity);
  }, [groups, expenses, settlements, userId]);

  const currentTripId = useMemo(() => {
    const trips = summaries.filter(s => s.g.type === "Trip");
    return trips.length > 0 ? trips[0].g.id : null;
  }, [summaries]);

  const create = async () => {
    if (!name.trim()) return toast.error("Name required");
    if (members.length < 2) return toast.error("Add at least one friend");
    
    setIsCreating(true);
    try {
      await addGroup({ 
        name: name.trim(), 
        description: description.trim(), 
        type, 
        memberIds: members, 
        currency: groupCurrency 
      });
      toast.success("Group created!");
      setShowCreate(false);
      setName(""); 
      setDescription("");
      setMembers(userId ? [userId] : []); 
      setType("Trip");
    } catch (error: any) {
      toast.error(error.message || "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="min-h-screen pb-24">
        <PageHeader title="Groups" subtitle="Your shared ledgers" onAdd={() => setShowCreate(true)} />

        <div className="px-5 space-y-3">
          {summaries.map(({ g, mine, total }) => {
            const list = g.memberIds.map((id) => personById(people, id)!).filter(Boolean);
            const Icon = groupIcons[g.type];
            const cur = g.currency || "USD";

            return (
              <div key={g.id}>
                <Link to={`/groups/${g.id}`} className="block relative">
                  {g.id === currentTripId && (
                    <div className="absolute -top-1 -right-1 z-10 bg-brand text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-brand/30 border-2 border-surface animate-pulse">
                      Active Trip
                    </div>
                  )}
                  <SurfaceCard 
                    padding="lg" 
                    className={cn(
                      "hover:shadow-card transition-all border-none bg-surface/50 backdrop-blur-sm",
                      g.id === currentTripId && "ring-2 ring-brand/20 bg-brand/[0.02]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "size-14 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg",
                          g.id === currentTripId ? "bg-brand text-white shadow-brand/40" : "bg-surface-soft text-ink-soft shadow-soft"
                        )}>
                          <Icon className="size-7" strokeWidth={2.25} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-lg text-ink truncate">{g.name}</p>
                          <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider mt-0.5">
                            {g.type} · Total {fmt(total, cur)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("text-base font-black tabular-nums", mine > 0.01 ? "text-success" : mine < -0.01 ? "text-destructive" : "text-ink-soft")}>
                          {mine > 0.01 ? "+" : ""}{fmt(mine, cur)}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-ink-soft opacity-60">
                          {mine > 0.01 ? "Receivable" : mine < -0.01 ? "Payable" : "Settled"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-hairline/50 pt-4">
                      <AvatarStack people={list} max={6} size="sm" />
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors",
                        g.id === currentTripId ? "bg-brand text-white shadow-brand/20" : "bg-brand/5 text-brand"
                      )}>
                        View Details
                      </div>
                    </div>
                  </SurfaceCard>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-md" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-xl bg-surface rounded-t-[3rem] shadow-float overflow-hidden flex flex-col max-h-[92vh] border-t border-hairline">
            {/* Header Section */}
            <div className="px-8 pt-8 pb-6 bg-surface border-b border-hairline/30 shrink-0">
              <div className="w-16 h-1.5 bg-hairline/80 rounded-full mx-auto mb-6" />
              <div className="text-center relative">
                <h2 className="text-3xl font-black tracking-tightest text-ink">New Group</h2>
                <p className="text-[10px] font-bold text-ink-soft uppercase tracking-[0.2em] mt-1">Start a shared ledger</p>
                <button
                  onClick={() => setShowCreate(false)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 size-10 rounded-full bg-surface-soft flex items-center justify-center hover:bg-hairline transition-colors"
                >
                  <X className="size-5 text-ink" />
                </button>
              </div>
            </div>
 
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="space-y-6">
                {/* Basic Info Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-ink-soft uppercase tracking-widest ml-4">Basic Details</label>
                  <div className="bg-surface-soft rounded-[2.5rem] p-2 space-y-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Group Name (e.g. Europe Trip)"
                      className="w-full bg-surface rounded-[1.75rem] px-6 py-5 text-lg font-bold outline-none focus:ring-2 focus:ring-brand border-none transition-all placeholder:text-ink-soft/30"
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description (Optional)"
                      rows={2}
                      className="w-full bg-surface rounded-[1.75rem] px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand border-none transition-all placeholder:text-ink-soft/30 resize-none"
                    />
                  </div>
                </div>
 
                {/* Category Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-ink-soft uppercase tracking-widest ml-4">Category</label>
                  <div className="grid grid-cols-3 gap-2 px-1">
                    {TYPES.map((t) => {
                      const Icon = groupIcons[t];
                      const selected = type === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setType(t)}
                          className={cn(
                            "rounded-[1.75rem] py-5 px-1 flex flex-col items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all border-2",
                            selected ? "bg-brand border-brand text-white shadow-lg shadow-brand/30" : "bg-surface-soft border-transparent text-ink-soft hover:bg-hairline/30"
                          )}
                        >
                          <Icon className={cn("size-6", selected ? "text-white" : "text-ink-soft")} strokeWidth={2.5} />
                          <span className="truncate w-full text-center">{t}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
 
                {/* Currency Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-ink-soft uppercase tracking-widest ml-4">Currency</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 size-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                      <Globe className="size-5" />
                    </div>
                    <select
                      value={groupCurrency}
                      onChange={(e) => setGroupCurrency(e.target.value)}
                      className="w-full bg-surface-soft rounded-[2rem] pl-16 pr-12 py-5 text-base font-bold outline-none border-2 border-transparent focus:border-brand transition-all appearance-none"
                    >
                      {ALL_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 size-5 text-ink-soft pointer-events-none group-focus-within:text-brand transition-colors" />
                  </div>
                </div>
 
                {/* Friends Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between ml-4 mr-2">
                    <label className="text-[10px] font-black text-ink-soft uppercase tracking-widest">Add Friends</label>
                    <span className="text-[10px] font-bold text-brand bg-brand/10 px-3 py-1 rounded-full">{members.length} Selected</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-ink-soft" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search friends..."
                      className="w-full bg-surface-soft rounded-full py-5 pl-14 pr-6 text-sm font-bold outline-none border border-transparent focus:border-brand transition-all shadow-soft"
                    />
                  </div>
 
                  {friends.length === 0 ? (
                    <div className="p-12 text-center bg-surface-soft/50 rounded-[2.5rem] border-2 border-dashed border-hairline/50 mx-1">
                      <div className="size-16 bg-surface rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-soft">
                        <Search className="size-8 text-ink-soft/30" />
                      </div>
                      <p className="text-sm font-bold text-ink">No friends found</p>
                      <p className="text-[10px] font-bold text-ink-soft uppercase tracking-widest mt-1 mb-8">Add them to your network first</p>
                      <Link to="/friends" className="inline-flex px-8 py-3 bg-brand text-white text-xs font-bold rounded-full hover:shadow-lg transition-all shadow-brand/20">
                        Find Friends
                      </Link>
                    </div>
                  ) : (
                    <ul className="space-y-3 max-h-72 overflow-y-auto pr-2 scrollbar-hide px-1">
                      {filteredFriends.map((p) => p && (
                        <li key={p.id}>
                          <button
                            onClick={() =>
                              setMembers((m) => m.includes(p.id) ? m.filter((x) => x !== p.id) : [...m, p.id])
                            }
                            className={cn(
                              "w-full flex items-center justify-between p-5 rounded-[2rem] transition-all border-2",
                              members.includes(p.id) ? "bg-brand/5 border-brand/20 shadow-sm" : "bg-surface-soft border-transparent hover:bg-hairline/20",
                            )}
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <PersonAvatar person={p} size="md" />
                              <div className="text-left">
                                <p className="text-sm font-bold text-ink truncate">{p.name}</p>
                                <p className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">{p.username}</p>
                              </div>
                            </div>
                            <div className={cn(
                              "size-8 rounded-full border-2 flex items-center justify-center transition-all shadow-sm",
                              members.includes(p.id) ? "bg-brand border-brand text-white" : "border-hairline bg-white",
                            )}>
                              {members.includes(p.id) && <Check className="size-4" strokeWidth={4} />}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
 
              <button
                onClick={create}
                disabled={isCreating}
                className="w-full bg-brand text-brand-foreground py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-brand/30 hover:opacity-95 active:scale-[0.98] transition-all mt-6 flex items-center justify-center gap-3"
              >
                {isCreating ? (
                  <>
                    <div className="size-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Launching...
                  </>
                ) : "Launch Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
