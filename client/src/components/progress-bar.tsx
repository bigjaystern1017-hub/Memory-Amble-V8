import { Check } from "lucide-react";

interface ProgressBarProps {
  steps: string[];
  currentIndex: number;
}

export function ProgressBar({ steps, currentIndex }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-between gap-1" data-testid="progress-bar">
      {steps.map((label, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-center">
              {i > 0 && (
                <div
                  className={`flex-1 h-1 rounded-full transition-colors duration-500 ${
                    i <= currentIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 transition-all duration-500 ${
                  isComplete
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`step-indicator-${i}`}
              >
                {isComplete ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 rounded-full transition-colors duration-500 ${
                    i < currentIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
            <span
              className={`text-xs font-medium transition-colors duration-300 ${
                isCurrent
                  ? "text-foreground"
                  : isComplete
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
