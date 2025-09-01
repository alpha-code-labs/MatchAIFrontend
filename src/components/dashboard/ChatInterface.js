import ReactDOM from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import { database } from '../../config/firebase';
import { ref, onValue, off, query, orderByChild, limitToLast } from 'firebase/database';
import './ChatInterface.css';
import ErrorModal from '../ErrorModal';

const ChatInterface = ({ chatId, currentUser, otherUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const handleErrorOkClick = () => {
    setShowServerError(false);
    if (onClose) {
      onClose();
    }
  };

  // Load initial messages
  useEffect(() => {
    if (!chatId) return;

    const loadMessages = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/messages/${chatId}?limit=50`);
        const result = await response.json();
        
        if (result.status === 'success') {
          setMessages(result.data.messages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setShowServerError(true);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [chatId]);

  // Set up real-time message listener
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = query(
      ref(database, `messages/${chatId}`),
      orderByChild('timestamp'),
      limitToLast(100)
    );

    const handleMessagesUpdate = (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList = Object.entries(messagesData).map(([id, message]) => ({
          id,
          ...message
        }));
        
        // Sort by timestamp
        messagesList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(messagesList);
      }
    };

    onValue(messagesRef, handleMessagesUpdate);

    return () => {
      off(messagesRef, 'value', handleMessagesUpdate);
    };
  }, [chatId]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (!chatId || !currentUser?.id) return;

    const markAsRead = async () => {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/chat/mark-read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId,
            userId: currentUser.id
          })
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
        // Not showing error modal here as it's not critical
      }
    };

    markAsRead();
  }, [chatId, currentUser?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [newMessage]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageToSend = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          senderId: currentUser.id,
          message: messageToSend
        })
      });

      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageToSend); // Restore message on error
      setShowServerError(true);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const shouldShowDateDivider = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  return ReactDOM.createPortal(
  <>
    <div className="chat-interface-overlay">
      <div className="chat-interface">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-user-info">
            <div className="chat-avatar">
              {otherUser.profilePicture ? (
                <img
                  src={otherUser.profilePicture}
                  alt={otherUser.firstName}
                  className="chat-avatar-image"
                />
              ) : (
                <div className="chat-avatar-initials">
                  {otherUser.firstName?.[0]}{otherUser.lastName?.[0]}
                </div>
              )}
            </div>
            <div className="chat-user-details">
              <h3 className="chat-user-name">
                {otherUser.firstName} {otherUser.lastName}
              </h3>
              <p className="chat-user-status">Active</p>
            </div>
          </div>
          
          <button className="chat-close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">
              <div className="loading-spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <div className="empty-icon">💬</div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const showDateDivider = shouldShowDateDivider(message, messages[index - 1]);
                const isOwnMessage = message.senderId === currentUser.id;
                
                return (
                  <React.Fragment key={message.id}>
                    {showDateDivider && (
                      <div className="date-divider">
                        <span className="date-text">
                          {formatMessageDate(message.timestamp)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`message ${isOwnMessage ? 'own' : 'other'}`}>
                      <div className="message-bubble">
                        <p className="message-text">{message.message}</p>
                        <div className="message-meta">
                          <span className="message-time">
                            {formatMessageTime(message.timestamp)}
                          </span>
                          {isOwnMessage && (
                            <span className={`message-status ${message.read ? 'read' : 'sent'}`}>
                              {message.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <div className="chat-input-container">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input"
              disabled={sending}
              rows="1"
            />
            <button
              type="submit"
              className="chat-send-button"
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <div className="send-spinner"></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 21L23 12 2 3V10L17 12 2 14V21Z"/>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    <ErrorModal 
      isOpen={showServerError} 
      onOkClick={handleErrorOkClick}
    />
  </>,
  document.getElementById('chat-portal-root')
);
};

export default ChatInterface;