"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Headphones, Mic, Moon, Send, Sun } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  role: "assistant" | "user";
  text: string;
};

export function WidgetPreview() {
  const [light, setLight] = useState(false);
  const [voice, setVoice] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "नमस्ते! मैं आपकी वेबसाइट से सीखी हुई जानकारी के आधार पर मदद कर सकती हूँ." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const speakText = async (text: string) => {
    try {
      const res = await fetch("http://localhost:4000/api/voice/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
      }
    } catch (err) {
      console.error("TTS playback error:", err);
    }
  };

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          siteId: "demo",
          message: text,
          mode: voice ? "voice" : "text",
          conversationId: conversationId || undefined
        })
      });
      
      const data = await response.json();
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const answer = data.answer || "I'm sorry, I couldn't process that.";
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);

      if (voice || data.mode === "voice") {
        await speakText(answer);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading || !input.trim()) return;
    const text = input;
    setInput("");
    void handleSend(text);
  };

  const toggleVoice = () => {
    if (voice) {
      // Turn off voice mode
      setVoice(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Turn on voice mode
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Voice recognition is not supported in this browser.");
        return;
      }

      setVoice(true);
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "hi-IN"; // Support Hindi speech recognition
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        void handleSend(transcript);
      };

      recognition.onerror = () => {
        setVoice(false);
      };

      recognition.onend = () => {
        setVoice(false);
      };

      recognition.start();
    }
  };

  return (
    <aside className={light ? "light-shell sticky top-5 h-[calc(100vh-40px)] rounded-[32px] p-5" : "sticky top-5 h-[calc(100vh-40px)] rounded-[32px] bg-black/35 p-5"}>
      <div className="flex h-full flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-60">Live widget preview</p>
            <h2 className="text-2xl font-black">Asha AI</h2>
          </div>
          <button
            aria-label="Toggle theme"
            onClick={() => setLight((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-current/10 bg-current/5"
          >
            {light ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        <div className="mb-4 rounded-3xl border border-current/10 bg-current/5 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-jade text-ink">
              <Bot size={24} />
            </span>
            <div>
              <p className="font-bold">Website assistant</p>
              <p className="text-sm opacity-60">Hindi + English, chat + voice</p>
            </div>
          </div>
        </div>

        <div ref={chatRef} className="flex-1 space-y-3 overflow-y-auto rounded-[28px] border border-current/10 bg-current/5 p-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className={message.role === "user" ? "ml-auto max-w-[85%] rounded-3xl bg-electric px-4 py-3 text-sm text-white" : "max-w-[88%] rounded-3xl bg-white px-4 py-3 text-sm text-ink"}
            >
              {message.text}
            </motion.div>
          ))}

          <AnimatePresence>
            {voice && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mx-auto mt-6 flex w-fit items-end gap-1 rounded-full border border-jade/30 bg-jade/10 px-5 py-3"
              >
                {[18, 30, 42, 26, 36].map((height, index) => (
                  <span key={index} className="voice-bar w-2 rounded-full bg-jade" style={{ height }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <button
            type="button"
            aria-label="Start voice"
            onClick={toggleVoice}
            className={voice ? "flex h-12 w-12 items-center justify-center rounded-full bg-rose text-white shadow-glow" : "flex h-12 w-12 items-center justify-center rounded-full border border-current/10 bg-current/5"}
          >
            {voice ? <Headphones size={18} /> : <Mic size={18} />}
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-current/10 bg-current/5 px-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
              placeholder={loading ? "Generating response..." : "Type in Hindi or English..."}
            />
            <button disabled={loading} aria-label="Send message" className="text-jade disabled:opacity-40">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
