import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Brain, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

async function authFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(path, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export default function Account() {
  const [, navigate] = useLocation();
  const { user, displayName, signOut } = useAuth();
  const { toast } = useToast();

  const [emailOptOut, setEmailOptOut] = useState(false);
  const [progressData, setProgressData] = useState<Record<string, unknown> | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  useEffect(() => {
    authFetch("/api/progress")
      .then((res) => res.json())
      .then((data) => {
        setProgressData(data);
        setEmailOptOut(data.emailOptOut === true);
      })
      .catch(() => {});
  }, []);

  const handleChangePassword = async () => {
    if (!user?.email) return;
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + "/amble",
    });
    toast({
      title: "Check your email",
      description: "We sent you a reset link.",
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleToggleEmail = async () => {
    if (!progressData || toggleLoading) return;
    setToggleLoading(true);
    const newOptOut = !emailOptOut;
    try {
      const res = await authFetch("/api/progress", {
        method: "POST",
        body: JSON.stringify({ ...progressData, emailOptOut: newOptOut }),
      });
      if (res.ok) {
        setEmailOptOut(newOptOut);
        setProgressData((prev) => prev ? { ...prev, emailOptOut: newOptOut } : prev);
        toast({
          title: newOptOut ? "Email reminders turned off" : "Email reminders turned on",
        });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col" data-testid="account-page">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
            data-testid="link-home"
          >
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">MemoryAmble</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/amble")}
            className="gap-2 text-muted-foreground"
            data-testid="button-back-amble"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold" data-testid="text-account-title">
              Your Account
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Display name</p>
              <p className="text-base font-medium" data-testid="text-display-name">{displayName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-base font-medium" data-testid="text-email">{user?.email}</p>
            </div>
          </div>

          <div className="border rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-base font-medium">Email Reminders</p>
              <p className="text-sm text-muted-foreground">Receive daily reminders from Timbuk.</p>
            </div>
            <button
              type="button"
              onClick={handleToggleEmail}
              disabled={toggleLoading || progressData === null}
              className={`min-w-[52px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                emailOptOut
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
              data-testid="button-toggle-email"
            >
              {emailOptOut ? "Off" : "On"}
            </button>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full text-lg py-6"
              onClick={handleChangePassword}
              data-testid="button-change-password"
            >
              Change Password
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full text-lg py-6 gap-2 text-muted-foreground"
              onClick={handleSignOut}
              data-testid="button-signout"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
