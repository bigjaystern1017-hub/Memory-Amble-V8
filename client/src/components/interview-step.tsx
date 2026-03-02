import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Home, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PalaceSetup } from "@shared/schema";

interface InterviewStepProps {
  onComplete: (setup: PalaceSetup) => void;
}

const PLACE_SUGGESTIONS = [
  "My childhood home",
  "My current house",
  "My grandmother's kitchen",
  "My favorite park",
  "My old school",
  "My local church",
];

export function InterviewStep({ onComplete }: InterviewStepProps) {
  const [phase, setPhase] = useState<"place" | "stops">("place");
  const [placeName, setPlaceName] = useState("");
  const [stops, setStops] = useState(["", "", ""]);

  const canProceedToStops = placeName.trim().length > 0;
  const canFinish = stops.every((s) => s.trim().length > 0);

  const handleStopChange = (index: number, value: string) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  const handleComplete = () => {
    onComplete({
      placeName: placeName.trim(),
      stops: stops.map((s) => ({ name: s.trim() })),
    });
  };

  return (
    <div className="space-y-8" data-testid="interview-step">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-interview-title">
          {phase === "place" ? "Choose Your Palace" : "Pick Your Stops"}
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {phase === "place"
            ? "Think of a place you know very well. Somewhere you can easily picture in your mind."
            : `Now think of 3 specific spots inside "${placeName}" that you walk past naturally.`}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {phase === "place" ? (
          <motion.div
            key="place"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 md:p-10 border border-border space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Your Special Place</h3>
                  <p className="text-muted-foreground">A place you can see clearly in your mind</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="place-name" className="text-lg font-medium">
                  What is this place?
                </Label>
                <Input
                  id="place-name"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="e.g., My childhood home"
                  className="text-lg h-14"
                  data-testid="input-place-name"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground font-medium">Or choose one of these:</p>
                <div className="flex flex-wrap gap-2">
                  {PLACE_SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant={placeName === suggestion ? "default" : "secondary"}
                      onClick={() => setPlaceName(suggestion)}
                      data-testid={`button-suggestion-${suggestion.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="stops"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 md:p-10 border border-border space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">3 Stops in {placeName}</h3>
                  <p className="text-muted-foreground">Specific spots you pass on a mental walk-through</p>
                </div>
              </div>

              {stops.map((stop, i) => (
                <div key={i} className="space-y-2">
                  <Label htmlFor={`stop-${i}`} className="text-lg font-medium">
                    Stop {i + 1}
                  </Label>
                  <Input
                    id={`stop-${i}`}
                    value={stop}
                    onChange={(e) => handleStopChange(i, e.target.value)}
                    placeholder={
                      i === 0
                        ? "e.g., The front door"
                        : i === 1
                        ? "e.g., The kitchen table"
                        : "e.g., The living room couch"
                    }
                    className="text-lg h-14"
                    data-testid={`input-stop-${i}`}
                  />
                </div>
              ))}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            if (phase === "stops") setPhase("place");
          }}
          disabled={phase === "place"}
          className="gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Button>

        {phase === "place" ? (
          <Button
            size="lg"
            onClick={() => setPhase("stops")}
            disabled={!canProceedToStops}
            className="gap-2"
            data-testid="button-next"
          >
            Next: Pick Stops
            <ArrowRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleComplete}
            disabled={!canFinish}
            className="gap-2"
            data-testid="button-create-palace"
          >
            Create My Palace
            <ArrowRight className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
