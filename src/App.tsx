import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

import { useEffect } from "react";
import { getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

const App = () => {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Crucial for APK/WebView redirect handling
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Redirect login successful:", result.user.email);
        }
      } catch (error: any) {
        if (error.code !== "auth/redirect-cancelled-by-user") {
          console.error("Auth redirect error:", error);
          toast.error(`Auth Error: ${error.code}. Please check Firebase Authorized Domains.`);
        }
      } finally {
        // Only stop initializing after we've checked for a redirect result
        setInitializing(false);
      }
    };

    handleRedirect();
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
        <p className="text-xs font-black text-ink-soft uppercase tracking-widest">Verifying Session...</p>
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
              <Route path="/login" element={<LoginPage />} />
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
                <Route path="/support/tickets" element={<SupportTickets />} />
                <Route path="/support/help" element={<HelpCenter />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
