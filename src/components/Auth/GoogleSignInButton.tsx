import { useEffect, useRef, useState } from "react";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { loginWithGoogle } from "@/lib/auth-native";
import { Capacitor } from "@capacitor/core";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

interface GoogleButtonProps {
  onSuccess: () => void;
  onError: (error: any) => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
}

export default function GoogleSignInButton({ onSuccess, onError, text = "signin_with" }: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [loading, setLoading] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const theme = useStore((s) => s.theme);

  // Resize observer to match overlay width to custom button width
  useEffect(() => {
    if (isNative || !containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newWidth = Math.max(200, Math.min(400, entry.contentRect.width));
        setWidth(newWidth);
      }
    });

    observer.observe(containerRef.current);
    
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0) {
      setWidth(Math.max(200, Math.min(400, rect.width)));
    }

    return () => observer.disconnect();
  }, [isNative]);

  // Initialize Google Identity Services (GSI)
  useEffect(() => {
    if (isNative) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("VITE_GOOGLE_CLIENT_ID is not configured.");
      return;
    }

    const initGsi = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          setLoading(true);
          try {
            const credential = GoogleAuthProvider.credential(response.credential);
            await signInWithCredential(auth, credential);
            toast.success("Welcome back!");
            onSuccess();
          } catch (err: any) {
            console.error("GSI Sign-In failed:", err);
            toast.error(err.message || "Sign-In failed");
            onError(err);
          } finally {
            setLoading(false);
          }
        },
        use_fedcm_for_prompt: true,
      });

      const buttonContainer = document.getElementById("gsi-button-overlay");
      if (buttonContainer) {
        buttonContainer.innerHTML = "";
        window.google.accounts.id.renderButton(buttonContainer, {
          type: "standard",
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          text: text,
          shape: "rectangular",
          logo_alignment: "left",
          width: width,
        });
        setGisLoaded(true);
      }
    };

    // Poll for global Google object availability
    const checkInterval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initGsi();
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [width, text, onSuccess, onError, isNative, theme]);

  // Fallback sign-in handler (handles Native or Web popup fallback)
  const handleFallbackClick = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success("Welcome!");
      onSuccess();
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user" && !err.message?.includes("cancel")) {
        toast.error(err.message || "Sign-In failed");
      }
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  const buttonText = {
    signin_with: "Continue with Google",
    signup_with: "Sign up with Google",
    continue_with: "Continue with Google",
    signin: "Sign in with Google",
  }[text];

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 1. GSI Invisible Overlay (rendered only on web) */}
      {!isNative && gisLoaded && (
        <div 
          id="gsi-button-overlay" 
          className="absolute inset-0 opacity-0 z-10 cursor-pointer overflow-hidden [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:scale-y-[1.2] [&_iframe]:scale-x-[1.05]"
        />
      )}

      {/* 2. Custom Modern Premium Button Design */}
      <button
        onClick={handleFallbackClick}
        disabled={loading}
        className="w-full h-11 flex items-center justify-center gap-3 px-4 font-semibold text-sm tracking-tight rounded-2xl transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) disabled:opacity-50
          bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md
          border border-neutral-200/50 dark:border-neutral-800/50
          text-neutral-800 dark:text-neutral-200
          shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)]
          hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50
          hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]
          hover:scale-[1.01] active:scale-[0.98]"
      >
        {loading ? (
          <div className="size-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="size-5 shrink-0" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        )}
        <span>{loading ? "Connecting..." : buttonText}</span>
      </button>
    </div>
  );
}
