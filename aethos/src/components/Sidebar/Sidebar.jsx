import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Search, X, User, Pin, Menu, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ 
  isOpen,
  onClose,
  chatHistory = [],
  pinnedMessages = [],
  setPinnedMessages,
  messages = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle escape key to close sidebar on mobile
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isMobile && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isMobile, isOpen, onClose]);

  // Memoized filter function
  const getFilteredChats = useCallback(() => {
    if (!Array.isArray(chatHistory)) return [];
    
    return searchTerm
      ? chatHistory.filter(chat => 
          chat?.text?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : chatHistory;
  }, [chatHistory, searchTerm]);

  const filteredChats = getFilteredChats();

  const handleUnpin = (messageId, event) => {
    event.stopPropagation();
    setPinnedMessages(prev => prev.filter(id => id !== messageId));
  };

  const sidebarClassName = `sidebar ${!isOpen ? 'closed' : ''} ${isMobile ? 'mobile' : ''}`;

  return (
    <>
      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      <aside className={sidebarClassName}>
        <div className="sidebar-header">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isMobile && (
            <button className="close-btn" onClick={onClose} aria-label="Close sidebar">
              <X size={24} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3>Recent Chats</h3>
            <div className="chat-list">
              {filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <div key={chat?.id || Math.random()} className="chat-item">
                    <MessageCircle size={18} />
                    <span className="chat-text">
                      {chat?.text?.substring(0, 40)}{chat?.text?.length > 40 ? '...' : ''}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state">No conversations yet</div>
              )}
            </div>
          </div>

          <div className="nav-section">
            <h3>Pinned Messages</h3>
            <div className="pinned-chats">
              {pinnedMessages.length > 0 ? (
                pinnedMessages.map((messageId) => {
                  const message = messages.find(msg => msg.id === messageId);
                  if (!message) return null;
                  
                  const preview = message.text.split(' ').slice(0, 5).join(' ');
                  const hasMore = message.text.split(' ').length > 5;
                  
                  return (
                    <div key={messageId} className="pinned-chat-item">
                      <span className="pinned-text">{preview}{hasMore ? '...' : ''}</span>
                      <button 
                        onClick={(e) => handleUnpin(messageId, e)}
                        className="unpin-btn"
                        aria-label="Unpin message"
                      >
                        <Pin size={16} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">No pinned messages</div>
              )}
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" onClick={onClose} className="profile-link">
            <div className="profile-section">
              <User size={20} />
              <span>Profile</span>
            </div>
          </Link>
          <Link to="/settings" onClick={onClose} className="settings-link">
            <div className="settings-section">
              <Settings size={20} />
              <span>Settings</span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;