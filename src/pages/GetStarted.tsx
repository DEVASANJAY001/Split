import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Receipt } from "lucide-react";

const GetStarted = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        localStorage.setItem("onboarded", "true");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-6 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-[120px]" />

            <div className="max-w-md w-full space-y-12 text-center z-10">
                <div className="flex justify-center">
                    <div className="size-24 bg-brand rounded-[2rem] flex items-center justify-center shadow-brand transform rotate-12">
                        <Receipt className="size-12 text-brand-foreground -rotate-12" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl font-extrabold tracking-tightest text-ink leading-tight">
                        Split Bills, <br />
                        <span className="text-brand">Not Friendships</span>
                    </h1>
                    <p className="text-ink-soft text-lg max-w-[280px] mx-auto">
                        The smartest way to track shared expenses and settle debts effortlessly.
                    </p>
                </div>

                <div className="pt-8 w-full max-w-xs mx-auto">
                    <Button
                        onClick={handleGetStarted}
                        size="lg"
                        className="w-full h-16 text-xl font-bold rounded-2xl bg-brand hover:bg-brand/90 text-brand-foreground shadow-brand group transition-all duration-300"
                    >
                        Get Started
                        <ArrowRight className="ml-2 size-6 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GetStarted;
