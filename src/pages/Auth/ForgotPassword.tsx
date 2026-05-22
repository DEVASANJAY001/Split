import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { sendOTPEmail, resetPassword, verifyOTP } from "@/lib/mail";
import EmailVerification from "@/components/Auth/EmailVerification";
import { Mail, Lock, ArrowLeft, RefreshCw, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState<"email" | "otp" | "new-password" | "success">("email");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

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

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setEmailError("");
        try {
            await sendOTPEmail(email, "User", 'reset');
            setStep("otp");
            toast.success("Verification code sent!");
        } catch (error: any) {
            console.error("OTP Send Error:", error);
            toast.error(error.message || "Failed to initiate password reset");
            setEmailError("Entered email id is invalid");
            triggerShake('email');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (otp: string) => {
        // verifyOTP reads from sessionStorage — works for unauthenticated users
        verifyOTP(email, otp); // throws descriptive Error on failure
        setStep("new-password");
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            setPasswordError("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        setPasswordError("");
        try {
            await resetPassword(email, newPassword);
            setStep("success");
            toast.success("Password reset successfully!");
        } catch (error: any) {
            toast.error(error.message);
            setPasswordError("Entered email or password is invalid");
            triggerShake('password');
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
                                    className={`w-full bg-surface-soft border border-hairline rounded-2xl py-3.5 pl-10 pr-4 outline-none focus:border-brand transition-colors ${shakeEmail ? 'animate-shake border-destructive ring-4 ring-destructive/10' : emailError ? 'border-destructive' : ''}`}
                                    required
                                />
                            </div>
                            {emailError && (
                                <p className="text-[10px] font-bold text-destructive px-3 animate-fade-in flex items-center gap-1">
                                    <AlertCircle className="size-3" /> {emailError}
                                </p>
                            )}
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
                        <div className="space-y-1">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        if (passwordError) setPasswordError("");
                                    }}
                                    className={`w-full bg-surface-soft border border-hairline rounded-2xl py-3.5 pl-10 pr-12 outline-none focus:border-brand transition-colors ${shakePassword ? 'animate-shake border-destructive ring-4 ring-destructive/10' : passwordError ? 'border-destructive' : ''}`}
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
