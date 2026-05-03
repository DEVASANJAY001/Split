import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { userId, loading: authLoading } = useStore();

    useEffect(() => {
        if (!authLoading && userId) {
            navigate("/");
        }
    }, [userId, authLoading, navigate]);

    const [shakeEmail, setShakeEmail] = useState(false);
    const [shakePassword, setShakePassword] = useState(false);

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
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/");
        } catch (error: any) {
            console.error("Login error:", error.code, error.message);
            if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                toast.error("Password is wrong");
                triggerShake('password');
            } else if (error.code === "auth/user-not-found") {
                toast.error("Email is wrong");
                triggerShake('email');
            } else if (error.code === "auth/too-many-requests") {
                toast.error("Too many failed attempts. Please try again later.");
            } else {
                toast.error(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate("/");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tightest text-ink italic">split</h1>
                    <p className="text-ink-soft">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full bg-surface-soft border border-hairline rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-brand transition-colors ${shakeEmail ? 'animate-shake border-destructive ring-4 ring-destructive/10' : ''}`}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full bg-surface-soft border border-hairline rounded-2xl py-3 pl-10 pr-12 outline-none focus:border-brand transition-colors ${shakePassword ? 'animate-shake border-destructive ring-4 ring-destructive/10' : ''}`}
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

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-surface border border-hairline rounded-2xl py-3.5 font-bold shadow-soft hover:bg-surface-soft active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <svg className="size-4" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    Google
                </button>

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
