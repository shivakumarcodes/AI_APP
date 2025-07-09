import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import ImageDisplay from './ImageDisplay';
import { API_BASE } from '../api/baseUrl';

const ObjectDetection = () => {
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [uploadedImage, setUploadedImage] = useState('');
  const [imageError, setImageError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    setDetectedObjects([]);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_BASE}/detect-objects`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        setDetectedObjects(data.objects);
        
        // Show preview of uploaded image
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImage(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert(data.error || 'Error detecting objects');
        if (data.apiError) {
          console.error('API Error:', data.apiError);
        }
      }
    } catch (error) {
      alert('Error: ' + error.message);
      console.error('Upload error:', error);
    }
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError('Failed to load uploaded image');
  };

  return (
    <div className="feature-section">
      <h2 className="section-title">Object Detection</h2>
      
      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden-input"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="upload-button upload-button-green"
        >
          <Upload size={20} />
          {isLoading ? 'Analyzing...' : 'Upload Image'}
        </button>
      </div>

      {/* Show uploaded image preview */}
      <ImageDisplay 
        imageSrc={uploadedImage}
        imageError={imageError}
        onImageError={handleImageError}
        onImageLoad={() => setImageError('')}
        title="Uploaded Image:"
        altText="Uploaded for detection"
        className="uploaded-image"
      />

      {/* Show detection results */}
      {detectedObjects.length > 0 && (
        <div className="results-container">
          <h3 className="results-title">Detected Objects:</h3>
          <div className="tags-container">
            {detectedObjects.map((obj, index) => (
              <span key={index} className="object-tag">
                {obj}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectDetection;