import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { PersonAvatar } from "@/components/Avatar";
import { QRCode } from "@/components/QRCode";
import { useStore } from "@/lib/store";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { fmt } from "@/lib/finance";
import { Settings, QrCode, X, Pencil, Users, Receipt, Camera, Loader2, CheckCircle2, AlertCircle, Edit2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ImageCropper from "@/components/ImageCropper";

const currencies = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "INR", symbol: "₹" },
  { code: "GBP", symbol: "£" },
];

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile, updateProfile, uploadAvatar, friendIds, groups, expenses, personal, userId, isUsernameAvailable, loading } = useStore();
  const [showQR, setShowQR] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "available" | "taken">("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState(profile || { displayName: "", username: "", email: "", avatar: "", currency: "USD" });
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    // Only update draft from profile if NOT editing
    if (profile && !editing) {
      setDraft(profile);
    }
  }, [profile, editing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("File size must be less than 5MB");
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
    
    try {
      setUploading(true);
      const url = await uploadAvatar(file);
      await updateProfile({ avatar: url });
      toast.success("Avatar updated");
    } catch (err: any) {
      toast.error("Failed to upload: " + err.message);
    } finally {
      setUploading(false);
      setImageToCrop(null);
    }
  };

  // Debounced username check
  useEffect(() => {
    if (!editing || draft.username === profile?.username) {
      setUsernameStatus("idle");
      return;
    }

    const delay = setTimeout(async () => {
      if (draft.username.length < 3) return;
      setIsCheckingUsername(true);
      try {
        const available = await isUsernameAvailable(draft.username);
        setUsernameStatus(available ? "available" : "taken");
      } catch (error: any) {
        console.error("Username check failed:", error);
        setUsernameStatus("idle");
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [draft.username, editing, profile?.username, isUsernameAvailable]);

  if (loading || (!profile && userId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    // Removed loading and success toasts per user request
    try {
      const url = await uploadAvatar(file);
      setDraft({ ...draft, avatar: url });
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const totalShared = expenses.reduce((a, e) => a + e.amount, 0);
  const totalPersonal = personal.reduce((a, e) => a + e.amount, 0);

  const save = async () => {
    if (usernameStatus === "taken") return;

    try {
      await updateProfile(draft as any);
      setEditing(false);
      // Removed "Profile saved" toast per user request
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account" showActions={false} showBack />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="px-5 space-y-4">
        <div className="bg-brand rounded-[32px] p-8 relative overflow-hidden shadow-brand shadow-lg">
          <div className="flex flex-col items-center text-center gap-4 relative z-10">
            <div className="relative group">
              <div className="size-24 rounded-full border-4 border-white/20 shadow-xl overflow-hidden relative bg-white/10 backdrop-blur-md">
                <img 
                  key={profile.avatar} 
                  src={profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.displayName || "User"}`} 
                  alt="" 
                  className={cn("size-full object-cover transition-opacity", uploading && "opacity-40")} 
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Loader2 className="size-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 size-9 rounded-full bg-white shadow-xl flex items-center justify-center text-brand hover:scale-110 transition-all active:scale-90 border-2 border-brand"
              >
                <Camera className="size-4" strokeWidth={3} />
              </button>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tightest leading-none">{profile.displayName}</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md border border-white/10">
                  {profile.username}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setDraft(profile);
                setEditing(true);
              }}
              className="mt-2 bg-white/10 hover:bg-white/20 text-white/90 px-6 py-2 rounded-full text-xs font-bold border border-white/10 backdrop-blur-md transition-all active:scale-95"
            >
              Edit Profile
            </button>
          </div>

          {/* Decorative background elements */}
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 size-40 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SurfaceCard padding="md" className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-lg font-black text-ink leading-none">{friendIds.length}</p>
              <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider mt-1">Friends</p>
            </div>
          </SurfaceCard>
          
          <SurfaceCard padding="md" className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-lg font-black text-ink leading-none">{groups.length}</p>
              <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider mt-1">Groups</p>
            </div>
          </SurfaceCard>

          <SurfaceCard padding="md" className="flex items-center gap-3 border-emerald-500/10">
            <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Receipt className="size-5" />
            </div>
            <div>
              <p className="text-lg font-black text-ink leading-none tabular-nums">{personal.length}</p>
              <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider mt-1">Personal</p>
            </div>
          </SurfaceCard>

          <SurfaceCard padding="md" className="flex items-center gap-3 border-brand/10">
            <div className="size-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Receipt className="size-5" />
            </div>
            <div>
              <p className="text-lg font-black text-ink leading-none tabular-nums">{expenses.length}</p>
              <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider mt-1">Shared</p>
            </div>
          </SurfaceCard>
        </div>

        <button
          onClick={() => setShowQR(true)}
          className="w-full"
        >
          <SurfaceCard padding="md" className="flex items-center justify-between hover:shadow-card transition-shadow text-left">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-brand-soft text-brand-soft-foreground flex items-center justify-center">
                <QrCode className="size-5" strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">My QR code</p>
                <p className="text-[11px] text-ink-soft">Share to add as friend</p>
              </div>
            </div>
            <span className="text-ink-soft">→</span>
          </SurfaceCard>
        </button>

        <button onClick={() => navigate("/settings")} className="w-full">
          <SurfaceCard padding="md" className="flex items-center justify-between hover:shadow-card transition-shadow text-left">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-surface-soft text-ink flex items-center justify-center">
                <Settings className="size-5" strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Settings</p>
                <p className="text-[11px] text-ink-soft">Currency, theme, export</p>
              </div>
            </div>
            <span className="text-ink-soft">→</span>
          </SurfaceCard>
        </button>

        <SurfaceCard padding="lg">
          <h3 className="text-base font-bold text-ink mb-3">Lifetime activity</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-ink-soft">Group expenses</p>
              <p className="text-lg font-bold tabular-nums text-ink">{fmt(totalShared, profile.currency)}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-soft">Personal expenses</p>
              <p className="text-lg font-bold tabular-nums text-ink">{fmt(totalPersonal, profile.currency)}</p>
            </div>
          </div>
        </SurfaceCard>

        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full bg-surface-soft text-ink py-4 rounded-2xl font-bold hover:bg-surface-soft active:scale-95 transition-all mt-4"
        >
          Sign Out
        </button>
      </div>

      {showQR && (
        <div className="fixed inset-0 z-[70] bg-ink/40 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tightest text-ink">My QR code</h2>
              <button onClick={() => setShowQR(false)} className="size-8 rounded-full bg-surface-soft flex items-center justify-center">
                <X className="size-4" />
              </button>
            </div>
            <p className="text-sm text-ink-soft">Friends scan this to add you instantly.</p>
            <div className="flex justify-center">
              <QRCode value={`split://user/${userId}`} size={220} label={`${profile.username}`} />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://${window.location.host}/user/${userId}`);
                // Removed success toast
              }}
              className="w-full bg-brand/10 text-brand py-3 rounded-xl font-bold hover:bg-brand/20 active:scale-95 transition-all text-sm mt-4"
            >
              Copy profile link
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[70] bg-ink/40 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tightest text-ink">Edit profile</h2>
              <button onClick={() => setEditing(false)} className="size-8 rounded-full bg-surface-soft flex items-center justify-center">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <PersonAvatar person={draft} size="xl" ring />
                <label className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  {uploading ? (
                    <Loader2 className="size-6 text-white animate-spin" />
                  ) : (
                    <Camera className="size-6 text-white" />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              </div>
              <p className="text-[10px] text-ink-soft font-bold uppercase tracking-widest">Change Photo</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-soft ml-1">Display name</label>
                <input
                  value={draft.displayName}
                  onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                  className="mt-1 w-full bg-surface-soft rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-soft ml-1 flex justify-between">
                  Username
                  {isCheckingUsername && <Loader2 className="size-3 animate-spin text-brand" />}
                </label>
                <div className="relative">
                  <input
                    value={draft.username}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft({ ...draft, username: val.startsWith("@") ? val : `@${val}` });
                      setUsernameStatus("idle");
                    }}
                    className={cn(
                      "mt-1 w-full bg-surface-soft rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all",
                      usernameStatus === "available" ? "ring-2 ring-success/30" : usernameStatus === "taken" ? "ring-2 ring-destructive/30" : "focus:ring-2 focus:ring-brand"
                    )}
                  />
                  {usernameStatus === "available" && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-success" />}
                  {usernameStatus === "taken" && <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-destructive" />}
                </div>
                {usernameStatus === "taken" && <p className="text-[10px] text-destructive font-semibold mt-1 ml-1 leading-none animate-in fade-in slide-in-from-top-1">Username already taken</p>}
                {usernameStatus === "available" && <p className="text-[10px] text-success font-semibold mt-1 ml-1 leading-none animate-in fade-in slide-in-from-top-1">Username available</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-soft ml-1 mb-2 block">Default Currency</label>
                <div className="grid grid-cols-4 gap-2">
                  {currencies.map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setDraft({ ...draft, currency: curr.code as any })}
                      className={cn(
                        "py-2.5 rounded-xl border text-sm font-bold transition-all",
                        draft.currency === curr.code
                          ? "bg-brand text-brand-foreground border-brand shadow-brand"
                          : "bg-surface-soft border-hairline text-ink-soft hover:border-brand/40"
                      )}
                    >
                      {curr.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={save}
              disabled={isCheckingUsername || usernameStatus === "taken"}
              className="w-full bg-brand text-brand-foreground py-4 rounded-full font-semibold text-sm shadow-brand active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              Save changes
            </button>
          </div>
        </div >
      )
      }

      <ImageCropper
        image={imageToCrop}
        open={cropperOpen}
        onCropComplete={handleCropComplete}
        onCancel={() => {
          setCropperOpen(false);
          setImageToCrop(null);
        }}
      />

      {confirmLogout && (
        <div className="fixed inset-0 z-[80] bg-ink/40 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setConfirmLogout(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 space-y-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto size-16 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive">
               <LogOut className="size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tightest text-ink">Sign Out?</h2>
              <p className="text-sm text-ink-soft">Are you sure you want to sign out of your account?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setConfirmLogout(false)}
                className="w-full bg-surface-soft text-ink py-3.5 rounded-xl font-bold hover:bg-ink/5 transition-all text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="w-full bg-destructive text-white py-3.5 rounded-xl font-bold shadow-lg shadow-destructive/20 hover:opacity-90 transition-all text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
