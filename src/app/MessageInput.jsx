import React from "react";

const MessageInput = ({ isListening, handleVoiceInput }) => {
  return (
    <div className="input-area">
      <div className="voice-button-container">
        <button
          className={`voice-input-button ${isListening ? "listening" : ""}`}
          onClick={handleVoiceInput}
        >
          <div className="voice-button-icon">
            <div className="">
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
    </div>
  );
};

export default MessageInput;
