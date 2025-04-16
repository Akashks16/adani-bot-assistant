import React, { useState, useRef, useEffect } from "react";
import "./AIAssistantUI.css";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import BotAssistantApp from "./BotAssistantApp";
import Chatbot from "./Chatbot";

const AIAssistantUI = () => {
  const [activeTab, setActiveTab] = useState();

  const renderTab = () => {
    switch (activeTab) {
      case "chatbot":
        return <Chatbot />;
      case "botAssistant":
        return <BotAssistantApp />;
      default:
        return (
          <div>
            <div
              className="message-options options-container"
              style={{ margin: "5px", cursor: "pointer" }}
              onClick={() => setActiveTab("chatbot")}
            >
              <div className="message-content" style={{ margin: "5px" }}>
                Chatbot
              </div>
            </div>

            <div
              className="message-options options-container"
              style={{ margin: "5px", cursor: "pointer" }}
              onClick={() => setActiveTab("botAssistant")}
            >
              <div className="message-content" style={{ margin: "5px" }}>
                AI Assitant
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="ai-container">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-logo">
          <div className="ai-icon">
            <div className="ai-icon-inner"></div>
          </div>
          <h2>Kapture AI Assistant</h2>
        </div>
        <div className="ai-status">
          <div className="ai-status-indicator"></div>
          <span>Neural Processing Active</span>
        </div>
      </div>

      {renderTab()}
    </div>
  );
};

export default AIAssistantUI;
