import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { PersonAvatar } from "@/components/Avatar";
import { QRCode } from "@/components/QRCode";
import { useStore, personById } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Send, Camera, Check, X, UserPlus, QrCode, Loader2, Users, Search } from "lucide-react";

type Tab = "friends" | "requests";

export default function Friends() {
  const { friendIds, requests, outgoing, people, sendRequest, withdrawRequest, acceptRequest, declineRequest, removeFriend, userId, profile, searchUsers, markRequestsAsSeen } = useStore();
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<{ username: string; displayName: string; avatar: string; uid: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "requests") {
      markRequestsAsSeen();
    }
  }, [activeTab, markRequestsAsSeen]);

  const friends = useMemo(
    () => friendIds.map((id) => (id ? personById(people, id) : null)).filter(Boolean) as ReturnType<typeof personById>[],
    [friendIds, people],
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (q.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchUsers(q);
          setSearchResults(results);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [q, searchUsers]);

  const handleSend = async (username: string, display: string, avatar?: string) => {
    setProcessingId(username);
    try {
      await sendRequest(username, { displayName: display, avatar });
    } finally {
      setProcessingId(null);
    }
  };

  const handleWithdraw = async (username: string) => {
    setProcessingId(username);
    try {
      await withdrawRequest(username);
    } finally {
      setProcessingId(null);
    }
  };

  const simulateScan = () => {
    setShowScanner(false);
    handleSend("@scanned-user", "Scanned User");
  };

  return (
    <div>
      <PageHeader title="Friends" subtitle="Connect & split together" showActions={false} />

      <div className="px-5 space-y-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="size-4 text-ink-soft absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by @username"
              className="w-full bg-surface-soft border border-hairline rounded-full pl-11 pr-4 py-3 text-sm text-ink placeholder:text-ink-soft outline-none shadow-soft focus:ring-2 focus:ring-brand transition-all"
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            aria-label="Scan QR code"
            className="size-12 rounded-full bg-ink text-background flex items-center justify-center shrink-0 active:scale-95 transition"
          >
            <Camera className="size-5" strokeWidth={2.25} />
          </button>
          <button
            onClick={() => setShowQR(true)}
            aria-label="My QR code"
            className="size-12 rounded-full bg-surface shadow-soft text-ink flex items-center justify-center shrink-0 active:scale-95 transition"
          >
            <QrCode className="size-5" strokeWidth={2.25} />
          </button>
        </div>

        {q.trim() && (
          <SurfaceCard padding="md" className="border-brand/20 bg-brand/5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-brand uppercase tracking-wider">Search Results</p>
              {isSearching && <Loader2 className="size-3 animate-spin text-brand" />}
            </div>
            {searchResults.length === 0 && !isSearching ? (
              <p className="text-sm text-ink-soft text-center py-3">No users found.</p>
            ) : (
              <ul className="space-y-3">
                {searchResults.map((r) => {
                  const out = outgoing.find(o => (typeof o === 'string' ? o : o.username) === r.username);
                  const isAlreadyFriend = friendIds.includes(r.uid);
                  const sent = !!out;
                  const isProcessing = processingId === r.username;

                  if (r.username === profile?.username) return null;

                  return (
                    <li key={r.username} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-full overflow-hidden border border-hairline bg-white shrink-0 shadow-sm">
                          {r.avatar ? (
                            <img src={r.avatar} alt="" className="size-full object-cover" />
                          ) : (
                            <div className="size-full flex items-center justify-center font-bold text-sm text-brand">
                              {r.displayName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{r.displayName}</p>
                          <p className="text-[11px] text-ink-soft">{r.username}</p>
                        </div>
                      </div>
                      {isAlreadyFriend ? (
                        <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-full uppercase">Friends</span>
                      ) : (
                        <button
                          disabled={isProcessing}
                          onClick={() => {
                            if (sent) handleWithdraw(r.username);
                            else handleSend(r.username, r.displayName, r.avatar);
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95",
                            sent ? "bg-surface-soft text-ink-soft border border-hairline shadow-sm hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20" : "bg-brand text-brand-foreground shadow-brand hover:opacity-90",
                            isProcessing && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isProcessing ? <Loader2 className="size-3 animate-spin" /> : null}
                          {sent ? "Requested" : (<><UserPlus className="size-3.5" strokeWidth={2.5} /> Add</>)}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </SurfaceCard>
        )}

        <div className="flex bg-surface-soft p-1 rounded-xl shadow-inner border border-hairline">
          <button
            onClick={() => setActiveTab("friends")}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === "friends" ? "bg-white text-ink shadow-sm ring-1 ring-hairline" : "text-ink-soft"
            )}
          >
            <Users className="size-3.5" /> Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 relative",
              activeTab === "requests" ? "bg-white text-ink shadow-sm ring-1 ring-hairline" : "text-ink-soft"
            )}
          >
            <div className="relative">
              <Send className="size-3.5 -rotate-12" />
              {requests.length > 0 && activeTab !== "requests" && (
                <span className="absolute -top-1 -right-1 size-2 bg-destructive rounded-full" />
              )}
            </div>
            Requests ({requests.length + outgoing.length})
          </button>
        </div>

        {activeTab === "friends" ? (
          <div>
            {friends.length === 0 ? (
              <SurfaceCard padding="lg" className="text-center py-12">
                <Users className="size-8 text-ink-soft mx-auto mb-3 opacity-20" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-ink">No friends yet</p>
                <p className="text-[11px] text-ink-soft mt-1">Search above to add people you know.</p>
              </SurfaceCard>
            ) : (
              <SurfaceCard padding="md">
                <ul className="divide-y divide-hairline">
                  {friends.map((p) => p && (
                    <li key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <PersonAvatar person={p} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink truncate">{p.name}</p>
                          <p className="text-[11px] text-ink-soft truncate">{p.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { removeFriend(p.id); }}
                        className="text-[11px] font-bold text-ink-soft hover:text-destructive px-3 py-1 rounded-full hover:bg-destructive/5 transition-colors"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Incoming Requests */}
            <div>
              <h3 className="text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-2 px-1">Incoming Requests</h3>
              {requests.length === 0 ? (
                <SurfaceCard padding="md" className="text-center py-6 opacity-60">
                  <p className="text-xs text-ink-soft font-medium">No pending incoming requests</p>
                </SurfaceCard>
              ) : (
                <SurfaceCard padding="md">
                  <ul className="divide-y divide-hairline">
                    {requests.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-10 rounded-full overflow-hidden border border-hairline bg-surface-soft shrink-0">
                            {r.fromAvatar ? (
                              <img src={r.fromAvatar} alt="" className="size-full object-cover" />
                            ) : (
                              <div className="size-full flex items-center justify-center font-bold text-sm text-brand">
                                {r.fromName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-ink truncate">{r.fromName}</p>
                            <p className="text-[11px] text-ink-soft">{r.fromUsername}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            disabled={processingId === r.id}
                            onClick={async () => {
                              setProcessingId(r.id);
                              try { await acceptRequest(r.id); } finally { setProcessingId(null); }
                            }}
                            className="size-9 rounded-full bg-brand text-brand-foreground flex items-center justify-center active:scale-95 transition-all shadow-brand disabled:opacity-50"
                            aria-label="Accept"
                          >
                            {processingId === r.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={3} />}
                          </button>
                          <button
                            disabled={processingId === r.id}
                            onClick={async () => {
                              setProcessingId(r.id);
                              try { await declineRequest(r.id); } finally { setProcessingId(null); }
                            }}
                            className="size-9 rounded-full bg-surface-soft text-ink flex items-center justify-center active:scale-95 transition-all border border-hairline disabled:opacity-50"
                            aria-label="Decline"
                          >
                            <X className="size-4" strokeWidth={3} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </SurfaceCard>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h3 className="text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-2 px-1">Sent Requests</h3>
              {outgoing.length === 0 ? (
                <SurfaceCard padding="md" className="text-center py-6 opacity-60">
                  <p className="text-xs text-ink-soft font-medium">No pending sent requests</p>
                </SurfaceCard>
              ) : (
                <SurfaceCard padding="md">
                  <ul className="divide-y divide-hairline">
                    {outgoing.map((o) => {
                      const username = typeof o === 'string' ? o : o.username;
                      const displayName = typeof o === 'string' ? o : o.displayName;
                      const avatar = typeof o === 'string' ? undefined : o.avatar;
                      const isProcessing = processingId === username;

                      return (
                        <li key={username} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-full bg-surface-soft border border-hairline overflow-hidden flex items-center justify-center shadow-sm">
                              {avatar ? (
                                <img src={avatar} alt="" className="size-full object-cover" />
                              ) : (
                                <div className="size-full flex items-center justify-center text-[10px] font-bold text-brand bg-brand/5">
                                  {(displayName || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-ink truncate">{displayName}</p>
                              <p className="text-[11px] text-ink-soft truncate">{username}</p>
                            </div>
                          </div>
                          <button
                            disabled={isProcessing}
                            onClick={() => { handleWithdraw(username); }}
                            className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-surface-soft text-ink-soft border border-hairline whitespace-nowrap active:scale-95 transition-all hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20 disabled:opacity-50 flex items-center gap-1"
                          >
                            {isProcessing ? <Loader2 className="size-3 animate-spin" /> : null}
                            Requested
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </SurfaceCard>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        {showQR && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center">
            <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-xl bg-surface rounded-t-[2.5rem] p-8 pb-12 shadow-float space-y-6 overflow-hidden border-t border-hairline text-center">
              <div className="w-12 h-1.5 bg-hairline rounded-full mx-auto mb-2 opacity-50" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tightest text-ink">My Code</h2>
                  <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider mt-1">Scan to connect instantly</p>
                </div>
                <button
                  onClick={() => setShowQR(false)}
                  className="size-10 rounded-full bg-surface-soft flex items-center justify-center hover:bg-hairline transition-colors"
                >
                  <X className="size-5 text-ink" />
                </button>
              </div>
              <div className="flex justify-center py-6 bg-white rounded-3xl shadow-soft border border-hairline">
                <QRCode value={`split://user/${userId}`} size={240} label={`@${profile?.username || "you"}`} />
              </div>
              <div className="p-4 bg-brand/5 rounded-2xl border border-brand/10">
                <p className="text-sm font-bold text-brand">Your unique link is ready</p>
                <p className="text-[11px] text-brand/60 mt-0.5">Show this to friends to skip the search</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        {showScanner && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center">
            <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-xl bg-surface rounded-t-[2.5rem] p-8 pb-12 shadow-float space-y-6 overflow-hidden border-t border-hairline">
              <div className="w-12 h-1.5 bg-hairline rounded-full mx-auto mb-2 opacity-50" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tightest text-ink">Scanner</h2>
                  <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider mt-1">Find friends via QR</p>
                </div>
                <button
                  onClick={() => setShowScanner(false)}
                  className="size-10 rounded-full bg-surface-soft flex items-center justify-center hover:bg-hairline transition-colors"
                >
                  <X className="size-5 text-ink" />
                </button>
              </div>
              <div className="aspect-square rounded-[2rem] bg-ink/95 relative overflow-hidden flex items-center justify-center shadow-xl border-4 border-surface-soft">
                <div className="absolute inset-10 border-2 border-brand rounded-3xl opacity-50" />
                <div className="absolute left-8 right-8 top-1/4 h-1 bg-brand shadow-[0_0_15px_rgba(var(--brand),0.5)] z-10" />
                <Camera className="size-20 text-white/10" strokeWidth={1} />
              </div>
              <button
                onClick={simulateScan}
                className="w-full bg-brand text-brand-foreground py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-brand hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Scan Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
