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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-6xl">⚽</span>
        </div>
        <h1 className="text-5xl font-extrabold mb-2">
          <span className="text-green-400">Fan</span>
          <span className="text-white">Zone</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-sm mx-auto">
          Join your fan group, predict scores, chat live, and rise up the leaderboard.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate("/sign-up")}
          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Get Started
        </button>
        <button
          onClick={() => navigate("/sign-in")}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl border border-gray-700 transition-colors"
        >
          Sign In
        </button>
      </div>
      <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm w-full text-center">
        {[
          { icon: "🔥", label: "Live Chat" },
          { icon: "🎯", label: "Predict Scores" },
          { icon: "🏆", label: "Leaderboard" },
        ].map(({ icon, label }) => (
          <div key={label} className="bg-gray-900 rounded-xl p-3">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xs text-gray-400 font-medium">{label}</div>
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
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      <div className="min-h-screen bg-gray-950 flex flex-col">
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
