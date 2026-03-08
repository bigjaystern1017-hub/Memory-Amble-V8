import { BookOpen, MapPin, Sparkles, Eye, Trophy, Wind } from "lucide-react";

const defaultSteps = [
  { label: "Learn", icon: BookOpen },
  { label: "Your Palace", icon: MapPin },
  { label: "Remember", icon: Sparkles },
  { label: "Recall", icon: Eye },
  { label: "Results", icon: Trophy },
];

const cleaningSteps = [
  { label: "Cleaning", icon: Wind },
  { label: "Your Palace", icon: MapPin },
  { label: "Remember", icon: Sparkles },
  { label: "Recall", icon: Eye },
  { label: "Results", icon: Trophy },
];

interface ProgressBarProps {
  currentStep: number;
  isCleaning?: boolean;
}

export function ProgressBar({ currentStep, isCleaning }: ProgressBarProps) {
  const steps = isCleaning ? cleaningSteps : defaultSteps;
  return (
    <div className="flex items-center justify-center gap-1 md:gap-2 py-3" data-testid="progress-bar">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === currentStep;
        const isComplete = i < currentStep;

        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`progress-step-${i}`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span
                className={`text-sm md:text-base font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : isComplete
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-4 md:w-8 h-0.5 mx-1 mb-5 transition-colors ${
                  i < currentStep ? "bg-primary/30" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
