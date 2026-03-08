import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Brain, ArrowRight, LogOut, Landmark, Lightbulb, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function Landing() {
  const [, navigate] = useLocation();
  const { isAuthenticated, signOut, displayName } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    const loadDay = async () => {
      if (isAuthenticated) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (token) {
            const res = await fetch("/api/user/progress", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const progress = await res.json();
              setCurrentDay(progress.currentDay || 1);
            }
          }
        } catch (e) {
          console.error("Failed to load progress:", e);
          setCurrentDay(1);
        }
      } else {
        const saved = localStorage.getItem("memoryamble_current_day");
        setCurrentDay(saved ? parseInt(saved, 10) : 1);
      }
    };
    loadDay();
  }, [isAuthenticated]);

  return (
    <div className="min-h-dvh bg-background" data-testid="landing-page">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight" data-testid="text-app-title">
              MemoryAmble
            </h1>
          </div>
          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-username">
                  {displayName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="gap-2 text-muted-foreground"
                  data-testid="button-signout"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/login")}
                data-testid="button-header-signin"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Brain className="w-12 h-12 text-primary" />
              </div>
              <h2
                className="font-serif text-4xl md:text-5xl font-bold tracking-tight"
                data-testid="text-hero-title"
              >
                Welcome to MemoryAmble
              </h2>
              <p
                className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
                data-testid="text-hero-subtitle"
              >
                Take a gentle walk through your favourite places -- and build a
                sharper memory along the way. Guided by Coach Timbuk, you will
                learn the ancient Memory Palace technique at your own pace.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => navigate("/amble")}
              className="gap-2 text-lg px-8 py-6"
              data-testid="button-start-amble"
            >
              {isAuthenticated ? `Continue Day ${currentDay}` : "Start My Amble"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>

        <section className="py-16 bg-primary/5 border-t border-b border-border/30">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Landmark className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold">Ancient Wisdom</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Over 2,500 years ago, a Greek poet discovered that our minds remember
                  places far better than lists. That insight became the Memory Palace -- and
                  it still works beautifully today.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Lightbulb className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold">Guided by Coach Timbuk</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Coach Timbuk walks with you step by step. Pick a place you love,
                  choose your stops, and plant vivid images at each one. It is personal,
                  fun, and surprisingly powerful.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold">Built for You</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Large text, a calm pace, and a warm companion. MemoryAmble is designed
                  for anyone who wants to keep their mind sharp -- no matter your age or
                  experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h3 className="font-serif text-2xl md:text-3xl font-semibold">
              Ready to build your first Memory Palace?
            </h3>
            <p className="text-lg text-muted-foreground">
              It takes just a few minutes. Try your first walk right now -- no
              sign-up needed. Coach Timbuk will guide you every step of the way.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/amble")}
              className="gap-2 text-lg px-8 py-6"
              data-testid="button-start-amble-bottom"
            >
              {isAuthenticated ? `Continue Day ${currentDay}` : "Start My Amble"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/30 py-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground">
          MemoryAmble -- Guided memory training with the ancient Memory Palace technique.
        </div>
      </footer>
    </div>
  );
}
