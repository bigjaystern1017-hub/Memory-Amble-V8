import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Brain, ArrowLeft, Mail, Eye, EyeOff } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<"choice" | "email-login" | "email-signup">("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/amble");
    return null;
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/amble`,
      },
    });
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    navigate("/amble");
  };

  const handleEmailSignup = async () => {
    if (!email || !password) return;
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Please use at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/amble`,
      },
    });
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    toast({
      title: "Check your email",
      description: "We sent you a confirmation link. Click it to finish signing up.\nDon't see it? Check your junk or spam folder.",
    });
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "email-login") handleEmailLogin();
    else if (mode === "email-signup") handleEmailSignup();
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col" data-testid="login-page">
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
            onClick={() => navigate("/")}
            className="gap-2 text-muted-foreground"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold" data-testid="text-login-title">
              {mode === "email-signup" ? "Create Your Account" : "Sign In"}
            </h2>
            <p className="text-lg text-muted-foreground">
              {mode === "email-signup"
                ? "Join MemoryAmble and start building your Memory Palace."
                : "Welcome back. Sign in to continue your memory training."}
            </p>
          </div>

          {mode === "choice" && (
            <div className="space-y-4">
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-3 text-lg py-6"
                onClick={handleGoogleLogin}
                disabled={loading}
                data-testid="button-google-login"
              >
                <SiGoogle className="w-5 h-5" />
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="bg-background px-3 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                size="lg"
                variant="outline"
                className="w-full gap-3 text-lg py-6"
                onClick={() => setMode("email-login")}
                data-testid="button-email-login"
              >
                <Mail className="w-5 h-5" />
                Sign in with Email
              </Button>

              <p className="text-center text-muted-foreground">
                New here?{" "}
                <button
                  onClick={() => setMode("email-signup")}
                  className="text-primary underline cursor-pointer"
                  data-testid="link-signup"
                >
                  Create an account
                </button>
              </p>
            </div>
          )}

          {(mode === "email-login" || mode === "email-signup") && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-base font-medium">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="text-lg py-5"
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-base font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "email-signup" ? "At least 6 characters" : "Your password"}
                    className="text-lg py-5 pr-12"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full text-lg py-6"
                disabled={loading}
                data-testid="button-submit-auth"
              >
                {loading
                  ? "Please wait..."
                  : mode === "email-signup"
                  ? "Create Account"
                  : "Sign In"}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMode("choice");
                    setEmail("");
                    setPassword("");
                  }}
                  className="text-muted-foreground underline cursor-pointer"
                  data-testid="button-back-to-choice"
                >
                  Back to options
                </button>
                {mode === "email-login" ? (
                  <button
                    type="button"
                    onClick={() => setMode("email-signup")}
                    className="text-primary underline cursor-pointer"
                    data-testid="link-switch-signup"
                  >
                    Create account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode("email-login")}
                    className="text-primary underline cursor-pointer"
                    data-testid="link-switch-login"
                  >
                    Sign in instead
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
