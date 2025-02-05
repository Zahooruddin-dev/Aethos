import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LucideRobot, 
  LucideSend, 
  LucideClipboard, 
  LucideRefreshCw 
} from 'lucide-react';

const AIChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulated AI responses (replace with actual API calls)
      const aiResponses = [
        { 
          id: Date.now() + 1, 
          text: `Generated response for: ${input}`, 
          sender: 'gemini',
          timestamp: new Date().toLocaleTimeString()
        },
        { 
          id: Date.now() + 2, 
          text: `Humanized response for: ${input}`, 
          sender: 'humanized',
          timestamp: new Date().toLocaleTimeString()
        }
      ];

      setTimeout(() => {
        setMessages(prev => [...prev, ...aiResponses]);
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Message send error:', error);
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div 
                className={`
                  max-w-[80%] p-3 rounded-lg 
                  ${msg.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : msg.sender === 'gemini'
                    ? 'bg-green-600 text-white'
                    : 'bg-purple-600 text-white'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs opacity-70 mr-2">
                    {msg.sender}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(msg.text)}
                    className="hover:bg-white/20 rounded-full p-1"
                  >
                    <LucideClipboard size={14} />
                  </button>
                </div>
                {msg.text}
                <div className="text-xs opacity-50 text-right">
                  {msg.timestamp}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex items-center bg-gray-700 p-3 rounded-lg">
              <LucideRobot className="mr-2 animate-pulse" />
              <span>Generating response...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form 
        onSubmit={handleSendMessage} 
        className="p-4 bg-gray-800 flex items-center"
      >
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow bg-gray-700 text-white p-3 rounded-lg mr-2"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
        >
          {isLoading ? <LucideRefreshCw className="animate-spin" /> : <LucideSend />}
        </button>
      </form>
    </div>
  );
};

export default AIChatInterface;