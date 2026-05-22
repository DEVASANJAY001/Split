import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import GoogleSignInButton from "@/components/Auth/GoogleSignInButton";
import { useStore } from "@/lib/store";
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { userId, profile, loading: authLoading } = useStore();

    useEffect(() => {
        if (!authLoading && userId) {
            if (profile) {
                if (profile.isVerified) {
                    navigate("/");
                } else {
                    // This case is unlikely for login but safe to handle
                    navigate("/signup"); 
                }
            } else {
                // No profile found - likely a new Google user or first-time login without setup
                navigate("/profile-setup");
            }
        }
    }, [userId, authLoading, navigate, profile]);

    const [shakeEmail, setShakeEmail] = useState(false);
    const [shakePassword, setShakePassword] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const triggerShake = (target: 'email' | 'password') => {
        if (target === 'email') {
            setShakeEmail(true);
            setTimeout(() => setShakeEmail(false), 500);
        } else {
            setShakePassword(true);
            setTimeout(() => setShakePassword(false), 500);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setEmailError("");
        setPasswordError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/");
        } catch (error: any) {
            console.error("Login error:", error.code, error.message);
            if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                toast.error("Password is wrong");
                setPasswordError("Entered email or password is invalid");
                triggerShake('password');
            } else if (error.code === "auth/user-not-found") {
                toast.error("Email is wrong");
                setEmailError("Entered email id is invalid");
                triggerShake('email');
              } else if (error.code === "auth/too-many-requests") {
                toast.error("Too many failed attempts. Please try again later.");
            } else {
                useStore.getState().showError(error);
            }
        } finally {
            setLoading(false);
        }
    };




    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <img src="/icon-192.png" alt="Split Logo" className="size-20 rounded-3xl shadow-brand/20 shadow-2xl animate-reveal" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tightest text-ink italic">split</h1>
                        <p className="text-ink-soft">Sign in to your account</p>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError("");
                                }}
                                className={`w-full bg-surface-soft border border-hairline rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-brand transition-colors ${shakeEmail ? 'animate-shake border-destructive ring-4 ring-destructive/10' : emailError ? 'border-destructive' : ''}`}
                                required
                            />
                        </div>
                        {emailError && (
                            <p className="text-[10px] font-bold text-destructive px-3 animate-fade-in flex items-center gap-1">
                                <AlertCircle className="size-3" /> {emailError}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (passwordError) setPasswordError("");
                                }}
                                className={`w-full bg-surface-soft border border-hairline rounded-2xl py-3 pl-10 pr-12 outline-none focus:border-brand transition-colors ${shakePassword ? 'animate-shake border-destructive ring-4 ring-destructive/10' : passwordError ? 'border-destructive' : ''}`}
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
                        {passwordError && (
                            <p className="text-[10px] font-bold text-destructive px-3 animate-fade-in flex items-center gap-1">
                                <AlertCircle className="size-3" /> {passwordError}
                            </p>
                        )}
                        <div className="flex justify-end px-1">
                            <Link to="/forgot-password" className="text-xs font-medium text-brand hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-brand text-brand-foreground rounded-2xl py-3.5 font-bold shadow-brand hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? "Signing in..." : <><LogIn className="size-4" /> Sign In</>}
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

                <GoogleSignInButton
                    onSuccess={() => navigate("/")}
                    onError={() => {}}
                    text="signin_with"
                />

                <p className="text-center text-ink-soft text-sm">
                    Don&apos;t have an account?{" "}
                    <Link to="/signup" className="text-brand font-bold hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
