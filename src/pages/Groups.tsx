import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { AvatarStack, PersonAvatar } from "@/components/Avatar";
import { useStore, netBalances, personById, GroupType } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { groupIcons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { toast } from "sonner";

const TYPES: GroupType[] = ["Trip", "Roommates", "Couple", "Friends", "Office", "Other"];

export default function Groups() {
  const { groups, expenses, settlements, people, friendIds, addGroup, userId, profile } = useStore();
  const cur = profile?.currency || "USD";
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<GroupType>("Trip");
  const [members, setMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreate(true);
      // Clean up the URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Initialize members with userId when it becomes available
  useMemo(() => {
    if (userId && members.length === 0) {
      setMembers([userId]);
    }
  }, [userId]);

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
      const total = expenses.filter((e) => e.groupId === g.id).reduce((a, e) => a + e.amount, 0);
      return { g, mine: net[userId || ""] ?? 0, total };
    });
  }, [groups, expenses, settlements, userId]);

  const create = () => {
    if (!name.trim()) return toast.error("Name required");
    if (members.length < 2) return toast.error("Add at least one friend");
    addGroup({ name: name.trim(), description: "", type, memberIds: members, currency: profile?.currency || "USD" });
    toast.success("Group created");
    setShowCreate(false);
    setName(""); setMembers(userId ? [userId] : []); setType("Trip");
  };

  return (
    <div>
      <PageHeader title="Groups" subtitle="Your shared ledgers" onAdd={() => setShowCreate(true)} />

      <div className="px-5 space-y-3">
        {summaries.map(({ g, mine, total }) => {
          const list = g.memberIds.map((id) => personById(people, id)!).filter(Boolean);
          const Icon = groupIcons[g.type];
          return (
            <Link key={g.id} to={`/groups/${g.id}`} className="block">
              <SurfaceCard padding="lg" className="hover:shadow-card transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 rounded-2xl bg-brand-soft text-brand-soft-foreground flex items-center justify-center shrink-0">
                      <Icon className="size-6" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base text-ink truncate">{g.name}</p>
                      <p className="text-[11px] text-ink-soft">{g.type} · total {fmt(total, cur)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-bold tabular-nums", mine > 0.01 ? "text-success" : mine < -0.01 ? "text-destructive" : "text-ink-soft")}>
                      {mine > 0.01 ? "+" : ""}{fmt(mine, cur)}
                    </p>
                    <p className="text-[10px] text-ink-soft">{mine > 0.01 ? "you get" : mine < -0.01 ? "you owe" : "settled"}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <AvatarStack people={list} max={6} size="sm" />
                </div>
              </SurfaceCard>
            </Link>
          );
        })}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end md:items-center justify-center p-0 md:p-6" onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full md:max-w-md bg-surface rounded-t-3xl md:rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-auto animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tightest text-ink">New group</h2>
              <button onClick={() => setShowCreate(false)} className="size-8 rounded-full bg-surface-soft flex items-center justify-center">
                <X className="size-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-soft">Group name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bali Trip"
                className="mt-1 w-full bg-surface-soft rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-soft">Type</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {TYPES.map((t) => {
                  const Icon = groupIcons[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={cn(
                        "rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 text-[11px] font-semibold transition-all",
                        type === t ? "bg-brand text-brand-foreground" : "bg-surface-soft text-ink",
                      )}
                    >
                      <Icon className="size-5" strokeWidth={2} />
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-ink-soft">Add members from your friends</label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search friends..."
                  className="w-full bg-surface-soft rounded-2xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {friends.length === 0 ? (
                <p className="text-xs text-ink-soft py-3 text-center bg-surface-soft rounded-2xl">
                  Add friends first from the Friends tab.
                </p>
              ) : filteredFriends.length === 0 ? (
                <p className="text-xs text-ink-soft py-3 text-center bg-surface-soft rounded-2xl">
                  No friends found matching "{searchQuery}"
                </p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-auto pr-1 custom-scrollbar">
                  {filteredFriends.map((p) => p && (
                    <li key={p.id}>
                      <button
                        onClick={() =>
                          setMembers((m) => m.includes(p.id) ? m.filter((x) => x !== p.id) : [...m, p.id])
                        }
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-2xl transition-all",
                          members.includes(p.id) ? "bg-brand-soft" : "bg-surface-soft",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <PersonAvatar person={p} size="sm" />
                          <span className="text-sm font-semibold text-ink truncate">{p.name}</span>
                        </div>
                        <div className={cn(
                          "size-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition",
                          members.includes(p.id) ? "bg-brand border-brand text-brand-foreground" : "border-hairline",
                        )}>
                          {members.includes(p.id) && "✓"}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={create}
              className="w-full bg-brand text-brand-foreground py-4 rounded-full font-semibold text-sm shadow-brand hover:opacity-90 active:scale-[0.98] transition"
            >
              Create group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
