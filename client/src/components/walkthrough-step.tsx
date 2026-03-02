import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, MapPin, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Association, WalkthroughAnswer } from "@shared/schema";

interface WalkthroughStepProps {
  associations: Association[];
  onComplete: (answers: WalkthroughAnswer[]) => void;
}

export function WalkthroughStep({ associations, onComplete }: WalkthroughStepProps) {
  const [currentStop, setCurrentStop] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [results, setResults] = useState<WalkthroughAnswer[]>([]);

  const currentAssoc = associations[currentStop];

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStop] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    const answer: WalkthroughAnswer = {
      stopName: currentAssoc.stopName,
      userAnswer: answers[currentStop].trim(),
      correctObject: currentAssoc.object,
      isCorrect:
        answers[currentStop]
          .trim()
          .toLowerCase()
          .includes(
            currentAssoc.object
              .replace(/^a\s+/i, "")
              .replace(/^an\s+/i, "")
              .replace(/^the\s+/i, "")
              .split(" ")
              .pop()!
              .toLowerCase()
          ),
    };

    const newResults = [...results, answer];
    setResults(newResults);

    if (currentStop < associations.length - 1) {
      setCurrentStop((prev) => prev + 1);
    } else {
      onComplete(newResults);
    }
  };

  return (
    <div className="space-y-8" data-testid="walkthrough-step">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-walkthrough-title">
          Walk Through Your Palace
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Take a mental stroll through your palace. At each stop, what do you see?
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStop}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="p-8 md:p-10 border border-border space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Stop {currentStop + 1} of 3
                </p>
                <h3 className="text-xl font-semibold" data-testid={`text-recall-stop-${currentStop}`}>
                  {currentAssoc.stopName}
                </h3>
              </div>
            </div>

            <div className="bg-accent/30 rounded-md p-6 border border-border/50 text-center space-y-4">
              <Eye className="w-10 h-10 text-primary mx-auto" />
              <p className="text-xl md:text-2xl font-medium leading-relaxed">
                You're standing at <strong>{currentAssoc.stopName}</strong>.
                <br />
                Look around... What unusual thing do you see here?
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="answer" className="text-lg font-medium">
                What do you see at this stop?
              </Label>
              <Input
                id="answer"
                value={answers[currentStop]}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type what you remember seeing here..."
                className="text-lg h-14"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && answers[currentStop].trim()) {
                    handleNext();
                  }
                }}
                data-testid={`input-answer-${currentStop}`}
                autoFocus
              />
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-3">
          {associations.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i === currentStop
                  ? "bg-primary w-8"
                  : i < currentStop
                  ? "bg-primary/50"
                  : "bg-border"
              }`}
            />
          ))}
        </div>

        <Button
          size="lg"
          onClick={handleNext}
          disabled={!answers[currentStop].trim()}
          className="gap-2"
          data-testid="button-submit-answer"
        >
          {currentStop < associations.length - 1 ? "Next Stop" : "See My Results"}
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
