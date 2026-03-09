import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Brain, ArrowRight, LogOut, Landmark, Lightbulb, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const [, navigate] = useLocation();
  const { isAuthenticated, signOut, displayName } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    const localDay = localStorage.getItem("memory-amble-day");
    setCurrentDay(localDay ? parseInt(localDay, 10) : 1);
  }, []);

  const skipToDay2 = () => {
    localStorage.setItem("memory-amble-day", "2");
    localStorage.setItem("userName", "Joe");
    localStorage.setItem("palaceLocations", JSON.stringify(["Front Door", "Kitchen", "Living Room"]));
    window.location.reload();
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">MemoryAmble</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* DEV BUTTON - DELETE THIS AFTER TESTING */}
            <Button variant="destructive" size="sm" onClick={skipToDay2}>
              Skip to Day 2
            </Button>

            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight">
              Welcome to MemoryAmble
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Take a gentle walk through your favourite places -- and build a
              sharper memory along the way. Guided by Coach Timbuk, you will
              learn the ancient Memory Palace technique at your own pace.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/amble")}
              className="gap-2 text-lg px-8 py-6"
            >
              {currentDay > 1 ? `Continue Day ${currentDay}` : "Start My Amble"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>
        {/* ... rest of your existing sections ... */}
      </main>
    </div>
  );
}
