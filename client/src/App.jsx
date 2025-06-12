import React, { useState } from 'react';
import { Image, Upload, FileText, Bot } from 'lucide-react';
import TabButton from './components/TabButton';
import TextToImageGenerator from './components/TextToImageGenerator';
import ObjectDetection from './components/ObjectDetection';
import PDFSummarizer from './components/PDFSummarizer';
import AIInterviewer from './components/AIInterviewer';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('text-to-image');

  const tabs = [
    { id: 'text-to-image', icon: Image, label: 'Text to Image' },
    { id: 'object-detection', icon: Upload, label: 'Object Detection' },
    { id: 'pdf-summary', icon: FileText, label: 'PDF Summary' },
    { id: 'interviewer', icon: Bot, label: 'AI Interviewer' }
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'text-to-image':
        return <TextToImageGenerator />;
      case 'object-detection':
        return <ObjectDetection />;
      case 'pdf-summary':
        return <PDFSummarizer />;
      case 'interviewer':
        return <AIInterviewer />;
      default:
        return <TextToImageGenerator />;
    }
  };

  return (
    <div className="app-container">
      <div className="app-wrapper">
        <h1 className="app-title">AI Multi-Feature App</h1>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              icon={tab.icon}
              label={tab.label}
              isActive={activeTab === tab.id}
              onClick={setActiveTab}
            />
          ))}
        </div>

        {/* Content Area */}
        <div className="content-area">
          {renderActiveComponent()}
        </div>

        {/* Footer */}
        <div className="app-footer">
          <p>Built by Shiva Kumar</p>
        </div>
      </div>
    </div>
  );
};

export default App;