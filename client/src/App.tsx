import { type ReactNode, lazy, Suspense } from "react";
import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Signup from "@/pages/signup";
import Login from "@/pages/login";
import ProfileSetup from "@/pages/profile-setup";
import Home from "@/pages/home";
import Directory from "@/pages/directory";
import AttendeeProfile from "@/pages/attendee-profile";
import Connections from "@/pages/connections";
import Messages from "@/pages/messages";
import MessageThread from "@/pages/message-thread";
import Sessions from "@/pages/sessions";
import Settings from "@/pages/settings";
import { AuthProvider, useAuth } from "@/lib/auth-context";

// The AI host screen carries the video-call library, so it loads only when opened.
const Host = lazy(() => import("@/pages/host"));
import { ThemeProvider } from "@/lib/theme-context";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, token, ready } = useAuth();
  if (!ready) return null;
  if (!user || !token) {
    return <Redirect to="/login" />;
  }
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, token, ready } = useAuth();
  if (!ready) return null;
  if (user && token) {
    return <Redirect to="/home" />;
  }
  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/">
        <RedirectIfAuthed>
          <Landing />
        </RedirectIfAuthed>
      </Route>
      <Route path="/signup">
        <Signup />
      </Route>
      <Route path="/login">
        <RedirectIfAuthed>
          <Login />
        </RedirectIfAuthed>
      </Route>
      <Route path="/profile-setup">
        <RequireAuth>
          <ProfileSetup />
        </RequireAuth>
      </Route>
      <Route path="/home">
        <RequireAuth>
          <Home />
        </RequireAuth>
      </Route>
      <Route path="/host">
        <RequireAuth>
          <Suspense fallback={null}>
            <Host />
          </Suspense>
        </RequireAuth>
      </Route>
      <Route path="/directory">
        <RequireAuth>
          <Directory />
        </RequireAuth>
      </Route>
      <Route path="/attendee/:id">
        <RequireAuth>
          <AttendeeProfile />
        </RequireAuth>
      </Route>
      <Route path="/connections">
        <RequireAuth>
          <Connections />
        </RequireAuth>
      </Route>
      <Route path="/messages">
        <RequireAuth>
          <Messages />
        </RequireAuth>
      </Route>
      <Route path="/messages/:id">
        <RequireAuth>
          <MessageThread />
        </RequireAuth>
      </Route>
      <Route path="/sessions">
        <RequireAuth>
          <Sessions />
        </RequireAuth>
      </Route>
      <Route path="/recordings">
        <Redirect to="/sessions" />
      </Route>
      <Route path="/settings">
        <RequireAuth>
          <Settings />
        </RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <AppRouter />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
