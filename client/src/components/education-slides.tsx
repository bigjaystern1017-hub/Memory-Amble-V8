import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { playSound } from "@/lib/sounds";

interface EducationSlidesProps {
  onComplete: () => void;
}

const GOALS = [
  { id: "names", label: "Remembering names and faces" },
  { id: "sharp", label: "Staying sharp for the people I love" },
  { id: "active", label: "Keeping my mind active and strong" },
  { id: "curious", label: "Just curious — let's see" },
];

export function EducationSlides({ onComplete }: EducationSlidesProps) {
  const [screen, setScreen] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const handleGoalSelect = (id: string) => {
    playSound("click");
    setSelectedGoal(id);
  };

  const handleGoalContinue = () => {
    if (!selectedGoal) return;
    playSound("click");
    localStorage.setItem("memoryamble-goal", selectedGoal);
    setScreen(1);
  };

  if (screen === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 md:px-6 py-10">
        <div className="max-w-lg w-full space-y-8">
          <div className="text-center space-y-3">
            <p className="text-sm uppercase tracking-widest font-medium" style={{color: '#7C3AED'}}>Before we begin</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
              What matters most to you right now?
            </h2>
            <p className="text-muted-foreground">Timbuk will use this to personalise your experience.</p>
          </div>
          <div className="space-y-3">
            {GOALS.map((goal) => (
              <button
                key={goal.id}
                onClick={() => handleGoalSelect(goal.id)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium text-base ${
                  selectedGoal === goal.id
                    ? "border-purple-600 bg-purple-50 text-purple-900"
                    : "border-border bg-background hover:border-purple-300 hover:bg-purple-50/30"
                }`}
                style={selectedGoal === goal.id ? {borderColor: '#7C3AED', backgroundColor: '#f5f0ff'} : {}}
              >
                {goal.label}
              </button>
            ))}
          </div>
          <Button
            size="lg"
            className="w-full gap-2 text-lg"
            style={{backgroundColor: '#7C3AED'}}
            onClick={handleGoalContinue}
            disabled={!selectedGoal}
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  if (screen === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 md:px-6 py-10">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="text-5xl">🧠</div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
              Your brain already knows how to do this.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We just show it the door.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-left space-y-3">
            <p className="font-serif text-lg leading-relaxed text-amber-900">
              "The Memory Palace is a 2,500 year old technique used by scholars, orators, and memory champions. It works because your brain is extraordinary at remembering places and vivid images — far better than dry facts."
            </p>
            <p className="text-sm text-amber-700 italic">— Timbuk</p>
          </div>
          <Button
            size="lg"
            className="w-full gap-2 text-lg"
            style={{backgroundColor: '#7C3AED'}}
            onClick={() => { playSound("click"); setScreen(2); }}
          >
            Tell me more
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  if (screen === 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 md:px-6 py-10">
        <div className="max-w-lg w-full space-y-8">
          <div className="text-center space-y-3">
            <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
              Here is how it works.
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { emoji: "🏠", title: "Pick a place you know", body: "Your home, a favourite walk, somewhere you've been a thousand times. That's your Memory Palace. It already exists." },
              { emoji: "🍍", title: "Plant vivid images", body: "Timbuk gives you items. You make them strange, personal, yours. The weirder the better — that's the whole secret." },
              { emoji: "🚶", title: "Walk and recall", body: "Stroll through your palace in your mind. Whatever you planted will be waiting. Every single time." },
            ].map(({ emoji, title, body }) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-3xl shrink-0">{emoji}</span>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <Button
            size="lg"
            className="w-full gap-2 text-lg"
            style={{backgroundColor: '#7C3AED'}}
            onClick={() => { playSound("click"); setScreen(3); }}
          >
            I'm ready
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 md:px-6 py-10">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="text-5xl">✨</div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
            No test. No pressure.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Most people remember more than they expect on Day 1.
          </p>
          <p className="text-muted-foreground">
            Timbuk teaches through doing, not lecturing. You'll be building your first Memory Palace in minutes.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full gap-2 text-lg"
          style={{backgroundColor: '#7C3AED'}}
          onClick={() => { playSound("click"); onComplete(); }}
        >
          Let's go
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
