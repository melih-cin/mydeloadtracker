"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Brain, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Should I deload this week? Why?",
  "Where am I plateauing and what should I do?",
  "What are my weak points right now?",
  "Plan my training for next week.",
];

export function CoachChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;

    const next: Message[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "The coach is unavailable.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${msg}` };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div ref={scrollRef} className="scroll-thin flex-1 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center">
            <div className="max-w-md text-center">
              <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-brand">
                <Brain className="h-6 w-6" />
              </span>
              <h2 className="text-lg font-semibold">Your AI strength coach</h2>
              <p className="mt-1 text-sm text-muted">
                I&apos;ve loaded your last 8 weeks of training. Ask me anything, or start
                with one of these:
              </p>
              <div className="mt-5 grid gap-2 text-left">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm transition-colors hover:bg-surface-hover"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand text-brand-foreground"
                      : "border border-border bg-surface"
                  }`}
                >
                  {m.content || (
                    <Loader2 className="h-4 w-4 animate-spin text-muted" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-end gap-2 rounded-2xl border border-border bg-surface p-2"
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask your coach…"
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="btn-brand h-9 w-9 flex-shrink-0 rounded-xl p-0"
          aria-label="Send"
        >
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
