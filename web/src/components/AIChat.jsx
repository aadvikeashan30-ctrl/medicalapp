import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiCpu, FiMic, FiMicOff, FiZap } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import api from '../utils/api';

const quickPrompts = [
  { label: 'Diagnose symptoms', prompt: 'Help me diagnose: patient has fever, cough, and body ache for 3 days' },
  { label: 'Prescribe treatment', prompt: 'Suggest prescription for viral fever in a 35y male' },
  { label: 'Drug interactions', prompt: 'Check interaction between Aspirin and Warfarin' },
  { label: 'Risk assessment', prompt: 'Assess risk for 55y diabetic patient with irregular follow-ups' },
  { label: 'Optimize schedule', prompt: 'Optimize my schedule for today' },
  { label: 'Summarize notes', prompt: 'Summarize: Patient came with headache and mild fever since 2 days, BP 130/85, given paracetamol' }
];

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello Doctor! I'm **DocClinic AI** — your intelligent clinical assistant.\n\nI can help with:\n• Diagnosis suggestions\n• Prescription recommendations\n• Drug interaction checks\n• Patient risk scoring\n• Schedule optimization\n• Clinical note summarization\n\nTry asking me something or use a quick prompt below!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEnd = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recognition setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';
      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setInput((prev) => prev + ' ' + text);
        setListening(false);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = newMessages
        .filter((m) => m.role !== 'system')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const { data } = await api.post('/ai/chat', { messages: chatHistory });
      setMessages([...newMessages, { role: 'assistant', content: data.response, provider: data.provider }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again.', error: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown-like rendering
  const renderContent = (text) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^• /gm, '<span class="inline-block w-1.5 h-1.5 bg-current rounded-full mr-2 mt-2 flex-shrink-0"></span>')
      .replace(/\n/g, '<br/>');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl shadow-2xl shadow-violet-500/30 flex items-center justify-center hover:scale-110 transition-all duration-300 group"
        aria-label="Open AI Assistant"
      >
        <FaRobot className="text-white text-xl group-hover:animate-bounce" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <FaRobot className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">DocClinic AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-violet-200 text-xs">Ready to assist</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close AI Chat"
        >
          <FiX className="text-white text-lg" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-md'
                  : msg.error
                  ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-md'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
              }`}
            >
              <div dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
              {msg.provider && !msg.error && (
                <div className="mt-2 pt-2 border-t border-gray-100/50 flex items-center gap-1 text-xs text-gray-400">
                  <FiCpu className="text-[10px]" /> {msg.provider === 'demo' ? 'AI Demo' : msg.provider}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEnd} />
      </div>

      {/* Quick prompts (only when few messages) */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => sendMessage(qp.prompt)}
              disabled={loading}
              className="text-xs bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full hover:bg-violet-100 transition-colors font-medium flex items-center gap-1"
            >
              <FiZap className="text-[10px]" /> {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 rounded-xl p-2 border border-gray-200 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Enter to send)"
            className="flex-1 bg-transparent text-sm resize-none outline-none max-h-24 min-h-[36px] py-1.5 px-2 text-gray-800 placeholder:text-gray-400"
            rows={1}
            disabled={loading}
          />
          <div className="flex items-center gap-1">
            {recognitionRef.current && (
              <button
                onClick={toggleVoice}
                className={`p-2 rounded-lg transition-colors ${
                  listening
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'hover:bg-gray-200 text-gray-400'
                }`}
                aria-label={listening ? 'Stop listening' : 'Start voice input'}
              >
                {listening ? <FiMicOff className="text-sm" /> : <FiMic className="text-sm" />}
              </button>
            )}
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-lg disabled:opacity-40 hover:shadow-lg transition-all"
              aria-label="Send message"
            >
              <FiSend className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
