import React, { useState } from 'react';
import { MessageCircle, Search, X, User, Pin } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ 
  isOpen = true,
  onClose = () => {},
  chatHistory = [],
  toggleFusionAI = () => {},
  isFusionAIEnabled = false,
  pinnedMessages = [],
  setPinnedMessages = () => {},
  messages = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = window.innerWidth <= 772;
  
  // Determine the correct className based on mobile vs desktop
  const sidebarClassName = isMobile
    ? `sidebar ${isOpen ? 'open' : ''}`
    : `sidebar ${!isOpen ? 'closed' : ''}`;

  // Add null check and ensure chatHistory is an array
  const safeHistory = Array.isArray(chatHistory) ? chatHistory : [];

  const filteredChats = searchTerm
    ? safeHistory.filter(chat => 
        chat?.text?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : safeHistory;

  const pinMessage = (messageId) => {
    setPinnedMessages((prev) => {
      if (prev.includes(messageId)) {
        return prev.filter(id => id !== messageId);
      }
      return [...prev, messageId];
    });
  };

  const unpinMessage = (messageId) => {
    setPinnedMessages((prev) => prev.filter(id => id !== messageId));
  };

  return (
    <div className={sidebarClassName}>
      <div className="sidebar-header">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="chat-list">
        {filteredChats.map((chat) => (
          <div key={chat?.id || Math.random()} className="chat-item">
            <MessageCircle size={20} />
            <span>{(chat?.text || '').substring(0, 50)}{chat?.text?.length > 50 ? '...' : ''}</span>
          </div>
        ))}
      </div>
      <div className="pinned-chats">
  <h3>Pinned Chats</h3>
  {pinnedMessages.length === 0 ? (
    <p>No pinned messages.</p>
  ) : (
    pinnedMessages.map((messageId) => {
      const message = messages.find(msg => msg.id === messageId);
      // Split the message text into words and take first 5
      const firstFiveWords = message.text.split(' ').slice(0, 5).join(' ');
      const hasMoreWords = message.text.split(' ').length > 5;
      
      return (
        <div key={messageId} className="pinned-chat-item">
          <span>{firstFiveWords}{hasMoreWords ? '...' : ''}</span>
          <button onClick={() => unpinMessage(messageId)} className="unpin-btn">
            <Pin size={16} />
          </button>
        </div>
      );
    })
  )}
</div>

      <div className="toggle-fusion-ai">
        <label>
          <input 
            type="checkbox" 
            checked={isFusionAIEnabled} 
            onChange={(e) => toggleFusionAI(e.target.checked)}
          />
          <span className="switch"></span>
          Toggle Fusion AI
        </label>
        <span className="tooltip" data-tooltip="Switch between Fusion AI and Gemini model">
          ?
        </span>
      </div>

      <Link to="/profile" onClick={onClose} className="profile-link">
        <div className="profile-section">
          <User size={24} />
          <span>Profile Settings</span>
        </div>
      </Link>
    </div>
  );
};

export default Sidebar; 