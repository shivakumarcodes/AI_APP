require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const rateLimit = require('express-rate-limit');

//server url : https://shiva-ai-app.onrender.com

const app = express();
app.use(cors());


const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20 // limit each IP to 20 requests per minute
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(limiter);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    console.log(`Received file: ${file.originalname}, MIME type: ${file.mimetype}`);
    
    // Define allowed file types by category
    const allowedTypes = {
      // Image formats (most comprehensive list)
      images: [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',        // Your WebP files
        'image/svg+xml',
        'image/bmp',
        'image/tiff',
        'image/tif',
        'image/ico',
        'image/heic',
        'image/heif',
        'image/avif'
      ],
      // Document formats
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
      // Audio formats
      audio: [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/flac',
        'audio/m4a'
      ],
      // Video formats (optional)
      video: [
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv'
      ]
    };

    // Combine all allowed types
    const allAllowedTypes = [
      ...allowedTypes.images,
      ...allowedTypes.documents,
      ...allowedTypes.audio,
      // ...allowedTypes.video // Uncomment if you want video support
    ];

    // Check if file type is allowed
    if (allAllowedTypes.includes(file.mimetype)) {
      console.log(`✅ File type ${file.mimetype} is allowed`);
      cb(null, true);
    } else {
      console.log(`❌ File type ${file.mimetype} is not allowed`);
      console.log(`📋 Allowed types: ${allAllowedTypes.join(', ')}`);
      
      // More descriptive error message
      const error = new Error(`File type '${file.mimetype}' is not supported. Allowed types: ${allAllowedTypes.join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

// Alternative: More flexible approach using file extensions as fallback
const uploadFlexible = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    console.log(`Received file: ${file.originalname}, MIME type: ${file.mimetype}`);
    
    // Get file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Define allowed extensions
    const allowedExtensions = [
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', 
      '.tiff', '.tif', '.ico', '.heic', '.heif', '.avif',
      // Documents  
      '.pdf', '.doc', '.docx', '.txt',
      // Audio
      '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'
    ];

    // Define allowed MIME types
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'image/svg+xml', 'image/bmp', 'image/tiff', 'image/tif', 'image/ico',
      'image/heic', 'image/heif', 'image/avif',
      // Documents
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      // Audio
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 
      'audio/flac', 'audio/m4a'
    ];

    // Check both MIME type and extension (more flexible)
    const isMimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
    const isExtensionAllowed = allowedExtensions.includes(fileExtension);

    if (isMimeTypeAllowed || isExtensionAllowed) {
      console.log(`✅ File accepted - MIME: ${file.mimetype}, Extension: ${fileExtension}`);
      cb(null, true);
    } else {
      console.log(`❌ File rejected - MIME: ${file.mimetype}, Extension: ${fileExtension}`);
      console.log(`📋 Allowed extensions: ${allowedExtensions.join(', ')}`);
      
      const error = new Error(`File type not supported. File: ${file.originalname}, MIME: ${file.mimetype}. Allowed extensions: ${allowedExtensions.join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

// Even more permissive approach - accept any image type
const uploadPermissive = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    console.log(`Received file: ${file.originalname}, MIME type: ${file.mimetype}`);
    
    // Check if it's any image type
    const isImage = file.mimetype.startsWith('image/');
    const isPDF = file.mimetype === 'application/pdf';
    const isAudio = file.mimetype.startsWith('audio/');
    const isDocument = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ].includes(file.mimetype);

    if (isImage || isPDF || isAudio || isDocument) {
      console.log(`✅ File type ${file.mimetype} is allowed`);
      cb(null, true);
    } else {
      console.log(`❌ File type ${file.mimetype} is not allowed`);
      const error = new Error(`File type '${file.mimetype}' is not supported. We accept images, PDFs, documents, and audio files.`);
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

// Updated error handling middleware with better error messages
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  
  // Handle multer errors specifically
  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid file type',
      message: error.message,
      hint: 'Please upload an image (jpg, png, gif, webp, etc.), PDF, or audio file'
    });
  }
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      success: false, 
      error: 'File too large',
      message: 'File size must be less than 10MB'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ 
      success: false, 
      error: 'Unexpected file field',
      message: 'Please check the file field name in your request'
    });
  }
  
  // Generic error
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, error: 'No audio file provided' });
    }

    // Using AssemblyAI's free tier (60 minutes/month)
    const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
    
    if (!ASSEMBLYAI_API_KEY) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.json({ 
        success: true, 
        text: "This is a mock transcription. Please set ASSEMBLYAI_API_KEY environment variable for real speech-to-text.",
        note: "Mock response - set ASSEMBLYAI_API_KEY environment variable"
      });
    }
    
    try {
      // Step 1: Upload audio file
      const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', 
        fs.createReadStream(req.file.path), {
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
          'content-type': 'application/octet-stream',
        },
      });

      // Step 2: Request transcription
      const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
        audio_url: uploadResponse.data.upload_url,
      }, {
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
          'content-type': 'application/json',
        },
      });

      const transcriptId = transcriptResponse.data.id;

      // Step 3: Poll for completion (simplified - in production, use webhooks)
      let transcript;
      let attempts = 0;
      do {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        const pollingResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: { 'authorization': ASSEMBLYAI_API_KEY },
        });
        transcript = pollingResponse.data;
        attempts++;
      } while (transcript.status === 'processing' && attempts < 20);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      if (transcript.status === 'completed') {
        res.json({ success: true, text: transcript.text });
      } else {
        throw new Error('Transcription failed or timed out');
      }
    } catch (apiError) {
      // Fallback: Mock response
      console.log('AssemblyAI failed, using mock response');
      fs.unlinkSync(req.file.path);
      res.json({ 
        success: true, 
        text: "This is a mock transcription. Please configure AssemblyAI API key for real speech-to-text.",
        note: "Mock response - configure AssemblyAI API key"
      });
    }
  } catch (error) {
    console.error('Speech to text error:', error);
    res.json({ success: false, error: error.message });
  }
});
// 2. Text to Image (Using Pollinations AI - completely free)
app.post('/generate-image', async (req, res) => {
  try {
    let { prompt } = req.body;

    if (!prompt) {
      return res.json({ success: false, error: 'No prompt provided' });
    }

    // Sanitize prompt
    prompt = prompt.trim().replace(/\.+$/, ''); // remove trailing periods

    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}`;

    try {
      await axios.head(imageUrl);
      return res.json({ success: true, imageUrl });
    } catch (error) {
      console.warn('Pollinations image not reachable. Using fallback.', error.message);
      const fallbackUrl = `https://picsum.photos/1024/1024?random=${Date.now()}`;
      return res.json({
        success: true,
        imageUrl: fallbackUrl,
        note: "Using placeholder image - Pollinations AI may be temporarily unavailable"
      });
    }
  } catch (error) {
    console.error('Image generation error:', error);
    return res.json({ success: false, error: error.message });
  }
});

// 3. Object Detection using Hugging Face

// Method: Using Hugging Face with proper error handling and model selection
async function detectObjectsHuggingFace(file) {
  try {
    const imageBuffer = fs.readFileSync(file.path);
    
    // Try multiple models in order of preference
    const models = [
      'facebook/detr-resnet-50',
      'microsoft/DiT-base-224',
      'google/vit-base-patch16-224'
    ];

    const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
    
    if (!HUGGING_FACE_API_KEY) {
      throw new Error('HUGGING_FACE_API_KEY not configured');
    }

    for (const model of models) {
      try {
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${model}`,
          imageBuffer,
          {
            headers: {
              'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
              'Content-Type': 'application/octet-stream'
            },
            timeout: 30000
          }
        );

        if (response.data && Array.isArray(response.data)) {
          const objects = response.data
            .filter(item => item.score > 0.4)
            .map(item => item.label)
            .filter((v, i, a) => a.indexOf(v) === i);
          
          return {
            success: true,
            objects: objects,
            confidence_scores: response.data
              .filter(item => item.score > 0.5)
              .map(item => ({
                object: item.label,
                confidence: Math.round(item.score * 100)
              })),
            api_used: `Hugging Face (${model})`
          };
        }
      } catch (modelError) {
        console.log(`Model ${model} failed:`, modelError.message);
        continue;
      }
    }
    
    throw new Error('All Hugging Face models failed');
  } catch (error) {
    throw new Error(`Hugging Face API error: ${error.message}`);
  }
}

// Enhanced Mock Detection with better logic
async function getEnhancedMockObjectDetection(file) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  try {
    // Try to get some basic info about the image
    const stats = fs.statSync(file.path);
    const fileSize = stats.size;
    
    // Different mock responses based on file size and name patterns
    let selectedObjects = [];
    const filename = file.originalname.toLowerCase();
    
    if (filename.includes('person') || filename.includes('people')) {
      selectedObjects = ['person', 'face', 'clothing', 'hair'];
    } else if (filename.includes('car') || filename.includes('vehicle')) {
      selectedObjects = ['car', 'wheel', 'license plate', 'road'];
    } else if (filename.includes('animal') || filename.includes('dog') || filename.includes('cat')) {
      selectedObjects = ['animal', 'fur', 'eyes', 'tail'];
    } else if (filename.includes('food') || filename.includes('kitchen')) {
      selectedObjects = ['food', 'plate', 'utensils', 'table'];
    } else if (filename.includes('nature') || filename.includes('outdoor')) {
      selectedObjects = ['tree', 'sky', 'grass', 'building'];
    } else if (filename.includes('cricket') || filename.includes('bat')) {
      selectedObjects = ['bat', 'ball', 'grass', 'cricket'];
    } else {
      // General objects based on file size
      const commonObjects = [
        'person', 'car', 'bicycle', 'dog', 'cat', 'chair', 'table', 'bottle',
        'cell phone', 'laptop', 'book', 'clock', 'cup', 'bowl', 'apple',
        'orange', 'banana', 'sandwich', 'pizza', 'cake', 'plant', 'flower',
        'tree', 'building', 'sky', 'grass', 'road', 'sign', 'light'
      ];
      
      const numObjects = fileSize > 500000 ? 6 : fileSize > 100000 ? 4 : 3;
      
      for (let i = 0; i < numObjects; i++) {
        const randomIndex = Math.floor(Math.random() * commonObjects.length);
        const obj = commonObjects[randomIndex];
        if (!selectedObjects.includes(obj)) {
          selectedObjects.push(obj);
        }
      }
    }
    
    return {
      success: true,
      objects: selectedObjects,
      confidence_scores: selectedObjects.map(obj => ({
        object: obj,
        confidence: Math.floor(Math.random() * 30) + 70 // 70-99% confidence
      })),
      api_used: 'Enhanced Mock Detection',
      note: 'Intelligent mock detection based on filename and file properties. Set HUGGING_FACE_API_KEY environment variable for real detection.',
      file_analysis: {
        filename: file.originalname,
        size_kb: Math.round(fileSize / 1024),
        detected_context: filename.includes('person') ? 'human' : 
                         filename.includes('car') ? 'vehicle' :
                         filename.includes('animal') ? 'animal' : 'general'
      }
    };
  } catch (error) {
    // Ultimate fallback
    return {
      success: true,
      objects: ['unknown_object', 'generic_item'],
      confidence_scores: [
        { object: 'unknown_object', confidence: 75 },
        { object: 'generic_item', confidence: 60 }
      ],
      api_used: 'Basic Mock Detection',
      note: 'Basic fallback detection - image could not be analyzed'
    };
  }
}

// Updated main detection function
app.post('/detect-objects', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image provided' });
  }

  try {
    console.log(`Processing image: ${req.file.originalname}, size: ${req.file.size} bytes`);
    
    let result = null;
    
    // Try Hugging Face first
    try {
      result = await detectObjectsHuggingFace(req.file);
      if (result.success) {
        console.log('Successfully used Hugging Face API');
        fs.unlinkSync(req.file.path);
        return res.json(result);
      }
    } catch (error) {
      console.log('Hugging Face API failed:', error.message);
    }

    // Fallback to enhanced mock detection
    console.log('Hugging Face API failed, using enhanced mock detection');
    result = await getEnhancedMockObjectDetection(req.file);
    fs.unlinkSync(req.file.path);
    return res.json(result);

  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Object detection completely failed:', error);
    res.status(500).json({
      success: false,
      error: 'Object detection failed completely',
      details: error.message
    });
  }
});

// Helper function to call Groq API (Free OpenAI alternative)
async function callGroqAPI(messages, maxTokens = 500) {
  try {
    // Using Groq's free API - requires API key from groq.com
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-8b-8192', // Free model
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);
    throw new Error('Groq API request failed');
  }
}

// 4. PDF Summarization (Using Groq free API or mock)
app.post('/summarize-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, error: 'No PDF file provided' });
    }

    // Extract text from PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;

    if (!extractedText.trim()) {
      return res.json({ success: false, error: 'No text found in PDF' });
    }

    try {
      // Try using Groq API for summarization
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes documents. Provide a concise but comprehensive summary of the given text.'
        },
        {
          role: 'user',
          content: `Please summarize this document:\n\n${extractedText.substring(0, 4000)}` // Limit for free tier
        }
      ];

      const data = await callGroqAPI(messages, 300);
      const summary = data.choices[0].message.content;

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({ success: true, summary: summary });
    } catch (apiError) {
      // Fallback: Simple text processing summary
      const sentences = extractedText.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const firstFewSentences = sentences.slice(0, 3).join('. ') + '.';
      const wordCount = extractedText.split(/\s+/).length;
      
      const mockSummary = `This document contains approximately ${wordCount} words. Key content: ${firstFewSentences} [This is a basic summary - set GROQ_API_KEY environment variable for AI-powered summarization]`;

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({ 
        success: true, 
        summary: mockSummary,
        note: "Basic summary - set GROQ_API_KEY environment variable for AI summarization"
      });
    }
  } catch (error) {
    console.error('PDF summarization error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Store conversation context for interviewer
let conversationContext = [];

// Alternative: Use local LLM or mock response
async function getMockChatResponse(messages) {
  // Simple rule-based responses for demonstration
  const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  
  if (userMessage.includes('introduce') || userMessage.includes('hello')) {
    return "Hello! I'm excited to interview you today. Could you please start by telling me about yourself and your background in software engineering?";
  } else if (userMessage.includes('experience') || userMessage.includes('background')) {
    return "That's great! Now, let's dive into some technical questions. Can you explain the difference between a stack and a queue, and when you might use each one?";
  } else if (userMessage.includes('stack') || userMessage.includes('queue')) {
    return "Excellent explanation! Let's talk about algorithms. How would you approach finding the longest palindromic substring in a given string?";
  } else if (userMessage.includes('algorithm') || userMessage.includes('palindrome')) {
    return "Good approach! Now let's discuss system design. How would you design a URL shortening service like bit.ly?";
  } else {
    return "That's an interesting point. Can you elaborate on that and also tell me about a challenging project you've worked on recently?";
  }
}

// 5. Start AI Interview (Using Groq or mock responses)
app.post('/start-interview', async (req, res) => {
  try {
    conversationContext = [
      {
        role: 'system',
        content: `You are an experienced software engineering interviewer. Your role is to:
        1. Conduct a professional technical interview
        2. Ask relevant questions about programming, algorithms, system design, and problem-solving
        3. Be encouraging but thorough
        4. Ask follow-up questions based on the candidate's responses
        5. Cover both technical skills and soft skills
        6. Keep responses concise and professional
        7. Your name is sanny
        
        Start the interview with a warm greeting and ask the candidate to introduce themselves.`
      }
    ];

    try {
      const data = await callGroqAPI(conversationContext, 200);
      const message = data.choices[0].message.content;
      conversationContext.push({ role: 'assistant', content: message });

      res.json({ success: true, message: message });
    } catch (apiError) {
      // Fallback to mock response
      const message = await getMockChatResponse([]);
      conversationContext.push({ role: 'assistant', content: message });
      
      res.json({ 
        success: true, 
        message: message,
        note: "Using mock interviewer - set GROQ_API_KEY environment variable for AI interviewer"
      });
    }
  } catch (error) {
    console.error('Interview start error:', error);
    res.json({ success: false, error: error.message });
  }
});

// 6. Chat with AI Interviewer (Using Groq or mock responses)
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.json({ success: false, error: 'Invalid messages format' });
    }

    // Update conversation context with system message
    const fullContext = [
      {
        role: 'system',
        content: `You are an experienced software engineering interviewer. Continue the interview by:
        1. Responding to the candidate's answer appropriately
        2. Asking relevant follow-up questions
        3. Gradually increasing difficulty if they're doing well
        4. Covering different areas: coding, algorithms, system design, experience
        5. Being professional and encouraging
        6. Keep responses concise (2-3 sentences max)
        7. Your name is sanny`
      },
      ...messages
    ];

    try {
      const data = await callGroqAPI(fullContext, 250);
      const message = data.choices[0].message.content;
      res.json({ success: true, message: message });
    } catch (apiError) {
      // Fallback to mock response
      const message = await getMockChatResponse(messages);
      res.json({ 
        success: true, 
        message: message,
        note: "Using mock interviewer - set GROQ_API_KEY environment variable for AI interviewer"
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Multi-Feature Server (Free APIs) running on http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('  POST /speech-to-text    - Convert voice to text (AssemblyAI free/mock)');
  console.log('  POST /generate-image    - Generate images (Pollinations AI - free)');
  console.log('  POST /detect-objects    - Detect objects (Hugging Face free/mock)');
  console.log('  POST /summarize-pdf     - Summarize PDFs (Groq free/mock)');
  console.log('  POST /start-interview   - Start AI interviewer (Groq free/mock)');
  console.log('  POST /chat             - Chat with AI interviewer (Groq free/mock)');
  console.log('  GET /health            - Check server health');
  console.log('');
  console.log('🆓 Free API Services Used:');
  console.log('  - Pollinations AI: Completely free image generation');
  console.log('  - Hugging Face: Free inference API (rate limited)');
  console.log('  - AssemblyAI: 60 minutes/month free');
  console.log('  - Groq: Free tier for LLM API');
  console.log('');
  console.log('🔧 Optional API Keys (for better performance):');
  console.log('  - ASSEMBLYAI_API_KEY for speech-to-text');
  console.log('  - GROQ_API_KEY for AI chat features');
  console.log('');
  console.log('💡 Note: All features work with mock responses if APIs are unavailable');
});