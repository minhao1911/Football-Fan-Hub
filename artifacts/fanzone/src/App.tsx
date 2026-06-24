import { useEffect, useRef, useState } from "react";
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { SplashScreen } from "@/components/SplashScreen";
import { NativeInit } from "@/components/NativeInit";
import { OfflineBanner } from "@/components/OfflineBanner";
import { MatchesPage } from "@/pages/MatchesPage";
import { MatchDetailPage } from "@/pages/MatchDetailPage";
import { GroupsPage } from "@/pages/GroupsPage";
import { LeaderboardPage } from "@/pages/LeaderboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { AdminPage } from "@/pages/AdminPage";
import { FeedPage } from "@/pages/FeedPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  baseTheme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#16a34a",
    colorForeground: "#f9fafb",
    colorMutedForeground: "#6b7280",
    colorDanger: "#ef4444",
    colorBackground: "#111827",
    colorInput: "#1f2937",
    colorInputForeground: "#f9fafb",
    colorNeutral: "#374151",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-gray-900 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-gray-400",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-gray-300",
    footerActionLink: "text-green-400 hover:text-green-300",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-500",
    identityPreviewEditButton: "text-green-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-white",
    logoBox: "flex justify-center",
    logoImage: "w-14 h-14",
    socialButtonsBlockButton: "bg-gray-800 border-gray-700 hover:bg-gray-700",
    formButtonPrimary: "bg-green-600 hover:bg-green-500 text-white",
    formFieldInput: "bg-gray-800 border-gray-700 text-white",
    footerAction: "bg-gray-900",
    dividerLine: "bg-gray-700",
    alert: "bg-gray-800 border-gray-700",
    otpCodeFieldInput: "bg-gray-800 border-gray-700 text-white",
    formFieldRow: "",
    main: "",
  },
};

function LandingPage() {
  const [, navigate] = useLocation();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden"
      style={{ background: "#071A0F" }}
    >
      {/* Stadium floodlight beams */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-2/3 bg-gradient-to-b from-[#1DB954]/20 to-transparent" style={{ transform: "rotate(-15deg) translateX(-50%)" }} />
        <div className="absolute top-0 left-1/2 w-px h-3/4 bg-gradient-to-b from-[#1DB954]/30 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-2/3 bg-gradient-to-b from-[#1DB954]/20 to-transparent" style={{ transform: "rotate(15deg) translateX(50%)" }} />
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#1DB954]/8 to-transparent" />
      </div>

      {/* Pitch pattern at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 opacity-20"
        style={{
          background: "repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(29,185,84,0.15) 60px, rgba(29,185,84,0.15) 61px)",
          borderTop: "2px solid rgba(255,255,255,0.08)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 mb-10">
        {/* Ball + glow */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-24 h-24 rounded-full bg-[#1DB954]/15 blur-2xl animate-pulse" />
          <span className="text-7xl crowd-pulse">⚽</span>
        </div>

        <h1 className="text-6xl font-black mb-3 tracking-tight leading-none">
          <span className="text-[#1DB954]">Fan</span>
          <span className="text-white">Hub</span>
        </h1>
        <p className="text-white/50 font-semibold text-sm uppercase tracking-[0.2em] mb-2">
          Global Football Fan Platform
        </p>
        <p className="text-white/60 text-base max-w-xs mx-auto leading-relaxed">
          The home of global football fans — predict, chat live, and rise up the leaderboard.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full max-w-xs mb-10">
        <button
          onClick={() => navigate("/sign-up")}
          className="flex-1 font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 active:scale-95 text-white"
          style={{
            background: "linear-gradient(135deg, #1DB954 0%, #22C55E 100%)",
            boxShadow: "0 0 24px rgba(29,185,84,0.4), 0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          Get Started
        </button>
        <button
          onClick={() => navigate("/sign-in")}
          className="flex-1 font-bold py-3.5 px-6 rounded-2xl border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all duration-200 active:scale-95"
          style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}
        >
          Sign In
        </button>
      </div>

      {/* Feature tiles */}
      <div className="relative z-10 grid grid-cols-3 gap-3 max-w-sm w-full">
        {[
          { icon: "🔥", label: "Live Chat",       desc: "Match reactions" },
          { icon: "🎯", label: "Predict Scores",  desc: "Earn XP points" },
          { icon: "🏆", label: "Leaderboard",     desc: "Rise to the top" },
          { icon: "🌍", label: "Fan Nations",     desc: "Global communities" },
          { icon: "📊", label: "Fan Polls",       desc: "Vote & predict" },
          { icon: "⭐", label: "Reputation",      desc: "Build your fame" },
        ].map(({ icon, label, desc }) => (
          <div
            key={label}
            className="rounded-2xl p-3.5 text-center border border-white/8 hover:border-[#1DB954]/30 transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div className="text-2xl mb-1.5">{icon}</div>
            <div className="text-xs text-white font-semibold leading-tight">{label}</div>
            <div className="text-[10px] text-white/35 mt-0.5">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/feed" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedApp() {
  return (
    <Show when="signed-in">
      <UserProvider>
        <AppShell />
      </UserProvider>
    </Show>
  );
}

function AppShell() {
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem("splash-shown") === "1",
  );

  const handleSplashDone = () => {
    sessionStorage.setItem("splash-shown", "1");
    setSplashDone(true);
  };

  return (
    <TooltipProvider>
      <NativeInit />
      <OfflineBanner />
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-[calc(4rem+var(--sab,0px))]">
          <Switch>
            <Route path="/feed" component={FeedPage} />
            <Route path="/matches" component={MatchesPage} />
            <Route path="/matches/:id" component={MatchDetailPage} />
            <Route path="/groups" component={GroupsPage} />
            <Route path="/leaderboard" component={LeaderboardPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/admin" component={AdminPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <BottomNav />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/feed`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/feed`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back to FanZone",
            subtitle: "Sign in to join the action",
          },
        },
        signUp: {
          start: {
            title: "Join FanZone",
            subtitle: "Create your fan account today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route component={ProtectedApp} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
