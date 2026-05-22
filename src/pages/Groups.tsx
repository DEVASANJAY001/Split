import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { AvatarStack, PersonAvatar } from "@/components/Avatar";
import { useStore, netBalances, personById, GroupType } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { groupIcons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Search, X, Check, Camera } from "lucide-react";
import { toast } from "sonner";
import { ALL_CURRENCIES } from "@/lib/currency-data";
import { CustomSelect } from "@/components/ui/select";
import { QRScanner } from "@/components/QRScanner";
import { motion } from "framer-motion";

const TYPES: GroupType[] = ["Trip", "Roommates", "Couple", "Friends", "Office", "Other"];

export default function Groups() {
  const navigate = useNavigate();
  const { groups, expenses, settlements, people, friendIds, addGroup, userId, profile, openModal, closeModal } = useStore();
  const cur = profile?.currency || "USD";
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<GroupType>("Trip");
  const [members, setMembers] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [groupCurrency, setGroupCurrency] = useState(profile?.currency || "USD");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

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

  const totalGroupBalance = summaries.reduce((acc, s) => acc + s.mine, 0);
  const totalGroupSpending = summaries.reduce((acc, s) => acc + s.total, 0);

  const currentTripId = useMemo(() => {
    const trips = summaries.filter(s => s.g.type === "Trip");
    return trips.length > 0 ? trips[0].g.id : null;
  }, [summaries]);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreate(true);
      openModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, openModal]);

  useEffect(() => {
    if (showCreate && userId) {
      setMembers([userId]);
    }
  }, [showCreate, userId]);

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
        currency: groupCurrency,
        startDate: startDate || undefined,
        expiryDate: expiryDate || undefined,
        status: "active"
      });
      toast.success("Group created!");
      setShowCreate(false);
      closeModal();
      setName(""); 
      setDescription("");
      setMembers(userId ? [userId] : []); 
      setType("Trip");
      setStartDate("");
      setExpiryDate("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="min-h-screen pb-nav-clearance">
        <PageHeader 
          title="Groups" 
          subtitle="Your shared ledgers" 
          onAdd={() => { setShowCreate(true); openModal(); }} 
          rightAction={
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowScanner(true)}
                className="size-10 rounded-full bg-surface-soft flex items-center justify-center text-ink hover:bg-hairline transition-colors"
                aria-label="Scan QR"
              >
                <Camera className="size-5" />
              </button>
            </div>
          }
        />

        <div className="px-5 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-ink-soft">Your groups</h3>
              <div className="h-px flex-1 bg-hairline/50 ml-4" />
            </div>
            {summaries.map(({ g, mine, total }) => {
              const list = g.memberIds.map((id) => personById(people, id)!).filter(Boolean);
              const Icon = groupIcons[g.type];
              const cur = g.currency || "USD";

              return (
                <div key={g.id}>
                  <Link to={`/groups/${g.id}`} className="block relative">
                    <div className="absolute -top-1 -right-1 z-10 flex gap-1">
                      {g.status === "closed" && (
                        <div className="bg-ink-soft text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-surface">
                          Closed
                        </div>
                      )}
                      {g.id === currentTripId && g.status !== "closed" && (
                        <div className="bg-brand text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-brand/30 border-2 border-surface animate-pulse">
                          Active trip
                        </div>
                      )}
                    </div>
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
                            <p className="text-[11px] font-semibold text-ink-soft mt-0.5">
                              {g.type} · Total {fmt(total, cur)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn("text-lg font-black tabular-nums", mine > 0.01 ? "text-success" : mine < -0.01 ? "text-destructive" : "text-ink-soft")}>
                            {mine > 0.01 ? "+" : ""}{fmt(mine, cur)}
                          </p>
                          <p className="text-[10px] font-bold text-ink-soft opacity-60">
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
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-md" onClick={() => { setShowCreate(false); closeModal(); }} />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="relative w-full max-w-xl bg-surface rounded-t-[3rem] shadow-float overflow-hidden flex flex-col max-h-[95vh] border-t border-hairline"
          >
            <div className="px-6 pt-5 pb-4 bg-surface border-b border-hairline/30 shrink-0">
              <div className="w-10 h-1 bg-hairline/80 rounded-full mx-auto mb-4" />
              <div className="text-center relative">
                <h2 className="text-xl font-black tracking-tightest text-ink">Launch group</h2>
                <p className="text-[10px] text-ink-soft mt-0.5">Ready for the next adventure</p>
                <button
                  onClick={() => { setShowCreate(false); closeModal(); }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 size-8 rounded-full bg-surface-soft flex items-center justify-center hover:bg-hairline transition-colors"
                >
                  <X className="size-4 text-ink" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-hide">
              <section className="space-y-2">
                <h3 className="text-[9px] font-black text-ink-soft tracking-widest ml-2">Identity</h3>
                <div className="space-y-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Group name"
                    className="w-full bg-surface-soft rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand transition-all placeholder:text-ink-soft/40"
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full bg-surface-soft rounded-2xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-brand transition-all placeholder:text-ink-soft/40 resize-none"
                  />
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-[9px] font-black text-ink-soft tracking-widest ml-2">Duration (optional)</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-ink-soft ml-2 uppercase">Start</p>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-surface-soft rounded-xl px-3 py-2.5 text-xs font-bold outline-none border border-hairline/30 focus:border-brand transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-ink-soft ml-2 uppercase">Expiry</p>
                    <input 
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-surface-soft rounded-xl px-3 py-2.5 text-xs font-bold outline-none border border-hairline/30 focus:border-brand transition-all"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-[9px] font-black text-ink-soft tracking-widest ml-2">Group type</h3>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((t) => {
                    const Icon = groupIcons[t];
                    const selected = type === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={cn(
                          "rounded-2xl py-3 px-1 flex flex-col items-center gap-1.5 transition-all border-2",
                          selected ? "bg-brand border-brand text-white shadow-md shadow-brand/20" : "bg-surface-soft border-transparent text-ink-soft"
                        )}
                      >
                        <Icon className={cn("size-5", selected ? "text-white" : "text-ink-soft")} strokeWidth={2.5} />
                        <span className="text-[9px] font-black tracking-tightest">{t}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-[9px] font-black text-ink-soft tracking-widest ml-2">Currency</h3>
                <CustomSelect
                  value={groupCurrency}
                  onChange={setGroupCurrency}
                  options={ALL_CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
                  variant="surface"
                  className="w-full"
                />
              </section>

              <section className="space-y-2 pb-4">
                <h3 className="text-[9px] font-black text-ink-soft tracking-widest ml-2">Invite friends</h3>
                <div className="space-y-2">
                  {friends.length === 0 ? (
                    <div className="text-center py-4 bg-surface-soft/30 rounded-2xl border border-dashed border-hairline/50">
                      <p className="text-xs text-ink-soft">No friends yet. Add them in Friends tab!</p>
                    </div>
                  ) : (
                    friends.map((p) => p && (
                      <button
                        key={p.id}
                        onClick={() => setMembers((m) => m.includes(p.id) ? m.filter((x) => x !== p.id) : [...m, p.id])}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-2xl transition-all border-2",
                          members.includes(p.id) ? "bg-brand/5 border-brand/20" : "bg-surface-soft border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <PersonAvatar person={p} size="sm" />
                          <div className="text-left">
                            <p className="text-sm font-bold text-ink truncate">{p.name}</p>
                            <p className="text-[9px] font-bold text-ink-soft tracking-wider">{p.username}</p>
                          </div>
                        </div>
                        <div className={cn(
                          "size-6 rounded-full border-2 flex items-center justify-center transition-all",
                          members.includes(p.id) ? "bg-brand border-brand text-white" : "border-hairline bg-surface"
                        )}>
                          {members.includes(p.id) && <Check className="size-3.5" strokeWidth={3} />}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="px-5 py-4 bg-surface border-t border-hairline/30 shrink-0">
              <button
                onClick={create}
                disabled={isCreating}
                className="w-full bg-brand text-brand-foreground py-4 rounded-2xl font-black text-sm shadow-lg shadow-brand/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isCreating ? "Launching..." : "Launch group"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showScanner && (
        <QRScanner 
          onClose={() => setShowScanner(false)}
          onScan={async (data) => {
            if (data.startsWith("split://group/")) {
              const gid = data.replace("split://group/", "");
              setShowScanner(false);
              
              // Check if user is already a member
              const isMember = groups.some(g => g.id === gid);
              
              if (isMember) {
                navigate(`/groups/${gid}`);
                toast.success("Opening group...");
              } else {
                // Try to join the group
                try {
                  const groupRef = doc(db, "groups", gid);
                  const snap = await getDoc(groupRef);
                  
                  if (snap.exists()) {
                    const groupData = snap.data();
                    const currentMembers = groupData.memberIds || [];
                    if (!userId) throw new Error("Not logged in");
                    
                    if (!currentMembers.includes(userId)) {
                      await updateDoc(groupRef, {
                        memberIds: [...currentMembers, userId]
                      });
                    }
                    navigate(`/groups/${gid}`);
                    toast.success(`Joined ${groupData.name}!`);
                  } else {
                    toast.error("Group not found");
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to join group");
                }
              }
            } else {
              toast.error("Invalid Group QR");
            }
          }}
          title="Scan Group QR"
        />
      )}
    </>
  );
}
