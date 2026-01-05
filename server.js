import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// DeepSeek API Configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'; 
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  console.log('[Server] Received chat request');
  try {
    const { messages } = req.body;

    if (!DEEPSEEK_API_KEY) {
      console.error('[Server] Error: API Key missing');
      return res.status(500).json({ error: 'DeepSeek API Key not configured' });
    }

    console.log('[Server] Forwarding to DeepSeek API...');
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", 
        messages: messages,
        temperature: 0.7,
        max_tokens: 100 
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Server] DeepSeek API Error:', response.status, errorData);
      return res.status(response.status).json({ error: 'Provider API Error', details: errorData });
    }

    const data = await response.json();
    console.log('[Server] Success, sending response to client');
    res.json(data);

  } catch (error) {
    console.error('[Server] Internal Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`AI Backend Server running on http://localhost:${PORT}`);
});
