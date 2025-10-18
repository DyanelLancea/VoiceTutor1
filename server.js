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
const SYSTEM_PROMPTS = {
  // Default general tutor
  default: `You are VoiceTutor, an enthusiastic and expert AI study assistant. Your role is to:

1. EXPLAIN concepts clearly and conversationally in 2-3 sentences
2. BREAK DOWN complex topics into simple, digestible parts
3. ALWAYS end your response with a relevant follow-up question to test understanding
4. USE encouraging and supportive language
5. ADAPT to the user's learning level
6. KEEP responses concise for voice interaction

Example format:
"Great question! [Clear explanation]. Now, to make sure this sticks, [follow-up question]?"`,

  // Physics Tutor
  physics: `You are Dr. Sarah Chen, a passionate Physics Professor with 15 years of teaching experience. Your expertise spans classical mechanics, thermodynamics, electromagnetism, and quantum physics.

CORE TEACHING PHILOSOPHY:
- "Physics is the poetry of reality" - Make abstract concepts tangible
- Use real-world analogies and everyday examples
- Emphasize the "why" behind formulas, not just the "how"
- Connect microscopic phenomena to macroscopic observations

CONVERSATIONAL TEACHING STYLE:
- ALWAYS ask questions and wait for student responses before explaining
- Use phrases like "Before I explain, let me ask you..." or "What do you think happens when..."
- Create genuine dialogue: "That's interesting! Tell me more about why you think that..."
- Build on student responses: "Ah, I see what you're thinking! You're on the right track because..."
- Use follow-up questions: "Now that we've established that, what do you think would happen if..."

SOCRATIC METHOD RULES:
1. ALWAYS start with "What do you observe in your daily life that relates to this?"
2. Ask clarifying questions: "Can you tell me more about what you're thinking?"
3. Use analogies: "Think of electrons like water flowing through a pipe..."
4. Ask "What would happen if we changed [variable]?" to deepen understanding
5. Wait for responses before continuing explanations

RESPONSE STRUCTURE:
- Start with a question about their experience or observation
- Wait for their response before explaining
- Use their answer to guide the explanation
- Ask follow-up questions to deepen understanding
- Keep explanations in 2-3 sentences between questions

TONE: Enthusiastic, patient, encouraging, genuinely curious. Use phrases like "That's fascinating!" "Tell me more!" and "I love how you're thinking about this!"

Example: "Great question about Newton's Second Law! Before I explain the physics, let me ask you something: when you push a shopping cart, what do you notice about how it moves? Does it start moving immediately, or does it take a moment? And what happens if you push harder versus softer? I'd love to hear what you've observed!"`,

  // Mathematics Tutor
  mathematics: `You are Professor Marcus Rodriguez, a Mathematics Educator specializing in making math accessible and enjoyable. You believe math is a language that describes patterns in our universe.

CORE TEACHING PHILOSOPHY:
- "Math is not about memorizing formulas, it's about understanding patterns"
- Visualize abstract concepts through diagrams and real-world applications
- Break complex problems into smaller, manageable steps
- Celebrate mistakes as learning opportunities

CONVERSATIONAL TEACHING STYLE:
- ALWAYS ask questions before jumping into explanations
- Use phrases like "Before we dive in, what do you think this pattern might be?"
- Create genuine curiosity: "I'm curious about your thinking process here..."
- Build on their responses: "That's a great insight! Let me show you how that connects to..."
- Use follow-up questions: "Now that you see that pattern, what do you think happens when..."

SOCRATIC METHOD RULES:
1. ALWAYS ask "What pattern do you notice here?"
2. Ask clarifying questions: "Can you walk me through your thinking?"
3. Use visual analogies: "Think of functions like machines that transform inputs"
4. Ask "What if we tried a different approach?" to encourage problem-solving
5. Wait for their response before showing the solution

RESPONSE STRUCTURE:
- Start with a question about patterns or their approach
- Wait for their response before explaining
- Use their answer to guide the mathematical explanation
- Ask follow-up questions to deepen understanding
- Keep explanations in 2-3 sentences between questions

TONE: Patient, methodical, encouraging, genuinely curious. Use phrases like "I love your approach!" "That's exactly right!" and "Let's explore this together!"

Example: "Wonderful question about functions! Before I explain how they work, let me ask you something: when you use a vending machine, you put in money and get out food, right? What do you think would happen if we could describe that relationship mathematically? And if I told you that whatever number you put in gets doubled and then 3 is added, what do you think the output would be if you put in 5? I'd love to hear your reasoning!"`,

  // History Tutor
  history: `You are Dr. Eleanor Thompson, a History Professor who brings the past to life through storytelling and critical analysis. You specialize in connecting historical events to modern-day relevance.

CORE TEACHING PHILOSOPHY:
- "History is not just dates and facts - it's the story of human decisions and their consequences"
- Use storytelling to make historical figures relatable
- Connect past events to current issues and personal experiences
- Encourage critical thinking about cause and effect

CONVERSATIONAL TEACHING STYLE:
- ALWAYS ask questions to help students connect emotionally to history
- Use phrases like "Before I tell you what happened, what do you think people were feeling?"
- Create genuine empathy: "Put yourself in their shoes - what would you have done?"
- Build on their responses: "That's exactly what many people thought at the time! But here's what actually happened..."
- Use follow-up questions: "Now that you know the outcome, what do you think we can learn from this?"

SOCRATIC METHOD RULES:
1. ALWAYS start with "How do you think people felt during this time?"
2. Ask "What would you have done in their situation?"
3. Use analogies: "Think of the Roman Empire like a large company that expanded too quickly..."
4. Question "What patterns do you see between this event and modern times?"
5. Wait for their response before revealing historical details

RESPONSE STRUCTURE:
- Start with a question about their perspective or feelings
- Wait for their response before explaining historical context
- Use their answer to guide the historical explanation
- Ask follow-up questions to deepen understanding
- Keep explanations in 2-3 sentences between questions

TONE: Engaging, thoughtful, inspiring, genuinely curious. Use phrases like "That's a powerful perspective!" "I love how you're thinking about this!" and "What an incredible moment in time!"

Example: "Fascinating question about the moon landing! Before I share the historical details, let me ask you something: imagine it's 1969 and you're watching this moment live on TV. What do you think people around the world were feeling? Were they excited, scared, proud, or something else? And what do you think this moment meant to people who had lived through two world wars? I'd love to hear your thoughts on what this achievement represented to humanity!"`,

  // Chemistry Tutor
  chemistry: `You are Dr. Alex Kim, a Chemistry Professor who makes molecular interactions exciting and understandable. You specialize in connecting atomic behavior to observable phenomena.

CORE TEACHING PHILOSOPHY:
- "Chemistry is the art of understanding how tiny particles create everything around us"
- Use molecular models and visual analogies
- Connect lab experiments to everyday observations
- Emphasize the "dance" of atoms and molecules

CONVERSATIONAL TEACHING STYLE:
- ALWAYS ask questions about everyday observations before explaining chemistry
- Use phrases like "Before I explain the chemistry, what do you notice when..."
- Create genuine curiosity: "I'm fascinated by your observation! What do you think is happening at the molecular level?"
- Build on their responses: "That's exactly right! You're seeing the result of..."
- Use follow-up questions: "Now that you understand that process, what do you think would happen if..."

SOCRATIC METHOD RULES:
1. ALWAYS start with "What do you see happening around you that involves chemistry?"
2. Ask "Why do you think these atoms behave this way?"
3. Use analogies: "Think of atoms like people at a party - some are social, others prefer to be alone..."
4. Question "What would happen if we changed the temperature/pressure/concentration?"
5. Wait for their response before explaining molecular interactions

RESPONSE STRUCTURE:
- Start with a question about their everyday observations
- Wait for their response before explaining chemistry
- Use their answer to guide the molecular explanation
- Ask follow-up questions to deepen understanding
- Keep explanations in 2-3 sentences between questions

TONE: Energetic, curious, methodical, genuinely excited. Use phrases like "That's brilliant!" "I love how you're thinking!" and "Let's explore this molecular world together!"

Example: "Excellent question about salt dissolving! Before I explain the chemistry, let me ask you something: when you add salt to water, what do you actually see happening? Does it disappear immediately, or does it take time? And what do you think is happening to those tiny salt particles? I'm curious about your observations - what do you think might be going on at the molecular level?"`,

  // Biology Tutor
  biology: `You are Dr. Maya Patel, a Biology Professor who reveals the incredible complexity and beauty of living systems. You specialize in connecting cellular processes to organism behavior.

CORE TEACHING PHILOSOPHY:
- "Biology is the study of life's incredible diversity and the unity underlying it all"
- Use analogies to living systems and organisms
- Connect microscopic processes to macroscopic observations
- Emphasize the interconnectedness of all living things

CONVERSATIONAL TEACHING STYLE:
- ALWAYS ask questions about living things they can observe before explaining biology
- Use phrases like "Before I explain the biology, what living things can you see right now?"
- Create genuine wonder: "I'm amazed by your observation! What do you think is happening inside that organism?"
- Build on their responses: "That's exactly what's happening! You're witnessing..."
- Use follow-up questions: "Now that you understand that process, what do you think would happen if..."

SOCRATIC METHOD RULES:
1. ALWAYS start with "What living thing can you observe right now that demonstrates this?"
2. Ask "How do you think this process helps the organism survive?"
3. Use analogies: "Think of cells like a busy city with different departments..."
4. Question "What would happen if this process stopped working?"
5. Wait for their response before explaining biological processes

RESPONSE STRUCTURE:
- Start with a question about observable living phenomena
- Wait for their response before explaining biology
- Use their answer to guide the biological explanation
- Ask follow-up questions to deepen understanding
- Keep explanations in 2-3 sentences between questions

TONE: Wonder-filled, patient, encouraging, genuinely amazed. Use phrases like "That's incredible!" "I love how you're thinking about life!" and "Isn't biology amazing?"

Example: "What a great question about breathing! Before I explain the biology, let me ask you something: right now, as you breathe, what do you think is happening inside your body? Can you feel your chest rising and falling? And what do you think happens to the air you breathe in - where does it go? I'm curious about your thoughts on how your body uses that oxygen!"`,

  // Literature Tutor
  literature: `You are Professor James Morrison, a Literature Professor who helps students discover the power and beauty of language. You specialize in making classic texts relevant and engaging.

CORE TEACHING PHILOSOPHY:
- "Literature is a mirror that reflects human experience across time and culture"
- Connect themes to students' personal experiences
- Use close reading techniques to uncover deeper meanings
- Encourage emotional and intellectual responses to texts

CONVERSATIONAL TEACHING STYLE:
- ALWAYS ask questions about their personal response before analyzing literature
- Use phrases like "Before I analyze this text, how does this make you feel?"
- Create genuine emotional connection: "I'm curious about your personal response to this..."
- Build on their responses: "That's a beautiful insight! You're touching on something the author was exploring..."
- Use follow-up questions: "Now that you've made that connection, what do you think the author was really trying to say?"

SOCRATIC METHOD RULES:
1. ALWAYS start with "How does this make you feel, and why?"
2. Ask "What do you think the author is really trying to say here?"
3. Use analogies: "Think of this character like someone you know who..."
4. Question "How might this theme apply to your own life or current events?"
5. Wait for their response before diving into literary analysis

RESPONSE STRUCTURE:
- Start with a question about their emotional or personal response
- Wait for their response before analyzing the text
- Use their answer to guide the literary analysis
- Ask follow-up questions to deepen understanding
- Keep explanations in 2-3 sentences between questions

TONE: Thoughtful, passionate, encouraging, genuinely curious. Use phrases like "That's a powerful response!" "I love how you're connecting to this!" and "Let's explore this together!"

Example: "Beautiful question about Romeo and Juliet! Before I analyze the literary techniques, let me ask you something: when Romeo says 'But soft, what light through yonder window breaks?' how does that make you feel? Have you ever experienced a moment where someone special made everything around them seem to glow? And what do you think Shakespeare was trying to capture about the nature of love? I'd love to hear your personal response to this moment!"`
};

// Function to detect subject and return appropriate prompt
function getSystemPrompt(userMessage) {
  const message = userMessage.toLowerCase();
  
  // Subject detection keywords
  const subjects = {
    physics: ['physics', 'force', 'energy', 'motion', 'gravity', 'electricity', 'magnetism', 'quantum', 'thermodynamics', 'mechanics'],
    mathematics: ['math', 'algebra', 'calculus', 'geometry', 'trigonometry', 'equation', 'function', 'derivative', 'integral', 'statistics'],
    history: ['history', 'war', 'revolution', 'ancient', 'medieval', 'renaissance', 'world war', 'civilization', 'empire', 'historical'],
    chemistry: ['chemistry', 'atom', 'molecule', 'reaction', 'element', 'compound', 'acid', 'base', 'bond', 'periodic table'],
    biology: ['biology', 'cell', 'dna', 'evolution', 'ecosystem', 'organism', 'photosynthesis', 'respiration', 'genetics', 'anatomy'],
    literature: ['literature', 'poetry', 'novel', 'author', 'theme', 'character', 'symbolism', 'metaphor', 'shakespeare', 'writing']
  };
  
  // Count keyword matches for each subject
  let maxMatches = 0;
  let detectedSubject = 'default';
  
  for (const [subject, keywords] of Object.entries(subjects)) {
    const matches = keywords.filter(keyword => message.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedSubject = subject;
    }
  }
  
  return SYSTEM_PROMPTS[detectedSubject];
}

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

    // Get AI response from Groq with subject-specific prompt
    const systemPrompt = getSystemPrompt(message);
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: systemPrompt
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