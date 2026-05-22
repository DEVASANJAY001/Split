import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import SplitBill from "./pages/SplitBill";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Friends from "./pages/Friends";
import ProfilePage from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import AboutDAVNS from "./pages/legal/AboutDAVNS";
import SupportTickets from "./pages/support/SupportTickets";
import HelpCenter from "./pages/support/HelpCenter";
import PersonalExpenseDetails from "./pages/PersonalExpenseDetails";
import NotFound from "./pages/NotFound.tsx";
import LoginPage from "./pages/Auth/LoginPage";
import UserDetail from "./pages/UserDetail";
import SignUpPage from "./pages/Auth/SignUpPage";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ProfileSetup from "./pages/Auth/ProfileSetup";
import GetStarted from "./pages/Auth/GetStarted";
import { useStore } from "./lib/store";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, userId, loading } = useStore();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
      <div className="relative">
        <div className="size-20 rounded-full border-4 border-brand/10" />
        <div className="absolute top-0 left-0 size-20 rounded-full border-4 border-brand border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative size-10">
            <div className="absolute inset-0 bg-brand rounded-lg rotate-45 animate-pulse" />
            <div className="absolute inset-0 bg-background rounded-lg rotate-45 scale-75 flex items-center justify-center">
              <div className="w-1 h-6 bg-brand -rotate-45 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 animate-pulse">
        <h2 className="text-xl font-bold tracking-tightest italic">split</h2>
        <p className="text-xs font-black text-ink-soft uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );

  if (!userId) {
    if (location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/get-started") {
      return <>{children}</>;
    }
    return <Navigate to="/get-started" replace />;
  }

  if (userId && !profile && location.pathname !== "/profile-setup") {
    return <Navigate to="/profile-setup" replace />;
  }

  if (profile && !profile.completedSetup && location.pathname !== "/profile-setup") {
    return <Navigate to="/profile-setup" replace />;
  }

  if (profile && profile.completedSetup && location.pathname === "/profile-setup") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { userId, loading } = useStore();
  const onboarded = localStorage.getItem("onboarded") === "true";
  const location = useLocation();

  if (loading) return null; // Wait for auth check

  // If already logged in, skip onboarding/login/signup and go to dashboard
  if (userId && (location.pathname === "/get-started" || location.pathname === "/login" || location.pathname === "/signup")) {
    return <Navigate to="/" replace />;
  }

  // If not onboarded and not on get-started, go to get-started
  if (!onboarded && location.pathname !== "/get-started" && !userId) {
    return <Navigate to="/get-started" replace />;
  }

  return <>{children}</>;
};

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

const App = () => {
  const [initializing, setInitializing] = useState(true);

  const theme = useStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");

    // Sync Android status bar with the app theme
    if (Capacitor.isNativePlatform()) {
      if (theme === "dark") {
        // Dark background → light (white) status bar icons
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#09090b' }); // zinc-950
      } else {
        // Light background → dark status bar icons
        StatusBar.setStyle({ style: Style.Light });
        StatusBar.setBackgroundColor({ color: '#ffffff' }); // white
      }
    }
  }, [theme]);

  useEffect(() => {
    // PKCE flow handles auth inside the app via signInWithCredential.
    // No redirect result to capture — just unblock the UI immediately.
    setInitializing(false);
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.name === "NavigationCancelledError") return;
      useStore.getState().showError(event.reason);
    };

    const handleWindowError = (event: ErrorEvent) => {
      useStore.getState().showError(event.error || event.message);
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleWindowError);
    };
  }, []);

  if (initializing) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
      <div className="relative">
        <div className="size-20 rounded-full border-4 border-brand/10" />
        <div className="absolute top-0 left-0 size-20 rounded-full border-4 border-brand border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative size-10">
            <div className="absolute inset-0 bg-brand rounded-lg rotate-45 animate-pulse" />
            <div className="absolute inset-0 bg-background rounded-lg rotate-45 scale-75 flex items-center justify-center">
              <div className="w-1 h-6 bg-brand -rotate-45 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 animate-pulse">
        <h2 className="text-xl font-bold tracking-tightest italic">split</h2>
        <p className="text-xs font-black text-ink-soft uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <div className="h-full">
            <Routes>
              <Route path="/get-started" element={<OnboardingRoute><GetStarted /></OnboardingRoute>} />
              <Route path="/login" element={<OnboardingRoute><LoginPage /></OnboardingRoute>} />
              <Route path="/signup" element={<OnboardingRoute><SignUpPage /></OnboardingRoute>} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
              <Route path="/user/:id" element={<ProtectedRoute><UserDetail /></ProtectedRoute>} />

              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<OnboardingRoute><Dashboard /></OnboardingRoute>} />
                <Route path="/split" element={<SplitBill />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/groups/:id" element={<GroupDetail />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/legal/terms" element={<TermsOfService />} />
                <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                <Route path="/legal/about" element={<AboutDAVNS />} />
                <Route path="/personal/:id" element={<PersonalExpenseDetails />} />
                <Route path="/support/tickets" element={<SupportTickets />} />
                <Route path="/support/help" element={<HelpCenter />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
        <Sonner />
        <GlobalErrorModal />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

import { Copy, Check, X, AlertCircle } from "lucide-react";

const GlobalErrorModal = () => {
  const { globalError, clearError } = useStore();
  const [copied, setCopied] = useState(false);

  if (!globalError) return null;

  const handleCopy = () => {
    const errorText = JSON.stringify(globalError, null, 2);
    navigator.clipboard.writeText(errorText);
    setCopied(true);
    toast.success("Error logs copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 dark:bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-card border border-destructive/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-reveal">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-destructive/5">
          <div className="flex items-center gap-3 text-destructive">
            <div className="size-10 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="size-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-foreground">Application Error Log</h3>
              <p className="text-xs text-muted-foreground">Detailed debug diagnostic report</p>
            </div>
          </div>
          <button 
            onClick={clearError}
            className="size-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Main message */}
          <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-4">
            <p className="text-sm font-semibold text-destructive break-words leading-relaxed">
              {globalError.message}
            </p>
          </div>

          {/* Details (Code / Type) */}
          {(globalError.code || globalError.type) && (
            <div className="grid grid-cols-2 gap-3 text-xs bg-muted border border-border rounded-2xl p-4">
              {globalError.code && (
                <div>
                  <span className="font-semibold text-muted-foreground block mb-0.5">Error Code:</span>
                  <code className="text-destructive font-mono text-[10px] break-all">{globalError.code}</code>
                </div>
              )}
              {globalError.type && (
                <div>
                  <span className="font-semibold text-muted-foreground block mb-0.5">Error Type:</span>
                  <code className="text-destructive font-mono text-[10px] break-all">{globalError.type}</code>
                </div>
              )}
            </div>
          )}

          {/* Stack Trace */}
          {globalError.stack && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground px-1">Stack Trace:</span>
              <pre className="w-full bg-zinc-950 text-zinc-300 font-mono text-[10px] p-4 rounded-2xl overflow-x-auto max-h-[30vh] border border-border leading-relaxed select-all">
                {globalError.stack}
              </pre>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border bg-muted/30 flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl py-3.5 font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="size-4 animate-bounce" /> Copied!
              </>
            ) : (
              <>
                <Copy className="size-4" /> Copy Error Logs
              </>
            )}
          </button>
          <button
            onClick={clearError}
            className="px-6 bg-card border border-border hover:bg-muted rounded-2xl font-bold transition-all text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
