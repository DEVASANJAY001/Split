import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, db, rtdb, googleProvider } from "@/lib/firebase";
import { ref, set, get } from "firebase/database";
import EmailVerification from "@/components/Auth/EmailVerification";
import { useStore } from "@/lib/store";
import { sendOTPEmail } from "@/lib/mail";
import { Mail, Lock, UserPlus, User, Eye, EyeOff, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchSignInMethodsForEmail } from "firebase/auth";

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const { userId, profile, loading: authLoading } = useStore();
    const navigate = useNavigate();

    const [step, setStep] = useState<"signup" | "otp">("signup");
    const [userIdState, setUserIdState] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState<"idle" | "available" | "taken">("idle");

    useEffect(() => {
        if (!authLoading && userId) {
            if (profile) {
                if (profile.isVerified) {
                    navigate("/");
                } else if (step === "signup") {
                    setStep("otp");
                    setUserIdState(userId);
                }
            } else {
                // No profile found - likely a new Google user
                navigate("/profile-setup");
            }
        }
    }, [userId, authLoading, navigate, step, profile]);

    // Handle Redirect Result for APK/WebView environments
    useEffect(() => {
        getRedirectResult(auth).catch((error: any) => {
            if (error.code !== "auth/redirect-cancelled-by-user") {
                console.error("Redirect error:", error);
            }
        });
    }, []);
    
    useEffect(() => {
        if (!email || step !== "signup" || !email.includes("@")) {
            setEmailStatus("idle");
            return;
        }

        const delay = setTimeout(async () => {
            setIsCheckingEmail(true);
            try {
                const methods = await fetchSignInMethodsForEmail(auth, email);
                setEmailStatus(methods.length > 0 ? "taken" : "available");
            } catch (err) {
                console.error("Email check error:", err);
            } finally {
                setIsCheckingEmail(false);
            }
        }, 500);

        return () => clearTimeout(delay);
    }, [email, step]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (emailStatus === "taken") return;
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            if (methods.length > 0) {
                toast.error("Email already in use. Please log in.");
                setLoading(false);
                return;
            }

            setStep("otp");

            try {
                await sendOTPEmail(email, name);
                toast.success("Verification code sent!");
            } catch (err: any) {
                console.error("Failed to send verification email:", err);
                toast.error(err.message || "Failed to send verification email");
                setStep("signup"); // Go back if email failed
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (otp: string) => {
        const emailKey = email.replace(/\./g, "_");
        const otpRef = ref(rtdb, `otp_codes/${emailKey}`);
        const snapshot = await get(otpRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.code === otp) {
                if (Date.now() > data.expiresAt) {
                    throw new Error("OTP has expired. Please resend.");
                }
                
                let user;
                try {
                    const authResult = await createUserWithEmailAndPassword(auth, email, password);
                    user = authResult.user;
                } catch (authError: any) {
                    console.error("Auth Creation Error:", authError);
                    if (authError.code === 'auth/email-already-in-use') {
                        setStep("signup");
                        throw new Error("Email already in use. Please log in.");
                    } else if (authError.code === 'auth/weak-password') {
                        setStep("signup");
                        throw new Error("Password is too weak. Must be at least 6 characters.");
                    } else if (authError.code === 'auth/invalid-email') {
                        setStep("signup");
                        throw new Error("Invalid email format.");
                    } else {
                        setStep("signup");
                        throw new Error(authError.message || "Failed to create account in Firebase.");
                    }
                }
                
                // Use Firestore for user profile consistency
                const { setDoc, doc } = await import("firebase/firestore");
                await setDoc(doc(db, "users", user.uid), {
                    username: `@${name.toLowerCase().replace(/\s/g, "")}`,
                    displayName: name,
                    email: email,
                    avatar: "",
                    currency: "USD",
                    isVerified: true,
                    completedSetup: false,
                });

                // Add to usernames collection for searchability
                await setDoc(doc(db, "usernames", name.toLowerCase().replace(/\s/g, "")), {
                    uid: user.uid
                });
                
                await set(otpRef, null);
                
                toast.success("Account created and verified!");
                navigate("/profile-setup");
            } else {
                throw new Error("OTP is wrong");
            }
        } else {
            throw new Error("Verification code not found. Please resend.");
        }
    };

    const handleResendOtp = async () => {
        try {
            await sendOTPEmail(email, name);
            toast.success("New code sent!");
        } catch (err: any) {
            console.error("Failed to resend email:", err);
            toast.error(err.message || "Failed to resend email");
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            const { loginWithGoogle } = await import("@/lib/auth-native");
            await loginWithGoogle();
            toast.success("Welcome to Split!");
            navigate("/");
        } catch (error: any) {
            if (error.code === "auth/popup-closed-by-user" || error.message?.includes("cancel")) {
                toast.error("Sign up cancelled");
            } else {
                toast.error(error.message || "Sign up failed");
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
            {step === "signup" ? (
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <img src="/icon-192.png" alt="Split Logo" className="size-20 rounded-3xl shadow-brand/20 shadow-2xl animate-reveal" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-extrabold tracking-tightest text-ink italic">split</h1>
                            <p className="text-ink-soft">Create your account</p>
                        </div>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-surface-soft border border-hairline rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-brand transition-colors"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setEmailStatus("idle");
                                    }}
                                    className={cn(
                                        "w-full bg-surface-soft border rounded-2xl py-3 pl-10 pr-10 outline-none transition-all",
                                        emailStatus === "taken" ? "border-destructive/50 ring-4 ring-destructive/5" : "border-hairline focus:border-brand"
                                    )}
                                    required
                                />
                                {isCheckingEmail && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <RefreshCw className="size-4 animate-spin text-brand" />
                                    </div>
                                )}
                                {emailStatus === "taken" && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <AlertCircle className="size-4 text-destructive" />
                                    </div>
                                )}
                            </div>
                            {emailStatus === "taken" && (
                                <p className="text-[10px] text-destructive font-bold ml-1">
                                    This email is already registered. <Link to="/login" className="underline">Log in?</Link>
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-surface-soft border border-hairline rounded-2xl py-3 pl-10 pr-12 outline-none focus:border-brand transition-colors"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-brand transition-colors"
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-brand text-brand-foreground rounded-2xl py-3.5 font-bold shadow-brand hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? "Creating account..." : <><UserPlus className="size-4" /> Sign Up</>}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-hairline" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-ink-soft">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={googleLoading}
                        className="w-full bg-surface border border-hairline rounded-2xl py-3.5 font-bold shadow-soft hover:bg-surface-soft active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {googleLoading ? (
                            <div className="size-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="size-4" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                <path fill="none" d="M0 0h48v48H0z" />
                            </svg>
                        )}
                        {googleLoading ? "Signing in..." : "Google"}
                    </button>

                    <p className="text-center text-ink-soft text-sm">
                        Already have an account?{" "}
                        <Link to="/login" className="text-brand font-bold hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>
            ) : (
                <EmailVerification
                    email={email}
                    onVerify={handleVerifyOtp}
                    onResend={handleResendOtp}
                />
            )}
        </div>
    );
}
