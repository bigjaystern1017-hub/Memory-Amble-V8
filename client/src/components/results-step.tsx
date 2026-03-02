import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, RotateCcw, Trophy, Heart, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { Association, WalkthroughAnswer } from "@shared/schema";

interface ResultsStepProps {
  answers: WalkthroughAnswer[];
  associations: Association[];
  onRestart: () => void;
}

export function ResultsStep({ answers, associations, onRestart }: ResultsStepProps) {
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const total = answers.length;

  const getMessage = () => {
    if (correctCount === total) {
      return {
        icon: Trophy,
        title: "Perfect Score!",
        subtitle: "You remembered everything! Your Memory Palace is working beautifully.",
        color: "text-primary",
      };
    }
    if (correctCount >= Math.ceil(total / 2)) {
      return {
        icon: Star,
        title: "Well Done!",
        subtitle: "You're getting the hang of this! The more you practice, the stronger your palace becomes.",
        color: "text-primary",
      };
    }
    return {
      icon: Heart,
      title: "Great Effort!",
      subtitle: "Memory is a skill that grows with practice. Every attempt makes your brain stronger. Let's try again!",
      color: "text-primary",
    };
  };

  const message = getMessage();
  const Icon = message.icon;

  return (
    <div className="space-y-8" data-testid="results-step">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Icon className={`w-10 h-10 ${message.color}`} />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-results-title">
          {message.title}
        </h2>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {message.subtitle}
        </p>
        <p className="text-2xl font-bold" data-testid="text-score">
          {correctCount} out of {total} correct
        </p>
      </motion.div>

      <div className="space-y-4">
        {answers.map((answer, i) => {
          const assoc = associations[i];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
            >
              <Card className="p-6 md:p-8 border border-border space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        answer.isCorrect
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      {answer.isCorrect ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stop {i + 1}</p>
                      <h3 className="text-lg font-semibold">{answer.stopName}</h3>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Your answer</p>
                    <p className="text-lg" data-testid={`text-user-answer-${i}`}>
                      {answer.userAnswer || "(no answer)"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">The object was</p>
                    <p className="text-lg font-semibold" data-testid={`text-correct-answer-${i}`}>
                      {answer.correctObject}
                    </p>
                  </div>
                </div>

                {assoc && (
                  <div className="bg-accent/30 rounded-md p-4 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1 font-medium">The scene was:</p>
                    <p className="text-base leading-relaxed">{assoc.scene}</p>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={onRestart}
          className="gap-2"
          data-testid="button-restart"
        >
          <RotateCcw className="w-5 h-5" />
          Try Again with a New Palace
        </Button>
      </div>
    </div>
  );
}
