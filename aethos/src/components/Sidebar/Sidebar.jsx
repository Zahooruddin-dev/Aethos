import React, { useState } from 'react';
import { MessageCircle, Search, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, chatHistory }) => {
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

      <Link to="/profile" className="profile-link">
        <div className="profile-section">
          <User size={24} />
          <span>Profile Settings</span>
        </div>
      </Link>
    </div>
  );
};

// Update default props
Sidebar.defaultProps = {
  isOpen: true, // Open by default
  onClose: () => {},
  chatHistory: []
};

export default Sidebar; 