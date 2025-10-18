# VoiceTutor Setup Guide
#
## 🚀 Quick Start

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Environment Configuration**
The `.env` file is not included in the repository for security reasons. You need to create your own:

**Option A: Copy the template**
```bash
cp env.template .env
```

**Option B: Create manually**
Create a `.env` file in the project root with these variables:

```env
# Required: Groq AI API Key
GROQ_API_KEY=your_groq_api_key_here

# Optional: ElevenLabs API Key (for high-quality TTS)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Optional: Supabase (for conversation history)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Server Configuration
PORT=3000
```

### 3. **Get API Keys**

#### **Groq API Key (Required)**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up/Login
3. Go to API Keys section
4. Create a new API key
5. Copy and paste into `.env` file

#### **ElevenLabs API Key (Optional)**
1. Visit [elevenlabs.io](https://elevenlabs.io)
2. Sign up for free account
3. Go to Profile → API Keys
4. Copy your API key
5. Paste into `.env` file

#### **Supabase Setup (Optional)**
1. Visit [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy URL and anon key
5. Create a table called `conversations` with columns:
   - `id` (serial, primary key)
   - `session_id` (text)
   - `user_message` (text)
   - `ai_response` (text)
   - `created_at` (timestamp)

### 4. **Start the Application**
```bash
npm start
```

### 5. **Access the Application**
Open your browser and go to: `http://localhost:3000`

## 🔧 **Troubleshooting**

### **"AI service unavailable" Error**
- Check if `GROQ_API_KEY` is set in your `.env` file
- Verify the API key is valid and active

### **"Using browser TTS fallback" Message**
- This is normal if you don't have ElevenLabs API key
- The app will still work with browser's built-in TTS

### **"Conversation history disabled" Warning**
- This is normal if you don't have Supabase configured
- The app will still work without conversation history

## 📁 **File Structure**
```
VoiceTutor1/
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env                   # Your environment variables (create this)
├── env.template           # Template for .env file
├── .gitignore            # Git ignore rules
└── public/
    ├── index.html        # Frontend interface
    ├── script.js         # Frontend logic
    ├── style.css         # Custom styling
    └── docs/             # Documentation
```

## 🔒 **Security Notes**

- **Never commit `.env` files** to version control
- **Keep API keys secret** and don't share them
- **Use environment variables** for all sensitive data
- **Regularly rotate API keys** for security

## 🆘 **Need Help?**

If you're still having issues:
1. Check the console for error messages
2. Verify all API keys are correct
3. Make sure all dependencies are installed
4. Check that the `.env` file is in the project root
