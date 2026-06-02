import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiTrash2, FiMessageCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function AIHealthAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [context, setContext] = useState('general');
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot/message', {
        content: userMsg.content,
        sessionId,
        context
      });

      const aiMsg = {
        role: 'assistant',
        content: data.assistantMessage?.content || 'Sorry, I could not process that.',
        disclaimer: data.assistantMessage?.disclaimer,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I am unable to process your request right now. Please try again later.',
        timestamp: new Date()
      }]);
    }
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    toast.success('Chat cleared');
  };

  const CONTEXTS = [
    { value: 'general', label: 'General', icon: '💬' },
    { value: 'symptom-check', label: 'Symptoms', icon: '🤒' },
    { value: 'medication-query', label: 'Medication', icon: '💊' },
    { value: 'lab-interpretation', label: 'Lab Reports', icon: '🧪' },
    { value: 'diet-advice', label: 'Diet & Wellness', icon: '🥗' },
    { value: 'follow-up', label: 'Follow-up Care', icon: '📋' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiMessageCircle className="text-indigo-600" /> AI Health Assistant
          </h1>
          <p className="text-gray-500 text-sm">AI-powered health information for patients & doctors</p>
        </div>
        <button onClick={clearChat} className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm">
          <FiTrash2 size={14} /> Clear Chat
        </button>
      </div>

      {/* Context Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CONTEXTS.map(c => (
          <button key={c.value} onClick={() => setContext(c.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${context === c.value ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 ring-1 ring-indigo-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'}`}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">How can I help you today?</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">I can help with symptom analysis, medication information, lab report interpretation, diet advice, and general health questions.</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
              {['What are common causes of headaches?', 'Explain my blood sugar levels', 'Side effects of Metformin', 'Diet for high cholesterol'].map(q => (
                <button key={q} onClick={() => setInput(q)} className="text-left text-xs px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.disclaimer && (
                <p className="text-xs mt-2 opacity-70 flex items-start gap-1">
                  <FiAlertCircle className="mt-0.5 flex-shrink-0" size={12} />
                  {msg.disclaimer}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your health question..."
          disabled={loading}
          className="flex-1 px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button type="submit" disabled={loading || !input.trim()} className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition">
          <FiSend />
        </button>
      </form>
    </div>
  );
}
