import React, { useRef, useState, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { API_BASE } from '../api/baseUrl';
import '../styles/VoiceRecorder.css';

const VoiceRecorder = ({ onResult, setIsRecording }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isActiveRecording, setIsActiveRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await convertSpeechToText(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setIsActiveRecording(false);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsActiveRecording(true);
      setIsRecording(true);
      
      // Set dataavailable event to fire every 200ms
      const interval = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.requestData();
        }
      }, 200);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsActiveRecording(false); // Immediately set recording state to false
      setIsRecording(false);
    }
  };

  const convertSpeechToText = async (audioBlob) => {
    setIsLoading(true);
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
      if (data.success) {
        onResult(data.text);
      } else {
        throw new Error(data.error || 'Error converting speech to text');
      }
    } catch (error) {
      console.error('Speech to text conversion error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingClick = () => {
    if (isActiveRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="voice-container">
      <button
        onClick={handleRecordingClick}
        className={`mic-button ${isActiveRecording ? 'recording' : ''}`}
        disabled={isLoading}
        aria-label={isActiveRecording ? 'Stop recording' : 'Start recording'}
      >
        <Mic size={20} />
      </button>

      {isActiveRecording && (
        <div className="wave-loader">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="wave" style={{ '--delay': `${i * 0.2}s` }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;