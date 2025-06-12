import React from 'react';

const ImageDisplay = ({ 
  imageSrc, 
  imageError, 
  onImageError, 
  onImageLoad, 
  title, 
  altText,
  className = "generated-image"
}) => {
  if (!imageSrc || imageError) return null;

  return (
    <div className="image-container">
      <h3 className="results-title">{title}</h3>
      <img 
        src={imageSrc} 
        style={{ width: '550px', height: '550px' }}
        alt={altText}
        className={className}
        onError={onImageError}
        onLoad={onImageLoad}
        crossOrigin="anonymous"
      />
      <div className="image-info">
        <small>Image source: {imageSrc.length > 100 ? 
          `${imageSrc.substring(0, 100)}...` : 
          imageSrc}
        </small>
      </div>
    </div>
  );
};

export default ImageDisplay;
