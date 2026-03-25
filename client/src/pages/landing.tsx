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
        {/* 1. HERO SECTION */}
        <section className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-primary/10 to-background">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              🧠 Used by memory champions for 2,500 years
            </div>
            <h2 className="font-serif text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              A sharper memory.<br />Starting today.
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Ten minutes a day. A technique used by scholars, orators and memory champions for millennia. Guided by Timbuk — your warm, wise personal memory coach.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => navigate("/amble")} className="gap-2 text-lg px-8 py-6">
                {currentDay > 1 ? `Continue Day ${currentDay}` : "Start My Free Day"}
                <ArrowRight className="w-5 h-5" />
              </Button>
              {!isAuthenticated && (
                <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="text-lg px-8 py-6">
                  Sign In
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">No credit card required. Day 1 is completely free.</p>
          </div>
        </section>

        {/* 2. SOCIAL PROOF BAR */}
        <section className="py-8 px-4 border-y border-border/50 bg-muted/30">
          <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">2,500+</p>
              <p className="text-sm text-muted-foreground">Years of science</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">10 min</p>
              <p className="text-sm text-muted-foreground">Per day</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">7 days</p>
              <p className="text-sm text-muted-foreground">To your first palace</p>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="font-serif text-3xl md:text-4xl font-bold">How it works</h3>
              <p className="text-muted-foreground mt-2 text-lg">Your mind already knows the way</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "1", icon: "🏠", title: "Build Your Palace", desc: "Pick a place you know well — your home, a favourite walk. That's your memory palace. It already exists." },
                { step: "2", icon: "🍍", title: "Plant Vivid Images", desc: "Timbuk gives you items to remember. You make them vivid, strange, personal. The weirder the better." },
                { step: "3", icon: "🧠", title: "Walk & Recall", desc: "Stroll through your palace in your mind. Whatever you planted will be waiting. Every time." },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-3xl">{icon}</div>
                  <h4 className="font-serif text-xl font-semibold">{title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. WHAT YOU'LL GAIN */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="font-serif text-3xl md:text-4xl font-bold">What you will gain</h3>
              <p className="text-muted-foreground mt-2 text-lg">Real results. Real life.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: "🎯", title: "Sharper Recall", desc: "Remember names, faces, appointments and grocery lists without writing anything down." },
                { icon: "⚡", title: "Faster Thinking", desc: "Memory training strengthens the same pathways your brain uses for all thinking and problem-solving." },
                { icon: "💪", title: "Real Confidence", desc: "Stop second-guessing yourself. Build the kind of memory you can actually rely on." },
                { icon: "🕐", title: "10 Minutes a Day", desc: "That's it. Short daily sessions are more effective than long weekly ones. Science agrees." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-background rounded-xl p-6 border border-border/50 space-y-3">
                  <span className="text-3xl">{icon}</span>
                  <h4 className="font-serif text-xl font-semibold">{title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. THE SCIENCE */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h3 className="font-serif text-3xl md:text-4xl font-bold">The science behind it</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The Memory Palace — also called the Method of Loci — has been used for over 2,500 years. Greek and Roman orators used it to memorize hours-long speeches. Modern memory champions use it to recall thousands of digits.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The technique works because your brain is extraordinarily good at remembering places and vivid images — far better than it is at remembering dry facts. Memory Palace training takes advantage of exactly that.
            </p>
            <div className="grid md:grid-cols-3 gap-6 pt-4 text-left">
              {[
                { title: "Spatial Memory", desc: "Your brain has dedicated pathways for navigating and remembering spaces — pathways that never weaken with age." },
                { title: "Visual Encoding", desc: "Vivid, unusual images create stronger memory traces than plain facts. The stranger the better." },
                { title: "Active Recall", desc: "Retrieving a memory strengthens it. Every walk through your palace makes it more permanent." },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-muted/50 rounded-xl p-5 space-y-2">
                  <h4 className="font-semibold">{title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. OUR STORY */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-muted/30">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h3 className="font-serif text-3xl md:text-4xl font-bold">Our story</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              MemoryAmble was built for one person first — an 84-year-old father who was starting to lose confidence in his own memory. Not because anything was terribly wrong. Just the slow, quiet erosion that comes with time.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We wanted to give him a tool that felt warm, not clinical. Patient, not pushy. Something that made him feel capable — not tested.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Timbuk was born from that. A coach, not a quiz. A companion, not an app.
            </p>
            <p className="text-lg font-medium text-foreground">
              If you have someone in your life who could use a sharper memory and a little more confidence — this is for them.
            </p>
          </div>
        </section>

        {/* 7. OUR MISSION */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h3 className="font-serif text-3xl md:text-4xl font-bold">Our mission</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe memory training should be accessible to everyone — not just students or competitors. And we believe that a sharper mind at any age is worth fighting for.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A portion of every subscription goes to Alzheimer's research and Sanfilippo syndrome research — memory loss at both ends of life. The more people we help remember, the more we can fund the fight to help those who can't.
            </p>
          </div>
        </section>

        {/* 8. PRICING */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-muted/30">
          <div className="max-w-md mx-auto text-center space-y-6">
            <h3 className="font-serif text-3xl md:text-4xl font-bold">Simple pricing</h3>
            <div className="bg-background rounded-2xl border border-border p-8 space-y-6">
              <div>
                <p className="text-5xl font-bold">$8.47</p>
                <p className="text-muted-foreground">per month</p>
              </div>
              <div className="space-y-3 text-left">
                {[
                  "30-day guided memory bootcamp",
                  "Daily sessions with Timbuk",
                  "Streak tracking and badges",
                  "Your palace saved forever",
                  "Round up to donate to memory research",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <span className="text-primary font-bold">✓</span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <Button size="lg" className="w-full text-lg" onClick={() => navigate("/amble")}>
                Start Free — Day 1 Is On Us
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-xs text-muted-foreground">7-day free trial. Cancel anytime.</p>
            </div>
          </div>
        </section>

        {/* 9. FOOTER CTA */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h3 className="font-serif text-3xl md:text-4xl font-bold">Your memory is waiting.</h3>
            <p className="text-lg text-muted-foreground">Ten minutes. That is all it takes to begin.</p>
            <Button size="lg" onClick={() => navigate("/amble")} className="gap-2 text-lg px-8 py-6">
              {currentDay > 1 ? `Continue Day ${currentDay}` : "Start My Free Day"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 px-4 text-center text-sm text-muted-foreground space-y-2">
        <p>© 2025 MemoryAmble. Built with care for those who deserve a sharper mind.</p>
        <p>Questions? <a href="mailto:brightermindlabs@outlook.com" className="text-primary hover:underline">brightermindlabs@outlook.com</a></p>
      </footer>
    </div>
  );
}
