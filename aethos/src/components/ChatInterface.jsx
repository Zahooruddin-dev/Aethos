import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Clipboard, RefreshCw, Trash2, LogOut } from 'lucide-react';
import axios from 'axios';
import Markdown from 'react-markdown';
import { auth } from '../firebase/firebase';

const ChatApp = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
  };

  const handleError = (error) => {
    console.error('API Error:', error);
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      'Failed to fetch response. Please try again.';
    setError(errorMessage);
    setTimeout(() => setError(''), 5000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    const pendingMessage = { 
      id: Date.now() + 1, 
      text: '', 
      sender: 'ai', 
      isLoading: true 
    };

    setMessages(prev => [...prev, userMessage, pendingMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      // First AI Response (Gemini)
      const primaryResponse = await axios.post(
        `${import.meta.env.VITE_OPENROUTER_API_URL}/chat/completions`,
        {
          model: "google/gemini-2.0-pro-exp-02-05:free",
          messages: [{ role: 'user', content: input }],
        },
        {
          headers: {
            Authorization: `Bearer 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`,
            'Content-Type': 'application/json',
          },
        }
      );

      const primaryAiText = primaryResponse.data?.choices?.[0]?.message?.content || 
                           primaryResponse.data?.result?.content || 
                           'Could not understand response format';

      // Second AI Review (Qwen)
      const reviewPrompt = `Please review, fact-check, and enhance the following AI response while maintaining its core message. If needed, make corrections or additions to improve accuracy and completeness:

${primaryAiText}

Please provide your enhanced version of the response.`;

      const reviewResponse = await axios.post(
        `${import.meta.env.VITE_OPENROUTER_API_URL}/chat/completions`,
        {
          model: "qwen/qwen-vl-plus:free",
          messages: [{ role: 'user', content: reviewPrompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const finalAiText = reviewResponse.data?.choices?.[0]?.message?.content || 
                         reviewResponse.data?.result?.content || 
                         primaryAiText; // Fallback to primary response if review fails

      setMessages(prev => prev.map(msg => 
        msg.id === pendingMessage.id 
          ? { ...msg, text: finalAiText, isLoading: false }
          : msg
      ));

    } catch (error) {
      handleError(error);
      setMessages(prev => prev.filter(msg => msg.id !== pendingMessage.id));
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        text: 'Failed to get response. Please check your connection.',
        sender: 'system',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('token');
      clearHistory();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>
          Mizuka Chat <Bot size={20} />
        </h2>
        
        <div className="header-buttons">
          <button onClick={clearHistory} className="clear-btn" title="Clear history">
            <Trash2 size={18} />
          </button>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="messages-list">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`message ${msg.sender}`}
            >
              <div className="message-header">
                <span className="sender-tag">
                  {msg.sender === 'user' ? 'You' : 'Mizuka'}
                </span>
                {msg.sender !== 'user' && !msg.isLoading && (
                  <button
                    onClick={() => navigator.clipboard.writeText(msg.text)}
                    className="icon-btn"
                  >
                    <Clipboard size={14} />
                  </button>
                )}
              </div>
              <div className="message-content">
                {msg.isLoading ? (
                  <div className="loading-container">
                    <Bot className="animate-pulse" size={16} />
                    <motion.span
                      className="thinking-text"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear"
                      }}
                    >
                      thinking...
                    </motion.span>
                  </div>
                ) : (
                  <Markdown>{msg.text}</Markdown>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} className="send-btn">
          {isLoading ? <RefreshCw className="animate-spin" /> : <Send />}
        </button>
      </form>
    </div>
  );
};

export default ChatApp;