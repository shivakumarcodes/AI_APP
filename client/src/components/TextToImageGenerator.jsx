import React, { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import ImageDisplay from './ImageDisplay';

const TextToImageGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [imageError, setImageError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const API_BASE = 'https://ai-app-backend-cp1d.onrender.com';

  const generateImage = useCallback(async () => {
    if (!inputText.trim()) {
      alert('Please enter text or use voice input');
      return;
    }

    setIsLoading(true);
    setGeneratedImage('');
    setImageError('');

    try {
      const cleanPrompt = inputText.trim().replace(/\.+$/, '');

      const response = await fetch(`${API_BASE}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: cleanPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const data = await response.json();
        if (data.success && data.imageUrl) {
          handleImageResponse(data.imageUrl);
        } else {
          throw new Error(data.error || 'Failed to generate image');
        }
      } else if (contentType?.includes('image/')) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setGeneratedImage(imageUrl);
      } else {
        throw new Error('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      setImageError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);

  const handleImageResponse = (imageUrl) => {
    if (imageUrl.startsWith('data:image/')) {
      setGeneratedImage(imageUrl);
    } else if (imageUrl.startsWith('http')) {
      const url = new URL(imageUrl);
      if (!url.pathname.endsWith('.jpg') && !url.pathname.endsWith('.png')) {
        url.pathname += '.jpg';
      }
      setGeneratedImage(url.toString());
    } else {
      setGeneratedImage(`${API_BASE}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`);
    }
  };

  const handleVoiceResult = useCallback((text) => {
    setInputText(prev => prev ? `${prev} ${text}` : text);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError('Failed to load the generated image. Please try again.');
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageError('');
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && !isRecording) {
      generateImage();
    }
  };

  return (
    <div className="feature-section">
      <h2 className="section-title">Text to Image Generator</h2>

      <div className="input-section">
        <div className="input-row">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the image you want to generate..."
            className="text-input"
            disabled={isRecording}
          />
          <VoiceRecorder 
            onResult={handleVoiceResult} 
            setIsRecording={setIsRecording} 
          />
        </div>

        <button
          onClick={generateImage}
          disabled={isLoading || isRecording}
          className="generate-button"
        >
          {isLoading ? (
            <span className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          ) : 'Generate Image'}
        </button>
      </div>

      {isLoading && (
        <div className="loading-container">
          <p>Generating your image...</p>
          <div className="spinner"></div>
        </div>
      )}

      {imageError && (
        <div className="error-container">
          <AlertCircle size={20} />
          <p>{imageError}</p>
        </div>
      )}

      <ImageDisplay
        imageSrc={generatedImage}
        imageError={imageError}
        onImageError={handleImageError}
        onImageLoad={handleImageLoad}
        title="Generated Image:"
        altText="AI Generated Image"
      />
    </div>
  );
};

export default TextToImageGenerator;