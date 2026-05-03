import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { Mail, Lock, LogIn, Chrome, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { userId, loading: authLoading } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && userId) {
            navigate("/");
        }
    }, [userId, authLoading, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/");
        } catch (error: any) {
            console.error("Login error:", error.code, error.message);
            if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                toast.error("Incorrect password. Please try again.");
            } else if (error.code === "auth/user-not-found") {
                toast.error("No account found with this email.");
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
                                className="w-full bg-surface-soft border border-hairline rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-brand transition-colors"
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
                        <div className="flex justify-end px-1">
                            <Link to="/forgot-password" size-sm className="text-xs font-medium text-brand hover:underline">
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
                    <Chrome className="size-4" /> Google
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
