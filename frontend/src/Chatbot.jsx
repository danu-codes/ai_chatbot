
import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  UserRound,
  RotateCcw,
  Copy,
  Check,
  LoaderCircle,
} from "lucide-react";
import "./Chatbot.css";

const suggestions = [
  "Explain React hooks",
  "Help me write code",
  "Give me project ideas",
  "What can you do?",
];

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hey there! 👋 I'm your AI assistant. How can I help you today?",
      time: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendMessage = async (text = input) => {
    const message = text.trim();

    if (!message || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: message,
        time: new Date(),
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
          time: new Date(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I couldn't process that request. Please try again.",
          time: new Date(),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const copyMessage = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="chat-page">
      <div className="chat-container">

        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <div className="chat-logo">
              <Sparkles size={25} />
            </div>

            <div className="chat-header-info">
              <h2>Gemini AI Assistant</h2>
              <p>
                <span className="status-dot" />
                Ready to help
              </p>
            </div>
          </div>

          <button
            className="reset-button"
            title="New conversation"
            onClick={() =>
              setMessages([
                {
                  role: "assistant",
                  text: "Hello! 👋 Let's start a new conversation.",
                  time: new Date(),
                },
              ])
            }
            disabled={loading}
          >
            <RotateCcw size={18} />
            <span>New Chat</span>
          </button>
        </header>

        {/* Messages */}
        <main className="chat-messages">

          {messages.length === 1 && (
            <div className="welcome-section">
              <div className="welcome-icon">
                <Sparkles size={32} />
              </div>

              <h1>How can I help you today?</h1>

              <p>
                Ask questions, explore ideas, or get
                help with your projects.
              </p>

              <div className="suggestions">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => sendMessage(item)}
                    disabled={loading}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              className={`message-row ${msg.role}`}
              key={index}
            >
              <div className="message-avatar">
                {msg.role === "assistant" ? (
                  <Bot size={19} />
                ) : (
                  <UserRound size={19} />
                )}
              </div>

              <div className="message-content">
                <div
                  className={`message-bubble ${msg.error ? "error-bubble" : ""
                    }`}
                >
                  {msg.text}
                </div>

                <div className="message-meta">
                  <span>{formatTime(msg.time)}</span>

                  {msg.role === "assistant" && !msg.error && (
                    <button
                      className="copy-button"
                      title="Copy response"
                      onClick={() =>
                        copyMessage(msg.text, index)
                      }
                    >
                      {copiedIndex === index ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant">
              <div className="message-avatar">
                <Bot size={19} />
              </div>

              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Input */}
        <footer className="chat-footer">
          <form
            className="chat-input-box"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              rows={1}
              maxLength={2000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            <button
              className="send-button"
              type="submit"
              disabled={!input.trim() || loading}
              title="Send message"
            >
              {loading ? (
                <LoaderCircle
                  size={19}
                  className="spin"
                />
              ) : (
                <Send size={19} />
              )}
            </button>
          </form>

          <p className="chat-disclaimer">
            Powered by Google Gemini • AI may make mistakes
          </p>
        </footer>
      </div>
    </div>
  );
}
