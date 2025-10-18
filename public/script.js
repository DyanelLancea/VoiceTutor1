/**
 * VoiceTutor - Frontend Application with Bootstrap
 */

class VoiceTutor {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.sessionId = null;
        
        // DOM Elements
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            status: document.getElementById('status'),
            conversationContainer: document.getElementById('conversationContainer'),
            sessionId: document.getElementById('sessionId'),
            clearChat: document.getElementById('clearChat')
        };
        
        this.init();
    }

    init() {
        this.generateSessionId();
        this.initSpeechRecognition();
        this.setupEventListeners();
        this.loadConversationHistory();
        this.updateUI();
    }

    generateSessionId() {
        this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.elements.sessionId.textContent = this.sessionId;
    }

    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            this.showError('Speech recognition not supported. Please use Chrome browser.');
            this.elements.startBtn.disabled = true;
            return;
        }

        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.setupRecognitionEvents();
    }

    setupRecognitionEvents() {
        this.recognition.onstart = () => this.onRecognitionStart();
        this.recognition.onresult = (event) => this.onRecognitionResult(event);
        this.recognition.onerror = (event) => this.onRecognitionError(event);
        this.recognition.onend = () => this.onRecognitionEnd();
    }

    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startListening());
        this.elements.stopBtn.addEventListener('click', () => this.stopListening());
        this.elements.clearChat.addEventListener('click', () => this.clearConversation());
        
        // Keyboard shortcut: Space bar to toggle listening
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.toggleListening();
            }
        });
    }

    onRecognitionStart() {
        this.isListening = true;
        this.updateUI('listening');
        this.setStatus('🎤 Listening... Speak now!', 'listening');
    }

    onRecognitionResult(event) {
        const transcript = event.results[0][0].transcript;
        this.processUserInput(transcript);
    }

    onRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        this.setStatus(`Error: ${event.error}. Try again.`, 'error');
        this.resetInterface();
    }

    onRecognitionEnd() {
        this.resetInterface();
    }

    async processUserInput(transcript) {
        this.addMessage('user', transcript);
        this.setStatus('🤔 Processing your question...', 'info');

        try {
            const response = await this.sendToAI(transcript);
            this.addMessage('ai', response.response);
            await this.synthesizeSpeech(response.response);
            this.setStatus('✅ Ready for your next question!', 'success');
        } catch (error) {
            console.error('Error:', error);
            this.setStatus('❌ Error processing request. Please try again.', 'error');
        }
    }

    async sendToAI(userMessage) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userMessage,
                sessionId: this.sessionId 
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async synthesizeSpeech(text) {
        try {
            const response = await fetch('/api/synthesize-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('Speech synthesis failed');

            const data = await response.json();
            await this.playAudio(data.audioContent, data.mimeType);
            
        } catch (error) {
            console.error('Speech synthesis error:', error);
            this.fallbackTTS(text);
        }
    }

    async playAudio(audioBase64, mimeType) {
        return new Promise((resolve) => {
            const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
            audio.onended = resolve;
            audio.onerror = resolve;
            audio.play();
        });
    }

    fallbackTTS(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
        }
    }

    addMessage(sender, text) {
        // Remove welcome message if it exists
        const welcomeMsg = this.elements.conversationContainer.querySelector('.alert-light');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `
            <div class="message-sender">${sender === 'user' ? 'You' : 'Tutor'}</div>
            <div class="message-text">${this.escapeHtml(text)}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        
        this.elements.conversationContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    setStatus(message, type = 'info') {
        this.elements.status.textContent = message;
        this.elements.status.className = `alert alert-${this.getStatusClass(type)}`;
    }

    getStatusClass(type) {
        const statusMap = {
            'info': 'info',
            'success': 'success',
            'error': 'danger',
            'listening': 'info status-listening'
        };
        return statusMap[type] || 'info';
    }

    updateUI(state = 'ready') {
        const states = {
            listening: { 
                startDisabled: true, 
                stopDisabled: false,
                startText: '<span class="loading-spinner me-2"></span> Listening...',
                startClass: 'listening'
            },
            ready: { 
                startDisabled: false, 
                stopDisabled: true,
                startText: '<i class="bi bi-mic-fill me-2"></i>Start Learning',
                startClass: ''
            }
        };
        
        const config = states[state];
        
        this.elements.startBtn.disabled = config.startDisabled;
        this.elements.stopBtn.disabled = config.stopDisabled;
        this.elements.startBtn.innerHTML = config.startText;
        this.elements.startBtn.className = `btn btn-success btn-lg px-4 py-3 ${config.startClass}`;
    }

    scrollToBottom() {
        this.elements.conversationContainer.scrollTop = this.elements.conversationContainer.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadConversationHistory() {
        try {
            const response = await fetch(`/api/conversations/${this.sessionId}`);
            const data = await response.json();
            
            if (data.conversations && data.conversations.length > 0) {
                data.conversations.forEach(conv => {
                    this.addMessage('user', conv.user_message);
                    this.addMessage('ai', conv.ai_response);
                });
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }

    clearConversation() {
        this.elements.conversationContainer.innerHTML = `
            <div class="alert alert-light border text-center">
                <i class="bi bi-lightbulb text-warning me-2"></i>
                Start by clicking "Start Learning" and ask your study question!
            </div>
        `;
        this.setStatus('Chat cleared. Ready to continue!', 'info');
    }

    startListening() {
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.setStatus('Error starting voice recognition', 'error');
        }
    }

    stopListening() {
        this.recognition.stop();
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    resetInterface() {
        this.isListening = false;
        this.updateUI('ready');
        this.setStatus('🎯 Ready to help you learn!', 'info');
    }

    showError(message) {
        this.setStatus(message, 'error');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.voiceTutor = new VoiceTutor();
});