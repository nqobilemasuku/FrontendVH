import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, GraduationCap, MessageCircle, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { askApplicationAssistant } from "../lib/api/chat.functions";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "How do I calculate my APS?",
  "What documents should I prepare?",
  "How can I find bursaries?",
];

export function GlobalChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi, I’m Varsity Guide. I can help you figure out applications, APS, documents, and funding. What are you working on?",
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  async function sendQuestion(value: string) {
    const content = value.trim();
    if (!content || isSending) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setQuestion("");
    setError("");
    setIsSending(true);

    try {
      const result = await askApplicationAssistant({
        data: { messages: nextMessages.slice(-10) },
      });
      setMessages((current) => [...current, { role: "assistant", content: result.answer }]);
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(question);
  }

  return (
    <div className="varsity-chat">
      {isOpen && (
        <section
          className="varsity-chat__panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="varsity-chat-title"
        >
          <header className="varsity-chat__header">
            <div className="varsity-chat__brand-mark" aria-hidden="true">
              <GraduationCap size={21} strokeWidth={2.2} />
            </div>
            <div className="varsity-chat__heading">
              <h2 id="varsity-chat-title">Varsity Guide</h2>
              <span>
                <i /> Here to help you apply
              </span>
            </div>
            <button
              className="varsity-chat__icon-button"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Varsity Guide"
            >
              <X size={19} />
            </button>
          </header>

          <div className="varsity-chat__messages" ref={messagesRef} aria-live="polite">
            <div className="varsity-chat__date-label">YOUR APPLICATION, MADE CLEARER</div>
            {messages.map((message, index) => (
              <div
                className={`varsity-chat__message varsity-chat__message--${message.role}`}
                key={`${message.role}-${index}`}
              >
                {message.role === "assistant" && (
                  <span className="varsity-chat__avatar" aria-hidden="true">
                    <Sparkles size={13} />
                  </span>
                )}
                {message.role === "assistant" ? (
                  <div className="varsity-chat__markdown">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        table: ({ children }) => (
                          <div className="varsity-chat__table-wrap">
                            <table>{children}</table>
                          </div>
                        ),
                        a: ({ children, ...props }) => (
                          <a {...props} target="_blank" rel="noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {message.content.replace(/<br\s*\/?>/gi, "\n")}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            ))}
            {messages.length === 1 && !isSending && (
              <div className="varsity-chat__suggestions">
                <span>TRY ASKING</span>
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => void sendQuestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {isSending && (
              <div className="varsity-chat__message varsity-chat__message--assistant" role="status">
                <span className="varsity-chat__avatar" aria-hidden="true">
                  <Sparkles size={13} />
                </span>
                <p className="varsity-chat__typing">
                  <i />
                  <i />
                  <i />
                  <span className="sr-only">Thinking</span>
                </p>
              </div>
            )}
          </div>

          <div className="varsity-chat__composer-wrap">
            {error && (
              <p className="varsity-chat__error" role="alert">
                {error}
              </p>
            )}
            <form className="varsity-chat__composer" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value.slice(0, 1800))}
                placeholder="Ask about your application..."
                aria-label="Ask Varsity Guide a question"
                maxLength={1800}
                disabled={isSending}
              />
              <button
                type="submit"
                aria-label="Send question"
                disabled={!question.trim() || isSending}
              >
                <ArrowUp size={19} strokeWidth={2.5} />
              </button>
            </form>
            <p className="varsity-chat__disclaimer">
              Check deadlines and requirements with the university.
            </p>
          </div>
        </section>
      )}

      <button
        className={`varsity-chat__launcher${isOpen ? " varsity-chat__launcher--open" : ""}`}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close Varsity Guide" : "Chat with Varsity Guide"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <>
            <MessageCircle size={21} />
            <span>Ask Varsity Guide</span>
          </>
        )}
      </button>
    </div>
  );
}
