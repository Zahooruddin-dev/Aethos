import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Clipboard, RefreshCw } from 'lucide-react';
import axios from 'axios';
import '../index.css';

const ChatApp = () => {
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem('chatHistory')) || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGeminiResponse, setShowGeminiResponse] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const geminiResponse = await axios.post(`${import.meta.env.VITE_GEMINI_API_URL}/chat`, { query: input }, { headers: { 'Authorization': `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}` } });
      const geminiText = geminiResponse.data.response;
      
      const humanizedResponse = await axios.post(`${import.meta.env.VITE_HUMANIZA_API_URL}/humanize`, { text: geminiText }, { headers: { 'Authorization': `Bearer ${import.meta.env.VITE_HUMANIZA_API_KEY}` } });
      
      const aiResponses = [
        { id: Date.now() + 1, text: geminiText, sender: 'gemini' },
        { id: Date.now() + 2, text: humanizedResponse.data.humanizedText, sender: 'humanized' }
      ];
      
      setMessages(prev => [...prev, ...aiResponses]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-list">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div key={msg.id} className={`message ${msg.sender}`}>
              <div className="message-header">
                <span>{msg.sender}</span>
                {msg.sender !== 'user' && (
                  <button onClick={() => navigator.clipboard.writeText(msg.text)}>
                    <Clipboard size={14} />
                  </button>
                )}
              </div>
              <p>{msg.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div className="loading">
            <Bot className="animate-pulse" />
            <span>Generating response...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="input-container">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." />
        <button type="submit" disabled={isLoading}>{isLoading ? <RefreshCw className="spin" /> : <Send />}</button>
      </form>
      <button className="toggle-gemini" onClick={() => setShowGeminiResponse(!showGeminiResponse)}>
        {showGeminiResponse ? 'Hide Gemini Response' : 'Show Gemini Response'}
      </button>
    </div>
  );
};

export default ChatApp;