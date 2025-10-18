// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const Groq = require('groq-sdk');
// const { createClient } = require('@supabase/supabase-js');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Service Initialization
// let groq;
// let supabase;

// try {
//   if (process.env.GROQ_API_KEY) {
//     groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
//   } else {
//     console.warn('⚠️  GROQ_API_KEY not found. AI responses will not work.');
//   }

//   if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
//     supabase = createClient(
//       process.env.SUPABASE_URL,
//       process.env.SUPABASE_ANON_KEY
//     );
//   } else {
//     console.warn('⚠️  Supabase credentials not found. Conversation history disabled.');
//   }
// } catch (error) {
//   console.error('Error initializing services:', error);
// }

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.static('public'));

// // Constants
// const SYSTEM_PROMPT = `You are VoiceTutor, an enthusiastic and expert AI study assistant. Your role is to:

// 1. EXPLAIN concepts clearly and conversationally in 2-3 sentences
// 2. BREAK DOWN complex topics into simple, digestible parts
// 3. ALWAYS end your response with a relevant follow-up question to test understanding
// 4. USE encouraging and supportive language
// 5. ADAPT to the user's learning level
// 6. KEEP responses concise for voice interaction

// Example format:
// "Great question! [Clear explanation]. Now, to make sure this sticks, [follow-up question]?"`;

// // Utility Functions
// function generateSessionId() {
//   return 'session_' + Math.random().toString(36).substr(2, 9);
// }

// // Route Handlers (DEFINE THESE BEFORE THE ROUTES)
// async function handleChat(req, res) {
//   try {
//     const { message, sessionId } = req.body;
    
//     if (!message) {
//       return res.status(400).json({ error: 'No message provided' });
//     }

//     // Check if Groq is available
//     if (!groq) {
//       return res.status(503).json({ 
//         error: 'AI service unavailable. Please check GROQ_API_KEY configuration.',
//         response: "I'm sorry, but the AI service is currently unavailable. Please check the server configuration."
//       });
//     }

//     console.log('Processing question:', message);

//     // Get AI response from Groq
//     const completion = await groq.chat.completions.create({
//       messages: [
//         { 
//           role: 'system', 
//           content: SYSTEM_PROMPT
//         },
//         { role: 'user', content: message }
//       ],
//       model: 'llama-3.1-8b-instant',
//       temperature: 0.7,
//       max_tokens: 300
//     });

//     const aiResponse = completion.choices[0]?.message?.content;

//     // Save to Supabase if available
//     if (sessionId && supabase) {
//       try {
//         await supabase
//           .from('conversations')
//           .insert([
//             {
//               session_id: sessionId,
//               user_message: message,
//               ai_response: aiResponse,
//               created_at: new Date().toISOString()
//             }
//           ]);
//         console.log('Conversation saved to database');
//       } catch (dbError) {
//         console.log('Database save skipped:', dbError.message);
//       }
//     }

//     res.json({ 
//       response: aiResponse,
//       sessionId: sessionId || generateSessionId()
//     });
    
//   } catch (error) {
//     console.error('Error in /api/chat:', error);
//     res.status(500).json({ 
//       error: 'Failed to process question',
//       details: error.message 
//     });
//   }
// }

// async function handleSpeechSynthesis(req, res) {
//   try {
//     const { text } = req.body;
    
//     if (!text) {
//       return res.status(400).json({ error: 'No text provided' });
//     }

//     // If no ElevenLabs API key, use browser TTS
//     if (!process.env.ELEVENLABS_API_KEY) {
//       return res.json({ 
//         audioContent: null,
//         mimeType: 'audio/mpeg',
//         message: 'Use browser TTS'
//       });
//     }

//     const response = await axios.post(
//       `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'}`,
//       {
//         text: text,
//         model_id: 'eleven_monolingual_v1',
//         voice_settings: {
//           stability: 0.5,
//           similarity_boost: 0.5
//         }
//       },
//       {
//         headers: {
//           'xi-api-key': process.env.ELEVENLABS_API_KEY,
//           'Content-Type': 'application/json'
//         },
//         responseType: 'arraybuffer'
//       }
//     );

//     const audioBase64 = Buffer.from(response.data).toString('base64');
    
//     res.json({
//       audioContent: audioBase64,
//       mimeType: 'audio/mpeg'
//     });

//   } catch (error) {
//     console.error('ElevenLabs API error:', error.response?.data || error.message);
//     res.status(500).json({ 
//       error: 'Failed to synthesize speech',
//       details: 'Using browser TTS fallback'
//     });
//   }
// }

// async function getConversationHistory(req, res) {
//   try {
//     const { sessionId } = req.params;
    
//     if (!supabase) {
//       return res.json({ conversations: [] });
//     }

//     const { data, error } = await supabase
//       .from('conversations')
//       .select('*')
//       .eq('session_id', sessionId)
//       .order('created_at', { ascending: true });

//     if (error) throw error;

//     res.json({ conversations: data || [] });
//   } catch (error) {
//     console.error('Error fetching conversations:', error);
//     res.json({ conversations: [] });
//   }
// }

// function healthCheck(req, res) {
//   res.json({ 
//     status: 'OK', 
//     timestamp: new Date().toISOString(),
//     services: {
//       groq: !!process.env.GROQ_API_KEY,
//       elevenlabs: !!process.env.ELEVENLABS_API_KEY,
//       supabase: !!process.env.SUPABASE_URL
//     }
//   });
// }

// function serveFrontend(req, res) {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// }

// // Routes (NOW THESE CAN USE THE FUNCTIONS)
// app.post('/api/chat', handleChat);
// app.post('/api/synthesize-speech', handleSpeechSynthesis);
// app.get('/api/conversations/:sessionId', getConversationHistory);
// app.get('/api/health', healthCheck);
// app.get('/', serveFrontend);

// // Start Server
// app.listen(PORT, () => {
//   console.log(`🚀 VoiceTutor running on http://localhost:${PORT}`);
//   console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  
//   // Log service status
//   if (!process.env.GROQ_API_KEY) {
//     console.warn('⚠️  GROQ_API_KEY not found. AI responses will not work.');
//   }
  
//   if (!process.env.ELEVENLABS_API_KEY) {
//     console.warn('⚠️  ELEVENLABS_API_KEY not found. Using browser TTS fallback.');
//   }
  
//   if (!process.env.SUPABASE_URL) {
//     console.warn('⚠️  Supabase credentials not found. Conversation history disabled.');
//   }
// });
const express = require('express');
const cors = require('cors');
const path = require('path');
const Groq = require('groq-sdk');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Service Initialization
let groq;
let supabase;

try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } else {
    console.warn('⚠️  GROQ_API_KEY not found. AI responses will not work.');
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  } else {
    console.warn('⚠️  Supabase credentials not found. Conversation history disabled.');
  }
} catch (error) {
  console.error('Error initializing services:', error);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Constants
const SYSTEM_PROMPT = `You are VoiceTutor, an enthusiastic and expert AI study assistant. Your role is to:

1. EXPLAIN concepts clearly and conversationally in 2-3 sentences
2. BREAK DOWN complex topics into simple, digestible parts
3. ALWAYS end your response with a relevant follow-up question to test understanding
4. USE encouraging and supportive language
5. ADAPT to the user's learning level
6. KEEP responses concise for voice interaction

Example format:
"Great question! [Clear explanation]. Now, to make sure this sticks, [follow-up question]?"`;

// Utility Functions
function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9);
}

// Route Handlers
async function handleChat(req, res) {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // Check if Groq is available
    if (!groq) {
      return res.status(503).json({ 
        error: 'AI service unavailable. Please check GROQ_API_KEY configuration.',
        response: "I'm sorry, but the AI service is currently unavailable. Please check the server configuration."
      });
    }

    console.log('Processing question:', message);

    // Get AI response from Groq
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: SYSTEM_PROMPT
        },
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 300
    });

    const aiResponse = completion.choices[0]?.message?.content;

    // Save to Supabase if available
    if (sessionId && supabase) {
      try {
        await supabase
          .from('conversations')
          .insert([
            {
              session_id: sessionId,
              user_message: message,
              ai_response: aiResponse,
              created_at: new Date().toISOString()
            }
          ]);
        console.log('Conversation saved to database');
      } catch (dbError) {
        console.log('Database save skipped:', dbError.message);
      }
    }

    res.json({ 
      response: aiResponse,
      sessionId: sessionId || generateSessionId()
    });
    
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ 
      error: 'Failed to process question',
      details: error.message 
    });
  }
}

async function handleSpeechSynthesis(req, res) {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // If no ElevenLabs API key, use browser TTS
    if (!process.env.ELEVENLABS_API_KEY) {
      console.log('ElevenLabs: No API key, using browser TTS fallback');
      return res.json({ 
        audioContent: null,
        mimeType: 'audio/mpeg',
        message: 'Use browser TTS'
      });
    }

    console.log('Synthesizing speech with ElevenLabs...');

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'}`,
      {
        text: text.substring(0, 5000), // Limit text length
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout
      }
    );

    const audioBase64 = Buffer.from(response.data).toString('base64');
    
    console.log('Speech synthesized successfully');
    res.json({
      audioContent: audioBase64,
      mimeType: 'audio/mpeg'
    });

  } catch (error) {
    console.error('❌ ElevenLabs API error:', error.response?.status, error.response?.data?.detail?.message || error.message);
    
    // Handle specific ElevenLabs errors
    if (error.response?.data) {
      const buffer = error.response.data;
      let errorMessage = 'Unknown ElevenLabs error';
      
      try {
        // Try to parse the buffer as JSON
        const errorData = JSON.parse(buffer.toString());
        errorMessage = errorData.detail?.message || errorData.detail?.status || JSON.stringify(errorData);
      } catch (parseError) {
        errorMessage = buffer.toString().substring(0, 200); // First 200 chars
      }
      
      console.error('ElevenLabs error details:', errorMessage);
      
      if (errorMessage.includes('quota_exceeded') || errorMessage.includes('quota')) {
        console.log('🎯 ElevenLabs quota exceeded - switching to browser TTS');
        return res.json({ 
          audioContent: null,
          mimeType: 'audio/mpeg',
          message: 'Quota exceeded, using browser TTS'
        });
      }
    }
    
    // Fallback to browser TTS for any error
    console.log('Using browser TTS fallback due to ElevenLabs error');
    res.json({ 
      audioContent: null,
      mimeType: 'audio/mpeg',
      message: 'Using browser TTS fallback'
    });
  }
}

async function getConversationHistory(req, res) {
  try {
    const { sessionId } = req.params;
    
    if (!supabase) {
      return res.json({ conversations: [] });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ conversations: data || [] });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.json({ conversations: [] });
  }
}

function healthCheck(req, res) {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      groq: !!process.env.GROQ_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      supabase: !!process.env.SUPABASE_URL
    }
  });
}

function serveFrontend(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
}

// Routes
app.post('/api/chat', handleChat);
app.post('/api/synthesize-speech', handleSpeechSynthesis);
app.get('/api/conversations/:sessionId', getConversationHistory);
app.get('/api/health', healthCheck);
app.get('/', serveFrontend);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 VoiceTutor running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  
  // Log service status
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️  GROQ_API_KEY not found. AI responses will not work.');
  }
  
  if (!process.env.ELEVENLABS_API_KEY) {
    console.warn('⚠️  ELEVENLABS_API_KEY not found. Using browser TTS fallback.');
  } else {
    console.log('✅ ElevenLabs API key found');
  }
  
  if (!process.env.SUPABASE_URL) {
    console.warn('⚠️  Supabase credentials not found. Conversation history disabled.');
  }
});