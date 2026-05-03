import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ref, get, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { sendOTPEmail, resetPassword } from "@/lib/mail";
import EmailVerification from "@/components/Auth/EmailVerification";
import { Mail, Lock, ArrowLeft, RefreshCw, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState<"email" | "otp" | "new-password" | "success">("email");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const usersRef = ref(db, "users");
            const snapshot = await get(usersRef);
            let userExists = false;
            let userName = "";

            if (snapshot.exists()) {
                const users = snapshot.val();
                const user = Object.values(users).find((u: any) => u.email === email) as any;
                if (user) {
                    userExists = true;
                    userName = user.displayName;
                }
            }

            if (!userExists) {
                toast.error("No account found with this email address.");
                setLoading(false);
                return;
            }

            const otp = generateOTP();
            await set(ref(db, `otp_codes/${email.replace(/\./g, "_")}`), {
                code: otp,
                expiresAt: Date.now() + 10 * 60 * 1000,
            });

            await sendOTPEmail(email, otp, userName, 'reset');
            
            setStep("otp");
            toast.success("Verification code sent to your email.");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (otp: string) => {
        const emailKey = email.replace(/\./g, "_");
        const otpRef = ref(db, `otp_codes/${emailKey}`);
        const snapshot = await get(otpRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.code === otp) {
                if (Date.now() > data.expiresAt) {
                    throw new Error("OTP has expired. Please resend.");
                }
                setStep("new-password");
            } else {
                throw new Error("Invalid verification code");
            }
        } else {
            throw new Error("Verification code not found.");
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            await resetPassword(email, newPassword);
            
            await set(ref(db, `otp_codes/${email.replace(/\./g, "_")}`), null);
            
            setStep("success");
            toast.success("Password reset successfully!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
            {step === "email" && (
                <div className="w-full max-w-sm space-y-8">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tightest text-ink">Forgot Password</h1>
                        <p className="text-ink-soft">Enter your email to receive a reset code</p>
                    </div>

                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-surface-soft border border-hairline rounded-2xl py-3.5 pl-10 pr-4 outline-none focus:border-brand transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-brand text-brand-foreground rounded-2xl py-4 font-bold shadow-brand hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="size-5 animate-spin" /> : "Send Reset Code"}
                        </button>
                    </form>

                    <div className="text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-brand transition-colors">
                            <ArrowLeft className="size-4" /> Back to login
                        </Link>
                    </div>
                </div>
            )}

            {step === "otp" && (
                <EmailVerification
                    email={email}
                    onVerify={handleVerifyOtp}
                    onResend={() => handleSendOtp({ preventDefault: () => {} } as any)}
                />
            )}

            {step === "new-password" && (
                <div className="w-full max-w-sm space-y-8">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tightest text-ink">New Password</h1>
                        <p className="text-ink-soft">Enter your new secure password</p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-surface-soft border border-hairline rounded-2xl py-3.5 pl-10 pr-12 outline-none focus:border-brand transition-colors"
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
                            className="w-full bg-brand text-brand-foreground rounded-2xl py-4 font-bold shadow-brand hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="size-5 animate-spin" /> : "Reset Password"}
                        </button>
                    </form>
                </div>
            )}

            {step === "success" && (
                <div className="w-full max-w-sm space-y-6 text-center">
                    <div className="mx-auto size-20 bg-success/10 rounded-full flex items-center justify-center text-success">
                        <CheckCircle2 className="size-10" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tightest text-ink">Success!</h1>
                        <p className="text-ink-soft">Your password has been reset successfully.</p>
                    </div>
                    <button
                        onClick={() => navigate("/login")}
                        className="w-full bg-brand text-brand-foreground rounded-2xl py-4 font-bold shadow-brand hover:opacity-90 active:scale-95 transition-all"
                    >
                        Log In Now
                    </button>
                </div>
            )}
        </div>
    );
}
