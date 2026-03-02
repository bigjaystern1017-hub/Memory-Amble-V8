import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function ChatInput({ onSend, placeholder = "Type your answer...", disabled, autoFocus = true }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled, placeholder]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setValue(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2" data-testid="chat-input-container">
      {speechSupported && (
        <Button
          size="icon"
          variant={isListening ? "default" : "secondary"}
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          data-testid="button-microphone"
          aria-label={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>
      )}

      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "Listening..." : placeholder}
        disabled={disabled}
        className="text-lg h-12 flex-1"
        data-testid="input-chat"
      />

      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        data-testid="button-send"
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
}
