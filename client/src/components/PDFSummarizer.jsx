import React, { useState, useRef } from 'react';
import { FileText } from 'lucide-react';

const PDFSummarizer = () => {
  const [pdfSummary, setPdfSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pdfInputRef = useRef(null);

  const API_BASE = 'http://localhost:3001';

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch(`${API_BASE}/summarize-pdf`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        setPdfSummary(data.summary);
      } else {
        alert('Error summarizing PDF: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="feature-section">
      <h2 className="section-title">PDF Summarizer</h2>
      
      <div className="upload-section">
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf"
          onChange={handlePdfUpload}
          className="hidden-input"
        />
        <button
          onClick={() => pdfInputRef.current?.click()}
          disabled={isLoading}
          className="upload-button upload-button-orange"
        >
          <FileText size={20} />
          {isLoading ? 'Processing...' : 'Upload PDF'}
        </button>
      </div>

      {pdfSummary && (
        <div className="summary-container">
          <h3 className="results-title">Summary:</h3>
          <p className="summary-text">{pdfSummary}</p>
        </div>
      )}
    </div>
  );
};

export default PDFSummarizer;