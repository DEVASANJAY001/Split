import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { PersonAvatar } from "@/components/Avatar";
import { useStore } from "@/lib/store";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserPlus, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sendRequest, friendIds, outgoing, profile: myProfile, userId: myId } = useStore();
  
  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (!id) return;
      setLoading(true);
      try {
        const userSnap = await getDoc(doc(db, "users", id));
        if (userSnap.exists()) {
          setTargetUser({ ...userSnap.data(), uid: id });
        } else {
          toast.error("User not found");
        }
      } catch (err: any) {
        console.error("Error fetching user:", err);
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [id]);

  console.log("UserDetail rendering for ID:", id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-5 text-center">
        <p className="text-ink-soft font-medium mb-4">User profile not found.</p>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brand font-bold"
        >
          <ArrowLeft className="size-4" /> Go Back
        </button>
      </div>
    );
  }

  const isAlreadyFriend = friendIds.includes(id!);
  const isMe = myId === id;
  const requestSent = outgoing.some(o => o.username === targetUser.username || o.targetUid === id);

  const handleAddFriend = async () => {
    if (!targetUser.username) return;
    setSending(true);
    try {
      await sendRequest(targetUser.username, { 
        displayName: targetUser.displayName, 
        avatar: targetUser.avatar 
      });
      toast.success("Friend request sent!");
    } catch (err) {
      // Error handled in store
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="User Profile" 
        subtitle="Connect with others" 
        showActions={false} 
        showBack 
      />

      <div className="px-5 space-y-6">
        <SurfaceCard padding="xl" className="flex flex-col items-center text-center gap-5">
          <PersonAvatar 
            person={{ 
              id: id!, 
              name: targetUser.displayName || targetUser.username, 
              avatar: targetUser.avatar,
              initials: (targetUser.displayName || targetUser.username || "U").slice(0, 2).toUpperCase(),
              email: targetUser.email || ""
            }} 
            size="xl" 
            ring 
          />
          
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-ink tracking-tightest leading-none">
              {targetUser.displayName}
            </h2>
            <p className="text-sm font-bold text-brand uppercase tracking-wider">
              {targetUser.username}
            </p>
          </div>

          <div className="w-full pt-4 border-t border-hairline">
            {isMe ? (
              <button
                onClick={() => navigate("/profile")}
                className="w-full bg-surface-soft text-ink py-4 rounded-2xl font-bold active:scale-95 transition-all"
              >
                This is you
              </button>
            ) : isAlreadyFriend ? (
              <div className="flex items-center justify-center gap-2 text-success font-bold py-4">
                <CheckCircle2 className="size-5" />
                You are friends
              </div>
            ) : (
              <button
                disabled={sending || requestSent}
                onClick={handleAddFriend}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg",
                  requestSent 
                    ? "bg-surface-soft text-ink-soft cursor-default" 
                    : "bg-brand text-brand-foreground shadow-brand hover:opacity-90"
                )}
              >
                {sending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : requestSent ? (
                  "Request Sent"
                ) : (
                  <>
                    <UserPlus className="size-5" strokeWidth={2.5} />
                    Add Friend
                  </>
                )}
              </button>
            )}
          </div>
        </SurfaceCard>

        <p className="text-[11px] text-ink-soft text-center px-8">
          Adding friends allows you to split bills, track expenses, and settle debts easily.
        </p>
      </div>
    </div>
  );
}
