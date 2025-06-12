import React, { useState } from 'react';
import { Send } from 'lucide-react';

const ChatInterface = ({ messages, onSendMessage, isLoading }) => {
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = () => {
    if (!chatInput.trim() || isLoading) return;
    
    onSendMessage(chatInput);
    setChatInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="chat-section">
      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-wrapper ${message.role === 'user' ? 'message-wrapper-user' : 'message-wrapper-assistant'}`}
          >
            <div
              className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper message-wrapper-assistant">
            <div className="message message-assistant">
              Typing...
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="chat-input-section">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your response..."
          className="chat-input"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !chatInput.trim()}
          className="send-button"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;