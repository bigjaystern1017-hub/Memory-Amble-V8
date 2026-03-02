import { useState } from "react";
import type { PalaceSetup, Association, WalkthroughAnswer } from "@shared/schema";
import { EducationStep } from "@/components/education-step";
import { InterviewStep } from "@/components/interview-step";
import { PlacementStep } from "@/components/placement-step";
import { WalkthroughStep } from "@/components/walkthrough-step";
import { ResultsStep } from "@/components/results-step";
import { ProgressBar } from "@/components/progress-bar";
import { Brain } from "lucide-react";

type AppStep = "education" | "interview" | "placement" | "walkthrough" | "results";

const STEP_ORDER: AppStep[] = ["education", "interview", "placement", "walkthrough", "results"];
const STEP_LABELS = ["Learn", "Your Palace", "Remember", "Recall", "Results"];

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AppStep>("education");
  const [palaceSetup, setPalaceSetup] = useState<PalaceSetup | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [answers, setAnswers] = useState<WalkthroughAnswer[]>([]);

  const currentIndex = STEP_ORDER.indexOf(currentStep);

  const handleEducationComplete = () => setCurrentStep("interview");

  const handleInterviewComplete = (setup: PalaceSetup) => {
    setPalaceSetup(setup);
    setCurrentStep("placement");
  };

  const handlePlacementComplete = (newAssociations: Association[]) => {
    setAssociations(newAssociations);
    setCurrentStep("walkthrough");
  };

  const handleWalkthroughComplete = (newAnswers: WalkthroughAnswer[]) => {
    setAnswers(newAnswers);
    setCurrentStep("results");
  };

  const handleRestart = () => {
    setPalaceSetup(null);
    setAssociations([]);
    setAnswers([]);
    setCurrentStep("education");
  };

  return (
    <div className="min-h-screen bg-background" data-testid="app-container">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight" data-testid="text-app-title">MemoryAmble</h1>
              <p className="text-sm text-muted-foreground">Your Gentle Memory Coach</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-6 pb-2">
        <ProgressBar
          steps={STEP_LABELS}
          currentIndex={currentIndex}
        />
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {currentStep === "education" && (
          <EducationStep onComplete={handleEducationComplete} />
        )}
        {currentStep === "interview" && (
          <InterviewStep onComplete={handleInterviewComplete} />
        )}
        {currentStep === "placement" && palaceSetup && (
          <PlacementStep
            palaceSetup={palaceSetup}
            onComplete={handlePlacementComplete}
          />
        )}
        {currentStep === "walkthrough" && associations.length > 0 && (
          <WalkthroughStep
            associations={associations}
            onComplete={handleWalkthroughComplete}
          />
        )}
        {currentStep === "results" && (
          <ResultsStep
            answers={answers}
            associations={associations}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}
