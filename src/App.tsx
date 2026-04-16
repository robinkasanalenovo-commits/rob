import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Pending from "@/pages/Pending";
import Categories from "@/pages/Categories";
import Profile from "@/pages/Profile";
import Referrals from "@/pages/Referrals";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import AdminProducts from "@/pages/AdminProducts";
import AdminServices from "@/pages/AdminServices";
import AdminAccounts from "@/pages/AdminAccounts";
import StaffAuth from "@/pages/StaffAuth";
import StaffPending from "@/pages/StaffPending";
import StaffDashboard from "@/pages/StaffDashboard";
import SellerAuth from "@/pages/SellerAuth";
import SellerPending from "@/pages/SellerPending";
import SellerDashboard from "@/pages/SellerDashboard";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import DeleteAccount from "@/pages/DeleteAccount";
import Offers from "@/pages/Offers";
import { useStore } from "@/lib/store";
import { useEffect, useState, useRef, useCallback } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

// ─── Splash Screen ────────────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f5f9f0]">
      <div className="flex flex-col items-center gap-8">
        <img
          src="/logo-splash.png"
          alt="AtoZDukaan"
          className="w-72 object-contain"
          style={{ maxWidth: "80vw" }}
        />
        <div className="flex gap-2">
          <span className="w-2 h-2 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ─── No Internet Overlay ──────────────────────────────────────────────────────
function NoInternetOverlay() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-white px-8 text-center">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <WifiOff className="h-12 w-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">No Internet Connection</h2>
      <p className="text-gray-500 text-sm mb-8 max-w-xs">
        Please check your Wi-Fi or cellular data and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg active:scale-95 transition-transform"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}

// ─── Pull to Refresh ──────────────────────────────────────────────────────────
function PullToRefresh() {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const THRESHOLD = 72;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || refreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) {
      setPullY(Math.min(delta * 0.45, THRESHOLD + 16));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(() => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      setTimeout(() => window.location.reload(), 700);
    } else {
      setPullY(0);
    }
  }, [pullY]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (pullY === 0 && !refreshing) return null;

  const progress = Math.min(pullY / THRESHOLD, 1);
  const rotation = refreshing ? undefined : progress * 300;
  const size = 40;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * progress;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9997] flex items-center justify-center pointer-events-none"
      style={{
        height: `${Math.max(pullY, refreshing ? 56 : 0)}px`,
        transition: refreshing ? "none" : "height 0.1s ease",
      }}
    >
      <div
        className="bg-white rounded-full shadow-lg flex items-center justify-center"
        style={{
          width: size,
          height: size,
          opacity: Math.min(progress * 1.5, 1),
          transform: `scale(${0.6 + progress * 0.4})`,
          transition: refreshing ? "none" : "transform 0.1s ease",
        }}
      >
        {refreshing ? (
          <svg width="22" height="22" viewBox="0 0 22 22" className="animate-spin">
            <circle cx="11" cy="11" r={radius - 2} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" />
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            style={{ transform: `rotate(${rotation}deg)`, transition: "transform 0.05s linear" }}
          >
            <circle cx="11" cy="11" r={radius - 2} fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
            <circle
              cx="11"
              cy="11"
              r={radius - 2}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              strokeDashoffset={circumference * 0.25}
            />
            <polyline
              points="11,5 11,9 14,7"
              fill="none"
              stroke="#2563eb"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

// ─── Route Guards ─────────────────────────────────────────────────────────────
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useStore();
  if (!isAuthenticated) return <Redirect to="/auth" />;
  return <Component />;
}

function AdminProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isAuthenticated } = useStore();
  if (!isAuthenticated) return <Redirect to="/admin-login" />;
  if (!user?.isAdmin) return <Redirect to="/admin-login" />;
  return <Component />;
}

function SellerProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isAuthenticated } = useStore();
  if (!isAuthenticated || user?.isSeller !== "true") return <Redirect to="/seller-auth" />;
  if (user?.sellerStatus !== "approved") return <Redirect to="/seller-pending" />;
  return <Component />;
}

function StaffProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isAuthenticated } = useStore();
  if (!isAuthenticated || user?.isStaff !== "true") return <Redirect to="/staff-auth" />;
  if (user?.staffStatus !== "approved") return <Redirect to="/staff-pending" />;
  return <Component />;
}

// ─── Router ───────────────────────────────────────────────────────────────────
function Router() {
  const { isAuthenticated } = useStore();

  return (
    <Switch>
      <Route path="/auth">
        {isAuthenticated ? <Redirect to="/" /> : <Auth />}
      </Route>
      <Route path="/pending">
        {isAuthenticated ? <Redirect to="/" /> : <Redirect to="/auth" />}
      </Route>

      <Route path="/"><Home /></Route>
      <Route path="/categories"><Categories /></Route>
      <Route path="/offers"><Offers /></Route>
      <Route path="/privacy-policy"><PrivacyPolicy /></Route>
      <Route path="/delete-account"><DeleteAccount /></Route>

      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
      <Route path="/referrals"><ProtectedRoute component={Referrals} /></Route>

      <Route path="/admin-login"><AdminLogin /></Route>
      <Route path="/admin"><AdminProtectedRoute component={Admin} /></Route>
      <Route path="/admin/products"><AdminProtectedRoute component={AdminProducts} /></Route>
      <Route path="/admin/services"><AdminProtectedRoute component={AdminServices} /></Route>
      <Route path="/admin/accounts"><AdminProtectedRoute component={AdminAccounts} /></Route>

      <Route path="/staff-auth"><StaffAuth /></Route>
      <Route path="/staff-pending"><StaffPending /></Route>
      <Route path="/staff"><StaffProtectedRoute component={StaffDashboard} /></Route>

      <Route path="/seller-auth"><SellerAuth /></Route>
      <Route path="/seller-pending"><SellerPending /></Route>
      <Route path="/seller"><SellerProtectedRoute component={SellerDashboard} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// ─── Auth Verifier ────────────────────────────────────────────────────────────
function AuthVerifier({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, login } = useStore();

  useEffect(() => {
    const verifyUser = async () => {
      if (isAuthenticated && user?.email) {
        try {
          const res = await fetch(`/api/customers`);
          if (res.ok) {
            const customers = await res.json();
            const currentUser = customers.find((c: any) =>
              c.username === user.email || c.phone === user.phone || c.email === user.email
            );
            if (currentUser) {
              const isApproved = currentUser.approvalStatus === "approved";
              const isAdmin = String(currentUser.isAdmin) === "true";
              if (isApproved !== user.isApproved || isAdmin !== user.isAdmin) {
                login({ ...currentUser, isAdmin });
              }
            }
          }
        } catch (error) {
          console.error("Failed to verify user status:", error);
        }
      }
    };
    verifyUser();
  }, [isAuthenticated, user?.email]);

  return <>{children}</>;
}

// ─── Referral Capture ─────────────────────────────────────────────────────────
function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) localStorage.setItem("referralCode", refCode);
  }, []);
  return null;
}

// ─── App Root ─────────────────────────────────────────────────────────────────
function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        <NoInternetOverlay />
        <PullToRefresh />
        <ReferralCapture />
        <AuthVerifier>
          <Router />
        </AuthVerifier>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
