import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

function Chat({ agentType, initialMessage, agentInitials, directQuestion }) {
  const [messages, setMessages] = useState(() =>
    initialMessage
      ? [{ content: initialMessage, isUser: false }]
      : []
  );

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const processedQuestionsRef = useRef(new Set());

  const API_BASE_URL = "http://127.0.0.1:5001";

  // -----------------------------
  // SMART SCROLL (NO JUMPING)
  // -----------------------------
  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;

    const threshold = 120;
    return (
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    );
  }, []);

  const scrollToBottom = useCallback(
    (force = false) => {
      if (force || isNearBottom()) {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    },
    [isNearBottom]
  );

  // -----------------------------
  // SEND MESSAGE
  // -----------------------------
  const handleSendMessage = useCallback(
    async (questionOverride = null) => {
      const messageToSend = questionOverride || input;
      if (!messageToSend.trim()) return;

      const userMessage = {
        content: messageToSend,
        isUser: true,
      };

      setInput("");
      setIsLoading(true);

      setMessages((prev) => [...prev, userMessage]);

      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/${agentType}`,
          { message: messageToSend }
        );

        const aiResponse = res.data?.response;

        if (aiResponse) {
          setMessages((prev) => [
            ...prev,
            { content: aiResponse, isUser: false },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            content:
              "Error connecting to AI agent. Please check backend.",
            isUser: false,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, agentType]
  );

  // -----------------------------
  // ENTER KEY
  // -----------------------------
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSendMessage();
  };

  // -----------------------------
  // DIRECT QUESTION
  // -----------------------------
  useEffect(() => {
    if (
      !directQuestion ||
      processedQuestionsRef.current.has(directQuestion)
    ) {
      return;
    }

    processedQuestionsRef.current.add(directQuestion);
    handleSendMessage(directQuestion);
  }, [directQuestion, handleSendMessage]);

  // -----------------------------
  // SCROLL EFFECT (FIXED)
  // -----------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      scrollToBottom(false);
    }, 50);

    return () => clearTimeout(t);
  }, [messages.length, scrollToBottom]);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div
      ref={containerRef}
      className="chat-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "#eff6ff", // light blue
        borderRadius: "12px",
      }}
    >
      {/* MESSAGES */}
      <div
        className="chat-messages"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${
              msg.isUser ? "user-message" : "agent-message"
            }`}
            style={{
              marginBottom: "12px",
              display: "flex",
              gap: "10px",
            }}
          >
            {!msg.isUser && (
              <div
                className="message-avatar"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--accent-bg)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  border: "1px solid var(--border)",
                }}
              >
                {agentInitials || "AI"}
              </div>
            )}

            <div
              className="message-content"
              style={{
                background: msg.isUser
                  ? "var(--accent-bg)"
                  : "transparent",
                padding: "10px 12px",
                borderRadius: "10px",
                maxWidth: "75%",
                color: "var(--text)",
                fontSize: "15px",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* LOADING DOTS */}
        {isLoading && (
          <div
            className="message agent-message"
            style={{ display: "flex", gap: "10px" }}
          >
            <div
              className="message-avatar"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--accent-bg)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {agentInitials || "AI"}
            </div>

            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div
        className="chat-input-container"
        style={{
          display: "flex",
          gap: "8px",
          padding: "10px",
          borderTop: "1px solid var(--border)",
          background: "transparent",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text)",
            outline: "none",
            fontSize: "15px",
            fontWeight: 600,
            opacity: 0.9,
            letterSpacing: 0.3
          }}
        />

        {/* SEND BUTTON */}
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading}
          className="chat-send-button"
        >
          {isLoading ? <span className="spinner" /> : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chat;