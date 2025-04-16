import React, { useEffect, useRef } from "react";

const MessageBubble = ({ messages, isProcessing }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  console.log("messages: ", messages);

  return (
    <div className="messages-area">
      <div className="message-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-wrapper ${
              message.type === "user" ? "user-message-wrapper" : ""
            }`}
          >
            {message.type === "bot" && (
              <div className="ai-avatar">
                <div className="ai-avatar-icon"></div>
              </div>
            )}
            <div
              className={`message ${
                message.type === "user" ? "user-message" : "ai-message"
              }`}
            >
              <div className="message-content">{message.text}</div>
              <span className="message-timestamp">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="message-wrapper">
            <div className="ai-avatar">
              <div className="ai-avatar-icon"></div>
            </div>
            <div className="message ai-message processing">
              <div className="processing-indicator">
                <div className="processing-bar"></div>
              </div>
              <span className="processing-text">Processing your request</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
export default MessageBubble;
