import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2, MapPin, Sparkles, RefreshCw, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import type { PalaceSetup, Association } from "@shared/schema";

interface PlacementStepProps {
  palaceSetup: PalaceSetup;
  onComplete: (associations: Association[]) => void;
}

export function PlacementStep({ palaceSetup, onComplete }: PlacementStepProps) {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [currentAssociation, setCurrentAssociation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssociations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest("POST", "/api/generate-associations", {
        placeName: palaceSetup.placeName,
        placeDescription: palaceSetup.placeDescription,
        stops: palaceSetup.stops,
      });
      const data = await response.json();
      setAssociations(data.associations);
      setCurrentAssociation(0);
    } catch (err: any) {
      setError("Something went wrong creating your scenes. Let's try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [palaceSetup]);

  useEffect(() => {
    fetchAssociations();
  }, [fetchAssociations]);

  const handleNext = () => {
    if (currentAssociation < associations.length - 1) {
      setCurrentAssociation((prev) => prev + 1);
    } else {
      onComplete(associations);
    }
  };

  const handleBack = () => {
    if (currentAssociation > 0) {
      setCurrentAssociation((prev) => prev - 1);
    }
  };

  const isLastAssociation = currentAssociation === associations.length - 1;
  const assoc = associations[currentAssociation];

  if (isLoading) {
    return (
      <div className="space-y-8" data-testid="placement-loading">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Creating Your Scenes...
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Your memory coach is crafting vivid, unforgettable images for your palace.
          </p>
        </div>
        <Card className="p-12 md:p-16 border border-border flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <Sparkles className="w-6 h-6 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <p className="text-xl text-muted-foreground font-medium animate-pulse">
            Imagining wonderful things...
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8" data-testid="placement-error">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Oops!
          </h2>
          <p className="text-lg text-muted-foreground">{error}</p>
        </div>
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={fetchAssociations}
            className="gap-2"
            data-testid="button-retry"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!assoc) return null;

  return (
    <div className="space-y-8" data-testid="placement-step">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-placement-title">
          Picture This Scene
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Close your eyes after reading. Really see this in your mind. The more vivid, the better!
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentAssociation}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.97 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className="p-8 md:p-10 border border-border space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Stop {currentAssociation + 1} of 3
                </p>
                <h3 className="text-xl font-semibold" data-testid={`text-stop-name-${currentAssociation}`}>
                  {assoc.stopName}
                </h3>
              </div>
            </div>

            <div className="bg-accent/50 rounded-md p-6 md:p-8 border border-border/50">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-7 h-7 text-primary" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                    Remember: {assoc.object}
                  </p>
                  <p className="text-xl md:text-2xl leading-relaxed font-medium" data-testid={`text-scene-${currentAssociation}`}>
                    {assoc.scene}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-base text-muted-foreground italic">
                Take a moment. Close your eyes and really picture it.
              </p>
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
                i === currentAssociation
                  ? "bg-primary w-8"
                  : i < currentAssociation
                  ? "bg-primary/50"
                  : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {currentAssociation > 0 && (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleBack}
              data-testid="button-back"
            >
              Back
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleNext}
            className="gap-2"
            data-testid="button-next"
          >
            {isLastAssociation ? "I'm Ready to Recall!" : "Next Scene"}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
