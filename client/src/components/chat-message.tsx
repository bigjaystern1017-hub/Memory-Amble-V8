import { motion } from "framer-motion";
import { Brain, User } from "lucide-react";

interface ChatMessageProps {
  sender: "timbuk" | "gladys";
  text: string;
  isTyping?: boolean;
}

export function ChatMessage({ sender, text, isTyping }: ChatMessageProps) {
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
        className={`max-w-[85%] md:max-w-[75%] rounded-md px-5 py-4 ${
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
        ) : (
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{text}</p>
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
