import { useMemo, useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { PersonAvatar } from "@/components/Avatar";
import { QRCode } from "@/components/QRCode";
import { useStore, personById } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Send, Camera, Check, X, UserPlus, QrCode, Loader2, Users, Search } from "lucide-react";

import { QRScanner } from "@/components/QRScanner";
import { toast } from "sonner";

type Tab = "friends" | "requests";

export default function Friends() {
  const { 
    friendIds, 
    requests, 
    outgoing, 
    people, 
    sendRequest, 
    withdrawRequest, 
    acceptRequest, 
    declineRequest, 
    removeFriend, 
    userId, 
    profile, 
    searchUsers, 
    markRequestsAsSeen, 
    openModal, 
    closeModal 
  } = useStore();
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

  useEffect(() => {
    if (showQR) openModal();
    else closeModal();
    return () => closeModal();
  }, [showQR, openModal, closeModal]);

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

  const handleSend = async (username: string, display: string, avatar?: string, targetUid?: string) => {
    setProcessingId(username);
    try {
      await sendRequest(username, { displayName: display, avatar, targetUid });
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

  const handleScan = async (data: string) => {
    setShowScanner(false);
    let targetUid = "";
    
    if (data.startsWith("split://user/")) {
      targetUid = data.replace("split://user/", "");
    } else if (data.startsWith("http")) {
      try {
        const url = new URL(data);
        const parts = url.pathname.split("/");
        targetUid = parts[parts.length - 1];
      } catch (e) {
        toast.error("Invalid QR Link");
        return;
      }
    }

    if (targetUid) {
      setIsSearching(true);
      try {
        // Fetch user from people registry
        const userRef = doc(db, "people", targetUid);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
          const userData = snap.data();
          setSearchResults([{
            username: userData.username || userData.email || "user",
            displayName: userData.name || "User",
            avatar: userData.avatar || "",
            uid: targetUid
          }]);
          setQ(""); // Clear search query to show results
          toast.success(`Found ${userData.name}!`);
        } else {
          toast.error("User not found");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch user");
      } finally {
        setIsSearching(false);
      }
    }
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
              className="w-full bg-surface-soft/50 border border-hairline rounded-2xl pl-11 pr-4 py-3 text-sm text-ink placeholder:text-ink-soft/40 outline-none focus:ring-2 focus:ring-brand transition-all"
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            aria-label="Scan QR code"
            className="size-11 rounded-2xl bg-ink text-background flex items-center justify-center shrink-0 active:scale-95 transition"
          >
            <Camera className="size-5" strokeWidth={2.25} />
          </button>
          <button
            onClick={() => setShowQR(true)}
            aria-label="My QR code"
            className="size-11 rounded-2xl bg-surface border border-hairline shadow-soft text-ink flex items-center justify-center shrink-0 active:scale-95 transition"
          >
            <QrCode className="size-5" strokeWidth={2.25} />
          </button>
        </div>

        {(q.trim() || searchResults.length > 0) && (
          <SurfaceCard padding="md" className="border-brand/20 bg-brand/5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-brand tracking-wider">Search results</p>
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
                        <PersonAvatar person={{ displayName: r.displayName, avatar: r.avatar }} size="md" />
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
                            else handleSend(r.username, r.displayName, r.avatar, r.uid);
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
              activeTab === "friends" ? "bg-surface dark:bg-brand text-ink dark:text-white shadow-sm ring-1 ring-hairline" : "text-ink-soft"
            )}
          >
            <Users className="size-3.5" /> Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 relative",
              activeTab === "requests" ? "bg-surface dark:bg-brand text-ink dark:text-white shadow-sm ring-1 ring-hairline" : "text-ink-soft"
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
                          <PersonAvatar person={{ displayName: r.fromName, avatar: r.fromAvatar }} size="md" />
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
                            <PersonAvatar person={{ displayName: displayName || username, avatar }} size="md" />
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
        <div className="fixed inset-0 z-[70] bg-ink/40 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-surface/95 backdrop-blur-xl rounded-3xl p-6 space-y-5 text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-hairline/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-left">
                <h2 className="text-xl font-black text-ink">My code</h2>
                <p className="text-xs font-bold text-brand uppercase tracking-widest">{profile?.username}</p>
              </div>
              <button onClick={() => setShowQR(false)} className="size-10 rounded-full bg-surface-soft flex items-center justify-center shrink-0">
                <X className="size-5" />
              </button>
            </div>
            
            <p className="text-sm text-ink-soft text-left">Scan this QR to add <span className="font-bold text-ink">{profile?.username}</span> instantly on Split.</p>
            
            <div className="flex justify-center py-4">
              <QRCode value={`split://user/${userId}`} size={220} label={`${profile?.username}`} />
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const link = `${window.location.origin}/user/${userId}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Profile link copied!");
                }}
                className="w-full bg-brand text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand/20 hover:opacity-90 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
              >
                <Search className="size-4" />
                Copy profile link
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      <div>
        {showScanner && (
          <QRScanner 
            onClose={() => setShowScanner(false)}
            onScan={handleScan}
            title="Scan Friend QR"
          />
        )}
      </div>
    </div>
  );
}
