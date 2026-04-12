import { useState, useRef, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { Trophy, Flame, ArrowLeft, Eye, EyeOff, Download } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import timbukAvatar from "@assets/timbuk-avatar_1773957235129.png";

export interface PendingSessionData {
  date: string;
  level: number;
  category: string;
  score: number;
  totalItems: number;
  assignments: Array<{ stopName: string; object: string }>;
  placeName: string;
  stops: string[];
  dayCount: number;
}

interface AmbleResultsProps {
  correctCount: number;
  totalItems: number;
  streak: number;
  onContinue: () => void;
  isGuest?: boolean;
  userName?: string;
  dayCount?: number;
  currentDay?: number;
  placeName?: string;
  stops?: string[];
  pendingSession?: PendingSessionData;
  userScenes?: string[];
  assignments?: Array<{ stopName: string; object: string }>;
}

const CONFETTI_COUNT = 40;

function ConfettiPiece({ index }: { index: number }) {
  const left = `${(index * 2.5) % 100}%`;
  const delay = `${(index * 0.07) % 1.5}s`;
  const duration = `${1.8 + (index % 6) * 0.2}s`;
  const size = index % 3 === 0 ? 10 : index % 3 === 1 ? 7 : 5;
  const isAmber = index % 2 === 0;
  return (
    <div
      style={{
        position: "absolute",
        top: "-20px",
        left,
        width: size,
        height: size,
        backgroundColor: isAmber ? "#d97706" : "#fef3c7",
        animation: `confettiFall ${duration} ${delay} ease-in forwards`,
      }}
    />
  );
}

function Confetti() {
  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
        {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>
    </>
  );
}

function GraduationBadge({ name, onSave }: { name: string; onSave: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 10;

    const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    grad.addColorStop(0, "#fbbf24");
    grad.addColorStop(1, "#d97706");
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
    ctx.strokeStyle = "#fef3c7";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#fef3c7";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 34px Georgia, serif";
    ctx.fillText("Memory Wiz", cx, cy - 16);

    if (name && name !== "friend") {
      ctx.font = "16px Georgia, serif";
      ctx.fillText(name, cx, cy + 18);
    }

    ctx.font = "11px Georgia, serif";
    ctx.fillStyle = "rgba(254,243,199,0.8)";
    ctx.fillText("Week 1 Graduate", cx, cy + 40);
  }, [name]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "memory-wiz-badge.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    onSave();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-2xl scale-110" />
        <canvas
          ref={canvasRef}
          className="relative rounded-full shadow-xl"
          style={{ width: 180, height: 180 }}
          data-testid="badge-canvas"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
        onClick={handleSave}
        data-testid="button-save-badge"
      >
        <Download className="w-4 h-4" />
        Save Badge
      </Button>
    </div>
  );
}

export function AmbleResults({
  correctCount,
  totalItems,
  streak,
  onContinue,
  isGuest,
  userName,
  dayCount = 0,
  currentDay = 0,
  placeName,
  stops = [],
  pendingSession,
  userScenes,
  assignments,
}: AmbleResultsProps) {
  const percentage = totalItems > 0 ? Math.round((correctCount / totalItems) * 100) : 0;
  const isPerfect = totalItems > 0 && correctCount === totalItems;
  const isGraduation = currentDay === 7 && correctCount >= totalItems * 0.8;

  const [showConversion, setShowConversion] = useState(false);
  const [shareButtonText, setShareButtonText] = useState("Share My Scroll");
  const [authMode, setAuthMode] = useState<"choice" | "email">("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [authError, setAuthError] = useState("");
  const [badgeSaved, setBadgeSaved] = useState(false);
  const [scrollPhase, setScrollPhase] = useState<"hidden" | "prompt" | "loading" | "revealed">("prompt");
  const [scrollText, setScrollText] = useState("");

  const nextDay = dayCount + 2;
  const displayName = userName || "friend";

  const storePendingMigration = () => {
    if (pendingSession) {
      localStorage.setItem("memory-amble-pending-session", JSON.stringify(pendingSession));
      localStorage.setItem("memory-amble-checkout-pending", "true");
    }
  };

  const redirectToCheckout = async (token: string, userEmail: string) => {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: userEmail }),
    });
    if (!res.ok) throw new Error("Checkout session creation failed");
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  const handleSeeYouTomorrow = () => {
    playSound("click");
    if (isGuest) {
      setShowConversion(true);
    } else {
      onContinue();
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    storePendingMigration();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/amble` },
    });
    if (error) {
      setAuthError(error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) return;
    setLoading(true);
    setAuthError("");

    if (isSignup) {
      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/amble` },
      });
      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }
      storePendingMigration();
      setEmailSent(true);
      setLoading(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }
      storePendingMigration();
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const token = authSession?.access_token;
        if (token) {
          await redirectToCheckout(token, email);
          return;
        }
      } catch (e) {
        console.error("Checkout redirect failed:", e);
      }
      window.location.reload();
    }
  };

  const handleShowScroll = async () => {
    playSound("click");
    setScrollPhase("loading");
    playSound("magic-transition");
    try {
      const stopsWithScenes = (assignments || []).map((a, i) => ({
        stopName: a.stopName,
        object: a.object,
        userScene: userScenes?.[i] || "",
      }));
      const res = await fetch("/api/generate-scroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: displayName,
          palaceName: placeName || "your palace",
          dayNumber: currentDay || 1,
          correctCount,
          totalItems,
          stops: stopsWithScenes,
        }),
      });
      const data = await res.json();
      setScrollText(data.scroll || "");
      setScrollPhase("revealed");
    } catch {
      setScrollText(`${displayName} walked through ${placeName || "the palace"} today and found the most extraordinary things waiting at every turn. Timbuk was not even slightly surprised.`);
      setScrollPhase("revealed");
    }
  };

  const getMilestoneNudge = (day: number) => {
    if (day === 2) return "One more day and something interesting happens.";
    if (day === 3) return "Three days. The palace is starting to feel familiar.";
    if (day === 7) return "Seven days. Memory champions start somewhere. You started here.";
    if (day === 14) return "Two weeks. Your brain has been quietly rewiring itself.";
    if (day === 30) return "Thirty days. Timbuk has something special for you today.";
    return null;
  };

  const ScoreSummary = () => (
    <div className="flex items-center justify-center gap-8 py-4 px-6 bg-accent/40 rounded-2xl border border-border/50">
      <div className="text-center">
        <p className="text-4xl font-bold font-serif">
          {correctCount}
          <span className="text-lg text-muted-foreground ml-1">of {totalItems}</span>
        </p>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Today</p>
      </div>
      <div className="h-10 w-px bg-border" />
      <div className="text-center">
        <div className="flex items-center gap-1.5">
          <Flame className="w-5 h-5 text-orange-500" />
          <p className="text-4xl font-bold font-serif">{streak}</p>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
          {streak === 1 ? "Day" : "Days"}
        </p>
      </div>
    </div>
  );

  if (showConversion) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center px-4 py-10">
        <div className="max-w-md w-full mx-auto space-y-7">
          <ScoreSummary />

          <div className="text-center space-y-2">
            <h1 className="font-serif text-2xl md:text-3xl font-semibold leading-snug">
              Save your progress, {displayName} —
              <br />
              Day {nextDay} is waiting.
            </h1>
            <p className="text-muted-foreground text-base">
              Create a free account and we'll keep everything safe for you.
            </p>
          </div>

          {placeName && stops.length > 0 && (
            <div className="bg-background border border-border/60 rounded-xl p-4 space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Your Memory Palace
              </p>
              <p className="font-medium text-foreground capitalize">{placeName}</p>
              <ol className="space-y-0.5">
                {stops.map((stop, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary/60 font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
                    <span className="capitalize">{stop}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {emailSent ? (
            <div className="text-center space-y-2 py-4">
              <p className="text-foreground font-medium">Check your inbox!</p>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to <strong>{email}</strong>. Click it to finish saving your progress.
              </p>
              <p className="text-xs text-muted-foreground mt-1">Don't see it? Check your junk or spam folder.</p>
            </div>
          ) : authMode === "choice" ? (
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full gap-3 text-base"
                onClick={handleGoogleAuth}
                disabled={loading}
                data-testid="button-google-auth"
              >
                <SiGoogle className="w-4 h-4" />
                Continue with Google
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-3 text-base"
                onClick={() => setAuthMode("email")}
                data-testid="button-email-auth"
              >
                Continue with Email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 text-sm border-b border-border pb-3">
                <button
                  className={`flex-1 py-1 font-medium transition-colors ${isSignup ? "text-primary border-b-2 border-primary -mb-[13px]" : "text-muted-foreground"}`}
                  onClick={() => { setIsSignup(true); setAuthError(""); }}
                >
                  Create Account
                </button>
                <button
                  className={`flex-1 py-1 font-medium transition-colors ${!isSignup ? "text-primary border-b-2 border-primary -mb-[13px]" : "text-muted-foreground"}`}
                  onClick={() => { setIsSignup(false); setAuthError(""); }}
                >
                  Sign In
                </button>
              </div>
              <div className="space-y-3 pt-1">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authError && <p className="text-sm text-destructive">{authError}</p>}
                <Button
                  size="lg"
                  className="w-full text-base"
                  onClick={handleEmailAuth}
                  disabled={loading || !email || !password}
                  data-testid="button-submit-email"
                >
                  {loading ? "Saving..." : isSignup ? "Create Account & Save Progress" : "Sign In & Save Progress"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => { setAuthMode("choice"); setAuthError(""); }}
                >
                  ← Back
                </Button>
              </div>
            </div>
          )}

          {!emailSent && (
            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              Your first day is free. From Day 2 it's{" "}
              <span className="font-medium text-foreground">$8.99/month</span> — cancel anytime.{" "}
              <span className="line-through">$16.99/month</span>
            </p>
          )}

          <button
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
            onClick={onContinue}
            data-testid="button-skip-conversion"
          >
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  if (isGraduation) {
    return (
      <>
        {isPerfect && <Confetti />}
        <div className="min-h-dvh bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center px-4 py-10">
          <div className="max-w-md w-full mx-auto space-y-8 text-center">
            <GraduationBadge name={displayName} onSave={() => setBadgeSaved(true)} />

            <div className="space-y-5">
              <p className="font-serif text-lg leading-relaxed text-foreground">
                {displayName}. Stop for a moment. Look what you did this week.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                You built your first Memory Palace. Cleaned it. Walked it forward and backward. Used it for real life. Learned names.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Seven days ago you had never heard of a Memory Palace. Today you have one.
              </p>
              <p className="font-serif text-lg font-semibold text-foreground">
                That is not nothing, {displayName}. That is actually extraordinary.
              </p>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold font-serif">{correctCount}<span className="text-sm text-muted-foreground ml-1">of {totalItems}</span></p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Today</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <p className="text-3xl font-bold font-serif">{streak}</p>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{streak === 1 ? "Day" : "Days"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground leading-relaxed">
                Wear it proudly. Rest that noggin this weekend. When you come back, we start Week 2.
              </p>
              <p className="font-serif text-foreground font-medium">
                Good memorizing, {displayName}. Over and out.
              </p>
            </div>

            {badgeSaved && (
              <p className="text-xs text-primary font-medium" data-testid="text-badge-saved">
                Badge saved to your downloads!
              </p>
            )}

            <Button
              size="lg"
              onClick={handleSeeYouTomorrow}
              className="gap-2 text-lg px-8 py-6 w-full sm:w-auto"
              data-testid="button-see-you-tomorrow"
            >
              <ArrowLeft className="w-5 h-5" />
              Start Week 2
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isPerfect && scrollPhase === "hidden" && <Confetti />}
      <div className="min-h-dvh bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-2xl mx-auto w-full space-y-6">

          {/* SCROLL PHASE — prompt, loading, or revealed */}
          {scrollPhase === "prompt" && (
            <div className="text-center space-y-6">
              {isPerfect && <Confetti />}
              <div className="flex justify-center">
                <img src={timbukAvatar} alt="Timbuk" className="w-16 h-16 rounded-full" />
              </div>
              <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed">
                I wrote you something while you were walking.<br />Shall I show you?
              </p>
              <Button
                size="lg"
                onClick={handleShowScroll}
                className="gap-2 text-lg px-8 py-6"
                data-testid="button-show-scroll"
              >
                Show me
              </Button>
            </div>
          )}

          {scrollPhase === "loading" && (
            <div className="text-center space-y-3 py-12">
              <img src={timbukAvatar} alt="Timbuk" className="w-16 h-16 rounded-full mx-auto" />
              <p className="text-foreground font-medium">Timbuk is writing your scroll...</p>
              <p className="text-sm text-muted-foreground italic">He takes these seriously.</p>
            </div>
          )}

          {scrollPhase === "revealed" && (
            <div className="space-y-6">
              {/* THE SCROLL */}
              <div
                className="rounded-2xl p-6 md:p-8 space-y-4 border border-amber-200"
                style={{
                  background: "linear-gradient(135deg, #fef9f0 0%, #fdf3e0 50%, #fef9f0 100%)",
                  boxShadow: "0 4px 24px rgba(180, 140, 80, 0.15)",
                }}
                data-testid="amble-scroll-card"
              >
                {/* Scroll header */}
                <div className="flex items-center gap-3 pb-3 border-b border-amber-200/60">
                  <img src={timbukAvatar} alt="Timbuk" className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div>
                    <p className="font-serif text-sm font-semibold text-amber-900">The Amble Scroll of {displayName}</p>
                    <p className="text-xs text-amber-700/70">{placeName || "Your Palace"} — Day {currentDay || 1}</p>
                  </div>
                </div>

                {/* Scroll body */}
                <p className="font-serif text-base md:text-lg leading-relaxed text-amber-950">
                  {scrollText}
                </p>

                {/* Scroll footer */}
                <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between">
                  <p className="text-xs text-amber-700/60">Built with Timbuk</p>
                  <p className="text-xs text-amber-700/60">MemoryAmble.com</p>
                </div>
              </div>

              {/* Share prompt */}
              <div className="text-center space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  If it made you smile — it might do the same for someone you love.
                </p>
                <div className="space-y-2">
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => {
                      playSound("click");
                      const shareText = `${scrollText}\n\nBuild your own Memory Palace → MemoryAmble.com`;
                      if (navigator.share) {
                        navigator.share({
                          title: `My Amble Scroll — ${displayName}`,
                          text: shareText,
                        }).catch(() => {});
                        return;
                      }
                      navigator.clipboard.writeText(shareText).then(() => {
                        setShareButtonText("Copied!");
                        setTimeout(() => setShareButtonText("Share My Scroll"), 2000);
                      }).catch(() => {});
                    }}
                    data-testid="button-share-scroll"
                  >
                    {shareButtonText}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your scroll is yours. We don't post anything without your tap.
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Score section */}
              <div className="bg-background border border-primary/20 rounded-2xl p-6 space-y-4 text-center">
                <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">How you did</p>
                <p className="text-5xl font-bold font-serif">
                  {correctCount}
                  <span className="text-xl text-muted-foreground ml-2">of {totalItems}</span>
                </p>
                <p className="text-muted-foreground">
                  {correctCount === totalItems
                    ? "Your palace held everything."
                    : correctCount >= totalItems * 0.66
                    ? "Your palace is working."
                    : correctCount >= 1
                    ? "The pictures are taking shape."
                    : "You built a palace and walked through it. That's a real start."}
                </p>
                {streak > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <p className="text-lg font-semibold">{streak} days in a row. Timbuk has stopped being surprised.</p>
                  </div>
                )}
                {getMilestoneNudge(currentDay || 0) && (
                  <p className="text-sm text-primary font-medium italic">
                    {getMilestoneNudge(currentDay || 0)}
                  </p>
                )}
              </div>

              {/* See you tomorrow */}
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground italic">
                  Your palace will be exactly as you left it.
                </p>
                <Button
                  size="lg"
                  onClick={handleSeeYouTomorrow}
                  className="gap-2 text-lg px-8 py-6 w-full sm:w-auto"
                  data-testid="button-see-you-tomorrow"
                >
                  See You Tomorrow
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
