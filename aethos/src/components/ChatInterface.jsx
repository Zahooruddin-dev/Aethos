import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Clipboard, RefreshCw, Trash2, LogOut, MessageCircle, Menu, PlusCircle, FileDown, Timer } from 'lucide-react';
import axios from 'axios';
import Markdown from 'react-markdown';
import { auth } from '../firebase/firebase';
import Sidebar from './Sidebar/Sidebar';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // For better text handling
import ReactDOM from 'react-dom/client';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';

const ChatApp = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [responseTimer, setResponseTimer] = useState(0);
  const timerRef = useRef(null);
  const [isFusionAIEnabled, setIsFusionAIEnabled] = useState(true);
  const [chatSessions, setChatSessions] = useState(() => {
    const saved = localStorage.getItem('chatSessions');
    return saved ? JSON.parse(saved) : [];
  });

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

  const startResponseTimer = () => {
    setResponseTimer(0);
    timerRef.current = setInterval(() => {
      setResponseTimer(prev => prev + 1);
    }, 1000);
  };

  const stopResponseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFusionAI = () => {
    setIsFusionAIEnabled(prev => !prev);
  };

  const callGeminiModel = async (input) => {
    try {
      const response = await fetch(import.meta.env.VITE_OPENROUTER_API_URL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'Mizuka Chat'
        },
        body: JSON.stringify({
          model: 'google/gemini-pro',
          messages: [
            {
              role: 'user',
              content: input
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to get response from Gemini');
    }
  };

  const callFusionModel = async (input) => {
    try {
      const response = await fetch(import.meta.env.VITE_OPENROUTER_API_URL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'Mizuka Chat'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-opus',  // Using Claude for enhancement
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that improves and fact-checks responses. Review the following response and enhance it with additional information, corrections, or clarifications where necessary.'
            },
            {
              role: 'user',
              content: `Please review and enhance this response: ${input}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Fusion API Error:', error);
      throw new Error('Failed to get response from Fusion');
    }
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
    startResponseTimer();

    try {
      let finalAiText = '';

      if (isFusionAIEnabled) {
        try {
          // First get Gemini response
          const geminiResponse = await callGeminiModel(input);
          
          // Then enhance with Fusion
          try {
            const fusionResponse = await callFusionModel(geminiResponse);
            finalAiText = fusionResponse;
          } catch (fusionError) {
            console.error('Fusion enhancement failed:', fusionError);
            // If Fusion fails, still use Gemini's response
            finalAiText = geminiResponse;
          }
        } catch (error) {
          throw error;
        }
      } else {
        // Only Gemini
        finalAiText = await callGeminiModel(input);
      }

      setMessages(prev => prev.map(msg => 
        msg.id === pendingMessage.id 
          ? { ...msg, text: finalAiText, isLoading: false }
          : msg
      ));
    } catch (error) {
      console.error('Chat error:', error);
      setError(error.message || 'Failed to get response. Please try again.');
      setMessages(prev => prev.filter(msg => msg.id !== pendingMessage.id));
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        text: error.message || 'Failed to get response. Please try again.',
        sender: 'system',
      }]);
    } finally {
      setIsLoading(false);
      stopResponseTimer();
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

  const startNewChat = () => {
    // Save current chat to history if there are messages
    if (messages.length > 0) {
        const currentTime = new Date();
        const chatSession = {
            id: Date.now(),
            messages: messages,
            timestamp: currentTime.toISOString(),
            title: messages[0]?.text.substring(0, 30) + '...' || 'New Chat'
        };

        // Get existing chats from localStorage
        const existingChats = JSON.parse(localStorage.getItem('chatSessions') || '[]');
        
        // Add new chat session
        const updatedChats = [chatSession, ...existingChats];
        
        // Keep only last 10 chat sessions
        const limitedChats = updatedChats.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('chatSessions', JSON.stringify(limitedChats));
    }
    
    // Clear current messages
    setMessages([]);
    setInput('');
  };

  const downloadPDF = async (text, messageId) => {
    try {
        // Initialize PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true
        });

        // Set margins and usable page dimensions
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20; // 20mm margins
        const usableWidth = pageWidth - (2 * margin);
        
        // Add header
        pdf.setFontSize(18);
        pdf.setTextColor(40);
        pdf.text('Chat Conversation', pageWidth / 2, margin, { align: 'center' });
        
        // Add timestamp
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(new Date().toLocaleString(), pageWidth / 2, margin + 7, { align: 'center' });

        // Create a temporary div for markdown rendering
        const tempDiv = document.createElement('div');
        tempDiv.className = 'pdf-markdown-content';
        document.body.appendChild(tempDiv);

        // Render markdown content
        const root = ReactDOM.createRoot(tempDiv);
        root.render(
            <div className="pdf-content">
                <ReactMarkdown>{text}</ReactMarkdown>
            </div>
        );

        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 100));

        // Convert markdown content to canvas
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        // Clean up temporary div
        document.body.removeChild(tempDiv);

        // Calculate dimensions
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const imgWidth = usableWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = margin + 20; // Start after header
        let page = 1;

        // Add first page content
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - position - margin);

        // Add additional pages if needed
        while (heightLeft > 0) {
            pdf.addPage();
            page++;
            position = margin;
            pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, '', 'FAST', 0, -(pageHeight - margin - 20) * (page - 1));
            heightLeft -= (pageHeight - margin * 2);
            
            // Add page number
            pdf.setFontSize(10);
            pdf.text(`Page ${page}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        // Add page number to first page
        pdf.setPage(1);
        pdf.text(`Page 1 of ${page}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

        // Save the PDF
        pdf.save(`chat-conversation-${messageId}.pdf`);

    } catch (error) {
        console.error('PDF generation failed:', error);
    }
  };

  return (
    <div className="chat-layout">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        chatHistory={messages.filter(msg => msg.sender === 'user')}
        toggleFusionAI={toggleFusionAI}
        isFusionAIEnabled={isFusionAIEnabled}
      />
      
      <div className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
        <div className="chat-header">
          <button 
            className="menu-button-header"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            data-tooltip="Toggle Sidebar"
            aria-label="Toggle Sidebar"
          >
            <Menu size={24} />
          </button>
          <h2>
            Mizuka Chat <Bot size={20} />
          </h2>
          
          <div className="header-buttons">
            <button 
              onClick={startNewChat} 
              className="new-chat-btn" 
              data-tooltip="Start New Chat"
              aria-label="Start New Chat"
            >
              <PlusCircle size={18} />
            </button>
            <button 
              onClick={clearHistory} 
              className="clear-btn" 
              data-tooltip="Clear Chat History"
              aria-label="Clear Chat History"
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={handleLogout} 
              className="logout-btn" 
              data-tooltip="Logout"
              aria-label="Logout"
            >
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
                    <div className="message-actions">
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="icon-btn"
                        data-tooltip="Copy to Clipboard"
                        aria-label="Copy to Clipboard"
                      >
                        <Clipboard size={14} />
                      </button>
                      <button
                        onClick={() => downloadPDF(msg.text, msg.id)}
                        className="icon-btn"
                        data-tooltip="Download as PDF"
                        aria-label="Download as PDF"
                      >
                        <FileDown size={14} />
                      </button>
                    </div>
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
                        thinking... {responseTimer > 0 && `(${formatTime(responseTimer)})`}
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
          <button 
            type="submit" 
            disabled={isLoading} 
            className="send-btn"
            data-tooltip="Send Message"
            aria-label="Send Message"
          >
            {isLoading ? <RefreshCw className="animate-spin" /> : <Send />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatApp;