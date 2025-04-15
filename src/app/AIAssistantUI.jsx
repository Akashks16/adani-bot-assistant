import React, { useState, useRef, useEffect } from "react";
import "./AIAssistantUI.css";

const AIAssistantUI = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to handle voice input - this is just the interface, not the implementation
  const handleVoiceInput = () => {
    // Toggle listening state
    setIsListening(!isListening);

    if (!isListening) {
      // Start speech recognition
      console.log("Starting speech recognition...");
      // This would connect to a speech recognition API in a real implementation

      // For demo purposes, we'll simulate an end to listening after 5 seconds
      setTimeout(() => {
        setIsListening(false);
        simulateMessageFromVoice();
      }, 5000);
    } else {
      // Stop speech recognition
      console.log("Stopping speech recognition...");
    }
  };

  // Simulate processing a voice message (for demo purposes)
  const simulateMessageFromVoice = () => {
    // Add simulated user message
    const newMessage = {
      id: messages.length + 1,
      text: "This is a simulated voice message from the user.",
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);

    // Simulate AI processing
    setIsProcessing(true);

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        text: "I've received your voice input. How can I assist you further?",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 2000);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="ai-container">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-logo">
          <div className="ai-icon">
            <div className="ai-icon-inner"></div>
          </div>
          <h2>NOVA</h2>
        </div>
        <div className="ai-status">
          <div className="ai-status-indicator"></div>
          <span>Neural Processing Active</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        <div className="message-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-wrapper ${
                message.sender === "user" ? "user-message-wrapper" : ""
              }`}
            >
              {message.sender === "ai" && (
                <div className="ai-avatar">
                  <div className="ai-avatar-icon"></div>
                </div>
              )}
              <div
                className={`message ${
                  message.sender === "user" ? "user-message" : "ai-message"
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

      {/* Voice Input Button */}
      <div className="input-area">
        <div className="voice-button-container">
          <button
            className={`voice-input-button ${isListening ? "listening" : ""}`}
            onClick={handleVoiceInput}
          >
            <div className="voice-button-icon">
              <div className="voice-button-circles">
                <div className="voice-circle"></div>
                <div className="voice-circle"></div>
                <div className="voice-circle"></div>
              </div>
              <div className="voice-button-mic">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 1.5C11.0054 1.5 10.0516 1.89509 9.34835 2.59835C8.64509 3.30161 8.25 4.25544 8.25 5.25V12C8.25 12.9946 8.64509 13.9484 9.34835 14.6517C10.0516 15.3549 11.0054 15.75 12 15.75C12.9946 15.75 13.9484 15.3549 14.6517 14.6517C15.3549 13.9484 15.75 12.9946 15.75 12V5.25C15.75 4.25544 15.3549 3.30161 14.6517 2.59835C13.9484 1.89509 12.9946 1.5 12 1.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19.5 10.5V12C19.5 14.3869 18.5518 16.6761 16.8642 18.3642C15.1767 20.0518 12.8869 21 10.5 21C8.11305 21 5.82319 20.0518 4.13604 18.3642C2.44888 16.6761 1.5 14.3869 1.5 12V10.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 19.5V22.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.5 22.5H16.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <span className="voice-button-text">
              {isListening ? "Listening..." : "Click to speak"}
            </span>

            {isListening && (
              <div className="voice-wave-container">
                <div className="voice-wave">
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                </div>
              </div>
            )}
          </button>
        </div>

        <div className="ai-capabilities">
          <div className="capability-badge">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                fill="currentColor"
              />
              <path
                d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C19.9997 5.85752 20.7362 6.95991 21.2388 8.17317C21.7413 9.38642 22 10.6868 22 12C22 14.6522 20.9464 17.1957 19.0711 19.0711C17.1957 20.9464 14.6522 22 12 22C10.6868 22 9.38642 21.7413 8.17317 21.2388C6.95991 20.7362 5.85752 19.9997 4.92893 19.0711C3.05357 17.1957 2 14.6522 2 12C2 9.34784 3.05357 6.8043 4.92893 4.92893C6.8043 3.05357 9.34784 2 12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 2V4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.92993 4.93005L6.33993 6.34005"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12H4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.92993 19.0699L6.33993 17.6599"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 20V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.6599 17.6599L19.0699 19.0699"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 12H22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.6599 6.34005L19.0699 4.93005"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Insights</span>
          </div>
          <div className="capability-badge">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.7519 11.1679L11.5547 9.03647C10.8901 8.59343 10 9.06982 10 9.86852V14.1315C10 14.9302 10.8901 15.4066 11.5547 14.9635L14.7519 12.8321C15.3457 12.4362 15.3457 11.5638 14.7519 11.1679Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Learning</span>
          </div>
          <div className="capability-badge">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 3H5C3.89543 3 3 3.89543 3 5V9M9 3V5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5V3M9 3H15M15 3H19C20.1046 3 21 3.89543 21 5V9M21 9V11C21 12.1046 20.1046 13 19 13H17C15.8954 13 15 12.1046 15 11C15 9.89543 14.1046 9 13 9H11C9.89543 9 9 9.89543 9 11C9 12.1046 8.10457 13 7 13H5C3.89543 13 3 12.1046 3 11V9M21 9H19C17.8954 9 17 9.89543 17 11V19C17 20.1046 16.1046 21 15 21H9C7.89543 21 7 20.1046 7 19V11M3 9H5C6.10457 9 7 9.89543 7 11V19C7 20.1046 7.89543 21 9 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Neural</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantUI;
