import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Webhook endpoint
app.post('/webhook', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, linkedinUrl } = req.body;
    const resume = req.file;

    // Log the received data
    console.log('Received webhook data:', {
      name,
      email,
      linkedinUrl,
      resumeFile: resume ? resume.filename : 'No file uploaded'
    });

    // Here you can add your processing logic
    // For example:
    // - Parse the resume
    // - Analyze the LinkedIn job posting
    // - Generate optimized resume
    // - Send email with results

    // Send success response
    res.status(200).json({
      message: 'Webhook received successfully',
      data: {
        name,
        email,
        linkedinUrl,
        resumeFile: resume ? resume.filename : null
      }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Webhook server running on port ${port}`);
});