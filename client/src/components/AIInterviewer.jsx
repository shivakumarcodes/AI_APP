import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Mic, MicOff, Send, Volume2, Trophy, RotateCcw } from 'lucide-react';
import '../styles/AIInterviewer.css';

const AIInterviewer = () => {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewMode, setInterviewMode] = useState(null); // 'chat' or 'voice'
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewScore, setInterviewScore] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [error, setError] = useState(null);
  const [audioAvailable, setAudioAvailable] = useState(true);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const chatContainerRef = useRef(null);

  const API_BASE = 'https://ai-app-vbhf.onrender.com';
  const MAX_QUESTIONS = 5 + Math.floor(Math.random() * 3); // Random between 5-7 questions

  useEffect(() => {
    // Check if audio is available
    if (interviewMode === 'voice') {
      checkAudioAvailability();
    }
  }, [interviewMode]);

  useEffect(() => {
    // Auto-scroll to bottom of chat
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const checkAudioAvailability = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioAvailable(true);
    } catch (err) {
      setAudioAvailable(false);
      setError('Microphone access denied. Please enable microphone permissions to use voice mode.');
    }
  };

  const startInterview = async () => {
    setInterviewStarted(true);
    setChatMessages([]);
    setQuestionCount(0);
    setInterviewComplete(false);
    setInterviewScore(null);
    setError(null);
  };

  const selectMode = async (mode) => {
    setInterviewMode(mode);
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/start-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setChatMessages([{ role: 'assistant', content: data.message }]);
        setQuestionCount(1);
        
        if (mode === 'voice' && audioAvailable) {
          speakText(data.message);
        }
      } else {
        throw new Error(data.message || 'Failed to start interview');
      }
    } catch (error) {
      setError(`Error starting interview: ${error.message}`);
      setInterviewMode(null);
    }
    setIsLoading(false);
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;
    
    const newMessages = [...chatMessages, { role: 'user', content: message }];
    setChatMessages(newMessages);
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        const assistantMessage = { role: 'assistant', content: data.message };
        const updatedMessages = [...newMessages, assistantMessage];
        setChatMessages(updatedMessages);
        setQuestionCount(prev => prev + 1);
        
        if (interviewMode === 'voice' && audioAvailable) {
          speakText(data.message);
        }
        
        if (questionCount >= MAX_QUESTIONS - 1) {
          setTimeout(() => {
            endInterview(updatedMessages);
          }, 2000);
        }
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  const endInterview = async (messages = chatMessages) => {
    setInterviewComplete(true);
    setIsLoading(true);
    
    try {
      // Simulate API call to evaluate interview
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userMessages = messages.filter(msg => msg.role === 'user');
      const avgMessageLength = userMessages.reduce((acc, msg) => acc + msg.content.length, 0) / (userMessages.length || 1);
      const techKeywords = ['algorithm', 'data structure', 'complexity', 'database', 'api', 'framework', 'design pattern', 'optimization'];
      const techMentions = userMessages.reduce((acc, msg) => {
        return acc + techKeywords.filter(keyword => msg.content.toLowerCase().includes(keyword)).length;
      }, 0);
      
      let score = 50; // Base score
      score += Math.min(avgMessageLength / 10, 20);
      score += Math.min(techMentions * 5, 20);
      score += Math.min(userMessages.length * 2, 10);
      score += Math.random() * 10 - 5;
      score = Math.max(1, Math.min(100, Math.round(score)));
      
      setInterviewScore(score);
    } catch (error) {
      setError('Error calculating score: ' + error.message);
      setInterviewScore(50); // Fallback score
    }
    setIsLoading(false);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window && audioAvailable) {
      setIsPlaying(true);
      speechSynthesis.cancel(); // Cancel any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = (event) => {
        setIsPlaying(false);
        setError('Error during speech synthesis: ' + event.error);
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    if (!audioAvailable) {
      setError('Microphone not available. Please check permissions.');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.onerror = (event) => {
        setError('Recording error: ' + event.error.name);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (error) {
      setError('Error accessing microphone: ' + error.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch(`${API_BASE}/speech-to-text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.text.trim()) {
        await sendMessage(data.text);
      } else {
        throw new Error(data.message || 'Could not transcribe audio');
      }
    } catch (error) {
      setError('Error processing audio: ' + error.message);
    }
    setIsLoading(false);
  };

  const handleChatSend = () => {
    if (!chatInput.trim() || isLoading) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleChatSend();
    }
  };

  const resetInterview = () => {
    // Clean up any ongoing processes
    if (isRecording) stopRecording();
    if (isPlaying) speechSynthesis.cancel();
    
    setInterviewStarted(false);
    setInterviewMode(null);
    setChatMessages([]);
    setInterviewComplete(false);
    setInterviewScore(null);
    setQuestionCount(0);
    setChatInput('');
    setError(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-needs-improvement';
  };

  const getScoreFeedback = (score) => {
    if (score >= 90) return 'Excellent performance! You demonstrated strong technical knowledge and communication skills.';
    if (score >= 80) return 'Great job! You showed good understanding and articulated your thoughts well.';
    if (score >= 70) return 'Good performance! There\'s room for improvement in technical depth or communication.';
    if (score >= 60) return 'Average performance. Consider practicing more technical concepts and communication skills.';
    return 'Keep practicing! Focus on technical fundamentals and clear communication.';
  };

  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="error-message" role="alert">
        {error}
        <button onClick={() => setError(null)} className="error-close">
          &times;
        </button>
      </div>
    );
  };

  if (interviewComplete && interviewScore !== null) {
    return (
      <div className="interview-container">
        <div className="score-section">
          <Trophy className="trophy-icon" size={48} aria-hidden="true" />
          <h2 className="score-title">Interview Complete!</h2>
          <div className="score-display">
            <div className={`score-number ${getScoreColor(interviewScore)}`} aria-live="polite">
              {interviewScore}
            </div>
            <div className="score-total">out of 100</div>
          </div>
          <p className="score-feedback">{getScoreFeedback(interviewScore)}</p>
          <button
            onClick={resetInterview}
            className="reset-button"
            aria-label="Start new interview"
          >
            <RotateCcw size={20} className="reset-icon" aria-hidden="true" />
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-container feature-section">
      <h1 className="interview-title">AI Interviewer</h1>
      
      {renderError()}
      
      {!interviewStarted ? (
        <div className="start-section">
          <div className="start-content">
            <div className="interview-icon" aria-hidden="true">
              <MessageCircle size={32} />
            </div>
            <p className="start-description">Ready to start your technical interview? Choose your preferred mode:</p>
          </div>
          <button
            onClick={startInterview}
            disabled={isLoading}
            className="start-button"
            aria-label="Start interview"
          >
            {isLoading ? 'Starting...' : 'Start Interview'}
          </button>
        </div>
      ) : interviewMode === null ? (
        <div className="mode-selection">
          <h2 className="mode-prompt">How would you like to conduct the interview?</h2>
          <div className="mode-buttons">
            <button
              onClick={() => selectMode('chat')}
              disabled={isLoading}
              className="mode-button"
              aria-label="Select chat mode"
            >
              <MessageCircle className="mode-icon" size={32} aria-hidden="true" />
              <span className="mode-title">Chat Mode</span>
              <span className="mode-subtitle">Type your responses</span>
            </button>
            <button
              onClick={() => selectMode('voice')}
              disabled={isLoading}
              className="mode-button"
              aria-label="Select voice mode"
            >
              <Mic className="mode-icon voice-icon" size={32} aria-hidden="true" />
              <span className="mode-title">Voice Mode</span>
              <span className="mode-subtitle">Speak your responses</span>
            </button>
          </div>
          <button onClick={resetInterview} className="back-button">
            Back
          </button>
        </div>
      ) : (
        <div className="interview-active">
          {/* Progress indicator */}
          <div className="progress-bar" aria-label={`Question ${questionCount} of approximately ${MAX_QUESTIONS}`}>
            <span>Question {questionCount} of ~{MAX_QUESTIONS}</span>
            <span className="mode-indicator">
              {interviewMode === 'chat' ? (
                <MessageCircle size={16} aria-hidden="true" />
              ) : (
                <Mic size={16} aria-hidden="true" />
              )}
              <span className="mode-text">{interviewMode} Mode</span>
            </span>
          </div>

          {/* Chat Messages */}
          <div className="chat-container" ref={chatContainerRef} tabIndex="0" aria-live="polite">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`message-wrapper ${message.role === 'user' ? 'message-wrapper-user' : 'assistant-message'}`}
              >
                <div 
                  className={`message ${message.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}
                  aria-label={message.role === 'user' ? 'Your message' : 'Interviewer message'}
                >
                  {message.content}
                  {message.role === 'assistant' && interviewMode === 'voice' && audioAvailable && (
                    <button
                      onClick={() => speakText(message.content)}
                      className="speak-button"
                      disabled={isPlaying}
                      aria-label="Read aloud"
                    >
                      <Volume2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-wrapper assistant-message">
                <div className="message assistant-bubble loading-message">
                  <div className="typing-indicator" aria-busy="true">
                    Interviewer is thinking...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Section */}
          {interviewMode === 'chat' ? (
            <div className="chat-input-container">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                className="chat-input"
                disabled={isLoading}
                aria-label="Type your response"
              />
              <button
                onClick={handleChatSend}
                disabled={isLoading || !chatInput.trim()}
                className="send-button"
                aria-label="Send message"
              >
                <Send size={20} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="voice-input-container">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || isPlaying || !audioAvailable}
                className={`voice-button ${isRecording ? 'recording' : ''}`}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? (
                  <MicOff size={24} aria-hidden="true" />
                ) : (
                  <Mic size={24} aria-hidden="true" />
                )}
              </button>
              <p className="voice-instruction">
                {isRecording 
                  ? 'Recording... Click to stop' 
                  : audioAvailable 
                    ? 'Click to record your response' 
                    : 'Microphone unavailable'}
              </p>
            </div>
          )}

          {/* End Interview Button */}
          <div className="end-interview-section">
            <button
              onClick={() => endInterview()}
              className="end-interview-button"
              disabled={isLoading}
              aria-label="End interview early"
            >
              End Interview Early
            </button>
            <button onClick={resetInterview} className="back-button">
              Restart Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInterviewer;