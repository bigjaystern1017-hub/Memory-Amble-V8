import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, User } from "lucide-react";

const CHAR_DELAY_MS = 40;

interface ChatMessageProps {
  sender: "timbuk" | "gladys";
  text: string;
  isTyping?: boolean;
  typewriter?: boolean;
  onTypewriterDone?: () => void;
  fastForward?: boolean;
  onSkipTyping?: () => void;
}

function TypewriterText({ text, onDone, fastForward }: { text: string; onDone?: () => void; fastForward?: boolean }) {
  const [charIndex, setCharIndex] = useState(0);
  const doneRef = useRef(false);
  const containerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (fastForward && !doneRef.current) {
      doneRef.current = true;
      setCharIndex(text.length);
      onDone?.();
      return;
    }

    if (charIndex >= text.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      setCharIndex((prev) => prev + 1);
    }, CHAR_DELAY_MS);

    return () => clearTimeout(timer);
  }, [charIndex, text.length, onDone, fastForward, text]);

  useEffect(() => {
    if (fastForward || charIndex % 5 === 0) {
      if (containerRef.current) {
        const el = containerRef.current.closest("[data-testid='chat-scroll']");
        if (el) {
          requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
          });
        }
      }
    }
  }, [charIndex, fastForward]);

  return (
    <p ref={containerRef} className="text-xl md:text-2xl leading-relaxed whitespace-pre-wrap">
      {text.slice(0, charIndex)}
      {charIndex < text.length && (
        <span className="inline-block w-0.5 h-5 md:h-6 bg-foreground/40 animate-pulse ml-0.5 align-text-bottom" />
      )}
    </p>
  );
}

export function ChatMessage({ sender, text, isTyping, typewriter, onTypewriterDone, fastForward, onSkipTyping }: ChatMessageProps) {
  const isTimbuk = sender === "timbuk";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 ${isTimbuk ? "justify-start" : "justify-end"}`}
      data-testid={`message-${sender}`}
    >
      {isTimbuk && (
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
      )}

      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-md px-5 py-4 flex flex-col gap-2 ${
          isTimbuk
            ? "bg-card border border-border text-card-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {isTyping ? (
          <div className="flex items-center gap-1.5 py-1">
            <motion.div
              className={`w-2 h-2 rounded-full ${isTimbuk ? "bg-muted-foreground" : "bg-primary-foreground/60"}`}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className={`w-2 h-2 rounded-full ${isTimbuk ? "bg-muted-foreground" : "bg-primary-foreground/60"}`}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className={`w-2 h-2 rounded-full ${isTimbuk ? "bg-muted-foreground" : "bg-primary-foreground/60"}`}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        ) : typewriter ? (
          <div className="flex gap-2 items-start">
            <TypewriterText text={text} onDone={onTypewriterDone} fastForward={fastForward} />
            {onSkipTyping && (
              <button
                onClick={onSkipTyping}
                className="text-xs font-medium underline text-muted-foreground hover:text-foreground whitespace-nowrap pt-0.5"
                data-testid="button-skip-typing"
              >
                Skip
              </button>
            )}
          </div>
        ) : (
          <p className="text-xl md:text-2xl leading-relaxed whitespace-pre-wrap">{text}</p>
        )}
      </div>

      {!isTimbuk && (
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
          <User className="w-5 h-5 text-secondary-foreground" />
        </div>
      )}
    </motion.div>
  );
}
