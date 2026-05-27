import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { User, AtSign, Camera, Check, Loader2, CheckCircle2, AlertCircle, ChevronDown, LogOut, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ALL_CURRENCIES } from "@/lib/currency-data";
import { auth } from "@/lib/firebase";
import ImageCropper from "@/components/ImageCropper";

export default function ProfileSetup() {
    const { profile, updateProfile, uploadAvatar, loading, isUsernameAvailable, theme, setTheme } = useStore();
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [saving, setSaving] = useState(false);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<"idle" | "available" | "taken">("idle");
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    // Cropper state
    const [cropperOpen, setCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (profile && profile.completedSetup) {
            navigate("/", { replace: true });
        }
    }, [profile, navigate]);

    useEffect(() => {
        if (profile && isInitialLoad) {
            setDisplayName(profile.displayName || auth.currentUser?.displayName || "");
            setUsername(profile.username || "");
            setCurrency(profile.currency || "USD");
            setIsInitialLoad(false);
        } else if (!profile && isInitialLoad && auth.currentUser) {
            setDisplayName(auth.currentUser.displayName || "");
            setIsInitialLoad(false);
        }
    }, [profile, isInitialLoad]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
            setSaving(true);
            const url = await uploadAvatar(file);
            await updateProfile({ avatar: url });
            toast.success("Photo updated");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
            setImageToCrop(null);
        }
    };

    useEffect(() => {
        const finalUsername = username.startsWith("@") ? username : `@${username}`;
        if (finalUsername.length < 4 || finalUsername === profile?.username) {
            setUsernameStatus("idle");
            return;
        }

        const delay = setTimeout(async () => {
            setIsCheckingUsername(true);
            try {
                const available = await isUsernameAvailable(finalUsername);
                setUsernameStatus(available ? "available" : "taken");
            } catch (error: any) {
                console.error("Username check failed:", error);
                setUsernameStatus("idle");
            } finally {
                setIsCheckingUsername(false);
            }
        }, 500);

        return () => clearTimeout(delay);
    }, [username, profile?.username, isUsernameAvailable]);


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalUsername = username.startsWith("@") ? username : `@${username}`;
        if (usernameStatus === "taken") return;

        setSaving(true);
        try {
            await updateProfile({
                displayName,
                username: finalUsername,
                currency,
                email: auth.currentUser?.email || "",
                avatar: profile?.avatar || auth.currentUser?.photoURL || "",
                isVerified: true,
                completedSetup: true,
            });
            navigate("/");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background px-5 pt-12 pb-24">
            <div className="max-w-sm mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tightest text-ink">Complete Profile</h1>
                    <p className="text-ink-soft">Make it yours</p>
                </div>

                <div className="flex justify-center">
                    <div className="relative group">
                        <div className="size-24 rounded-full overflow-hidden border-2 border-brand/20 bg-surface-soft shadow-soft flex items-center justify-center">
                            <img
                                src={profile?.avatar || auth.currentUser?.photoURL || ""}
                                alt=""
                                referrerPolicy="no-referrer"
                                className={cn("size-full object-cover", !(profile?.avatar || auth.currentUser?.photoURL) && "hidden")}
                                key={profile?.avatar || auth.currentUser?.photoURL}
                            />
                            {!(profile?.avatar || auth.currentUser?.photoURL) && (
                                <div className="size-full flex items-center justify-center bg-brand-soft text-brand text-2xl font-bold uppercase transition-all duration-300">
                                    {(displayName || auth.currentUser?.displayName || "U").split(" ").map(x => x[0]).join("").slice(0, 2)}
                                </div>
                            )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                            {saving ? (
                                <Loader2 className="size-6 text-white animate-spin" />
                            ) : (
                                <Camera className="size-6 text-white" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                </div>

                <ImageCropper
                    image={imageToCrop}
                    open={cropperOpen}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setCropperOpen(false);
                        setImageToCrop(null);
                    }}
                />

                <form onSubmit={handleSave} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-ink-soft ml-1">Display Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                            <input
                                type="text"
                                placeholder="Ex. John Doe"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-surface-soft border border-hairline rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-brand transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-ink-soft ml-1 flex justify-between">
                            Username
                            {isCheckingUsername && <Loader2 className="size-3 animate-spin text-brand" />}
                        </label>
                        <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                            <input
                                type="text"
                                placeholder="username"
                                value={username.replace("@", "")}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setUsernameStatus("idle");
                                }}
                                className={cn(
                                    "w-full bg-surface-soft border rounded-2xl py-3 pl-10 pr-10 outline-none transition-all",
                                    usernameStatus === "available" ? "border-success/50 ring-4 ring-success/5" :
                                        usernameStatus === "taken" ? "border-destructive/50 ring-4 ring-destructive/5" :
                                            "border-hairline focus:border-brand"
                                )}
                                required
                            />
                            {usernameStatus === "available" && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-success" />}
                            {usernameStatus === "taken" && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive" />}
                        </div>
                        {usernameStatus === "taken" && <p className="text-[10px] text-destructive font-bold ml-1">Username already taken</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-ink-soft ml-1">Default Currency</label>
                        <div className="relative">
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full bg-surface-soft border border-hairline rounded-2xl py-4 px-4 text-sm font-bold text-ink outline-none focus:border-brand appearance-none"
                            >
                                {ALL_CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} ({c.symbol}) - {c.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-soft">
                                <ChevronDown className="size-4" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-ink-soft ml-1">App Theme</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setTheme("light")}
                                className={cn(
                                    "rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 border-2 transition-all font-bold text-sm outline-none",
                                    theme === "light" ? "bg-surface border-brand text-ink shadow-md shadow-brand/10" : "bg-surface-soft border-transparent text-ink-soft hover:bg-surface-soft/80"
                                )}
                            >
                                <Sun className="size-4" /> Light
                            </button>
                            <button
                                type="button"
                                onClick={() => setTheme("dark")}
                                className={cn(
                                    "rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 border-2 transition-all font-bold text-sm outline-none",
                                    theme === "dark" ? "bg-surface border-brand text-ink dark:text-white shadow-md shadow-brand/10" : "bg-surface-soft border-transparent text-ink-soft hover:bg-surface-soft/80"
                                )}
                            >
                                <Moon className="size-4" /> Dark
                            </button>
                        </div>
                    </div>

                    <button
                        disabled={saving || isCheckingUsername || usernameStatus === "taken"}
                        className="w-full bg-ink text-background rounded-2xl py-4 font-bold shadow-soft hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <><Check className="size-5" /> Start Splitting</>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            auth.signOut();
                            navigate("/login");
                        }}
                        className="w-full bg-transparent text-ink-soft hover:text-destructive rounded-2xl py-2 font-bold transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        <LogOut className="size-4" /> Log Out
                    </button>
                </form>
            </div>
        </div>
    );
}
