import { useState, useEffect } from "react";
import { Mail, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";

interface EmailVerificationProps {
    email: string;
    onVerify: (otp: string) => Promise<void>;
    onResend: () => Promise<void>;
}

export default function EmailVerification({ email, onVerify, onResend }: EmailVerificationProps) {
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timer, setTimer] = useState(30);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const [shake, setShake] = useState(false);
    const [error, setError] = useState("");

    const handleVerify = async () => {
        setError("");
        if (otp.length !== 6) {
            toast.error("Please enter the 6-digit code");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }
        setLoading(true);
        try {
            await onVerify(otp);
        } catch (err: any) {
            const errorMsg = err.message || "Invalid OTP";
            toast.error(errorMsg);
            setError(errorMsg.includes("OTP") ? errorMsg : "Entered email or password is invalid");
            setShake(true);
            setTimeout(() => setShake(false), 500);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setResending(true);
        try {
            await onResend();
            setTimer(30);
            toast.success("Verification code resent!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="w-full max-w-sm space-y-8 bg-surface p-8 rounded-3xl shadow-xl border border-hairline relative overflow-hidden">
            <div className="absolute -top-24 -right-24 size-48 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="text-center space-y-4">
                <div className="mx-auto size-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand mb-2">
                    <Mail className="size-8" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-ink">Verify your email</h2>
                    <p className="text-ink-soft text-sm px-4">
                        We've sent a 6-digit code to <span className="text-ink font-semibold">{email}</span>
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(val) => {
                            setOtp(val);
                            if (error) setError("");
                        }}
                    >
                        <InputOTPGroup className={`gap-2 ${shake ? 'animate-shake' : ''}`}>
                            <InputOTPSlot index={0} className={`size-12 rounded-xl border-hairline bg-surface-soft text-lg font-bold focus:border-brand focus:ring-brand/20 transition-all ${error ? 'border-destructive' : ''}`} />
                            <InputOTPSlot index={1} className={`size-12 rounded-xl border-hairline bg-surface-soft text-lg font-bold focus:border-brand focus:ring-brand/20 transition-all ${error ? 'border-destructive' : ''}`} />
                            <InputOTPSlot index={2} className={`size-12 rounded-xl border-hairline bg-surface-soft text-lg font-bold focus:border-brand focus:ring-brand/20 transition-all ${error ? 'border-destructive' : ''}`} />
                            <InputOTPSlot index={3} className={`size-12 rounded-xl border-hairline bg-surface-soft text-lg font-bold focus:border-brand focus:ring-brand/20 transition-all ${error ? 'border-destructive' : ''}`} />
                            <InputOTPSlot index={4} className={`size-12 rounded-xl border-hairline bg-surface-soft text-lg font-bold focus:border-brand focus:ring-brand/20 transition-all ${error ? 'border-destructive' : ''}`} />
                            <InputOTPSlot index={5} className={`size-12 rounded-xl border-hairline bg-surface-soft text-lg font-bold focus:border-brand focus:ring-brand/20 transition-all ${error ? 'border-destructive' : ''}`} />
                        </InputOTPGroup>
                    </InputOTP>
                    {error && (
                        <p className="text-[10px] font-bold text-destructive animate-fade-in flex items-center gap-1">
                            <AlertCircle className="size-3" /> {error}
                        </p>
                    )}
                </div>

                <button
                    onClick={handleVerify}
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-brand text-brand-foreground rounded-2xl py-4 font-bold shadow-brand hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 group"
                >
                    {loading ? (
                        <RefreshCw className="size-5 animate-spin" />
                    ) : (
                        <>
                            Verify Account
                            <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <div className="text-center">
                    <button
                        onClick={handleResend}
                        disabled={timer > 0 || resending}
                        className="text-sm font-medium text-ink-soft hover:text-brand disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        {resending ? (
                            <RefreshCw className="size-4 animate-spin" />
                        ) : (
                            <>
                                Didn't receive the code?{" "}
                                {timer > 0 ? (
                                    <span className="text-brand font-bold">Resend in {timer}s</span>
                                ) : (
                                    <span className="text-brand font-bold hover:underline">Resend now</span>
                                )}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
