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
  const [isFusionAIEnabled, setIsFusionAIEnabled] = useState(true); // Default to true

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
      const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      chatHistory.push({
        id: Date.now(),
        messages: messages,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
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

        // Process the markdown text
        // Split content into chunks that can fit on a page
        const splitText = pdf.splitTextToSize(text, usableWidth);
        
        // Calculate lines per page (accounting for header and margins)
        const lineHeight = 7; // Height per line in mm
        const linesPerPage = Math.floor((pageHeight - (margin * 2) - 20) / lineHeight); // 20mm for header

        // Add content pages
        let currentLine = 0;
        let pageNum = 1;

        while (currentLine < splitText.length) {
            if (pageNum > 1) {
                pdf.addPage();
            }

            // Content starting position (after header on first page)
            let yPosition = margin + (pageNum === 1 ? 20 : 10);

            // Add content for this page
            for (let i = 0; i < linesPerPage && currentLine < splitText.length; i++) {
                if (splitText[currentLine].trim()) { // Only add non-empty lines
                    pdf.text(splitText[currentLine], margin, yPosition);
                    yPosition += lineHeight;
                }
                currentLine++;
            }

            // Add page number at bottom
            pdf.setFontSize(10);
            pdf.text(
                `Page ${pageNum}`,
                pageWidth / 2,
                pageHeight - margin,
                { align: 'center' }
            );

            pageNum++;
        }

        // Add code blocks with different styling
        pdf.setFont('Courier', 'normal');
        const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
        if (codeBlocks.length > 0) {
            pdf.addPage();
            pdf.setFontSize(14);
            pdf.text('Code Blocks', margin, margin);
            
            let yPos = margin + 10;
            codeBlocks.forEach((block) => {
                const code = block.replace(/```/g, '').trim();
                const codeLines = pdf.splitTextToSize(code, usableWidth);
                
                // Add background for code block
                pdf.setFillColor(245, 245, 245);
                pdf.rect(
                    margin - 2,
                    yPos - 2,
                    usableWidth + 4,
                    (codeLines.length * lineHeight) + 4,
                    'F'
                );
                
                // Add code text
                pdf.setTextColor(40);
                codeLines.forEach((line) => {
                    pdf.text(line, margin, yPos);
                    yPos += lineHeight;
                });
                
                yPos += 10; // Space between code blocks
            });
        }

        // Save the PDF
        pdf.save(`chat-conversation-${messageId}.pdf`);

    } catch (error) {
        console.error('PDF generation failed:', error);
    }
  };

  const toggleFusionAI = () => {
    setIsFusionAIEnabled(prev => !prev);
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