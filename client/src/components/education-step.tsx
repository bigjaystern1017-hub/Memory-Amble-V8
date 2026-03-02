import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, BookOpen, Landmark, Lightbulb, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EducationStepProps {
  onComplete: () => void;
}

const EDUCATION_CARDS = [
  {
    icon: Landmark,
    title: "An Ancient Technique",
    body: "Over 2,500 years ago, a Greek poet named Simonides discovered something remarkable. After a building collapsed, he could remember where every person had been sitting simply by visualizing the room. This discovery became one of the most powerful memory techniques ever known.",
  },
  {
    icon: BookOpen,
    title: "How It Works",
    body: "A Memory Palace uses a place you know well \u2014 like your home, a favorite park, or a childhood school. You take a mental walk through this place, and at specific \"stops\" along the way, you place vivid images of the things you want to remember.",
  },
  {
    icon: Lightbulb,
    title: "Why It Works So Well",
    body: "Our brains are extraordinary at remembering places and images \u2014 much better than remembering lists or words. When you connect something new to a familiar place using a silly, vivid picture, your brain holds onto it naturally. The more bizarre and funny the image, the better you remember it!",
  },
  {
    icon: Sparkles,
    title: "What We'll Do Together",
    body: "In just a few minutes, I'll guide you through building your very own Memory Palace. You'll pick a place you love, choose some stops along the way, and we'll create wonderfully bizarre images to help you remember three items. It's fun, it's easy, and it works beautifully.",
  },
];

export function EducationStep({ onComplete }: EducationStepProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const isLastCard = currentCard === EDUCATION_CARDS.length - 1;

  const handleNext = () => {
    if (isLastCard) {
      onComplete();
    } else {
      setCurrentCard((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentCard > 0) {
      setCurrentCard((prev) => prev - 1);
    }
  };

  const card = EDUCATION_CARDS[currentCard];
  const Icon = card.icon;

  return (
    <div className="space-y-8" data-testid="education-step">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-education-title">
          Welcome to Your Memory Journey
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Let's learn about a remarkable memory technique that has been used for thousands of years.
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentCard}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          <Card className="p-8 md:p-10 border border-border">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-md bg-primary/10 flex items-center justify-center">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold" data-testid={`text-card-title-${currentCard}`}>
                {card.title}
              </h3>
              <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-lg">
                {card.body}
              </p>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {EDUCATION_CARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentCard(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i === currentCard
                  ? "bg-primary w-8"
                  : i < currentCard
                  ? "bg-primary/50"
                  : "bg-border"
              }`}
              data-testid={`button-dot-${i}`}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {currentCard > 0 && (
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
            {isLastCard ? "Let's Begin" : "Next"}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
