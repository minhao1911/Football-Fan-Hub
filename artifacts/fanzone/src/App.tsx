import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

function Router() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-y-auto pb-[calc(4rem+var(--sab,0px))]">
        <Switch>
          <Route path="/" component={FeedPage} />
          <Route path="/matches" component={MatchesPage} />
          <Route path="/matches/:id" component={MatchDetailPage} />
          <Route path="/groups" component={GroupsPage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/feed" component={FeedPage} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem("splash-shown") === "1",
  );

  const handleSplashDone = () => {
    sessionStorage.setItem("splash-shown", "1");
    setSplashDone(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            {!splashDone && <SplashScreen onDone={handleSplashDone} />}
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
