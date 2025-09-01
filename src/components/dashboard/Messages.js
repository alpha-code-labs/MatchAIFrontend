import React, { useState, useEffect } from 'react';
import { database } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';
import ChatInterface from './ChatInterface';
import './Messages.css';
import ErrorModal from '../ErrorModal';

const Messages = ({ userProfile }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedOtherUser, setSelectedOtherUser] = useState(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [showServerError, setShowServerError] = useState(false);
  
  // Delete functionality state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // NEW: Block functionality state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [conversationToBlock, setConversationToBlock] = useState(null);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Just close the error modal, user stays on the current page
  };

  // Load conversations on component mount
  useEffect(() => {
    if (!userProfile?.id) return;

    const loadConversations = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/conversations/${userProfile.id}`);
        const result = await response.json();
        
        if (result.status === 'success') {
          setConversations(result.data.conversations);
          setTotalUnread(result.data.totalUnread);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        setShowServerError(true);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [userProfile?.id]);

  // Set up real-time listener for conversations
  useEffect(() => {
    if (!userProfile?.id) return;

    const conversationsRef = ref(database, 'conversations');
    
    const handleConversationsUpdate = (snapshot) => {
      if (snapshot.exists()) {
        const conversationsData = snapshot.val();
        const userConversations = [];
        let unreadCount = 0;
        
        for (const [chatId, conversation] of Object.entries(conversationsData)) {
          // Skip conversations deleted by current user
          const deletedBy = conversation.deletedBy || [];
          if (deletedBy.includes(userProfile.id)) {
            continue;
          }

          if (conversation.participants && conversation.participants[userProfile.id]) {
            const otherUserId = Object.keys(conversation.participants).find(id => id !== userProfile.id);
            const otherUser = conversation.participants[otherUserId];
            const userUnreadCount = conversation.participants[userProfile.id]?.unreadCount || 0;
            
            userConversations.push({
              chatId,
              otherUser,
              lastMessage: conversation.lastMessage,
              lastMessageAt: conversation.lastMessageAt,
              unreadCount: userUnreadCount,
              createdAt: conversation.createdAt
            });
            
            unreadCount += userUnreadCount;
          }
        }
        
        // Sort by last message time
        userConversations.sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(a.createdAt);
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(b.createdAt);
          return timeB - timeA;
        });
        
        setConversations(userConversations);
        setTotalUnread(unreadCount);
      }
    };

    onValue(conversationsRef, handleConversationsUpdate);

    return () => {
      off(conversationsRef, 'value', handleConversationsUpdate);
    };
  }, [userProfile?.id]);

  const handleConversationClick = (conversation) => {
    setSelectedChatId(conversation.chatId);
    setSelectedOtherUser(conversation.otherUser);
  };

  const handleChatClose = () => {
    setSelectedChatId(null);
    setSelectedOtherUser(null);
  };

  // Delete conversation handlers
  const handleDeleteClick = (e, conversation) => {
    e.stopPropagation();
    setConversationToDelete(conversation);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/delete-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: conversationToDelete.chatId,
          userId: userProfile.id
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setConversations(prev => prev.filter(conv => conv.chatId !== conversationToDelete.chatId));
        setShowDeleteModal(false);
        setConversationToDelete(null);
      } else {
        throw new Error(result.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setShowServerError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setConversationToDelete(null);
  };

  // NEW: Block user handlers
  const handleBlockClick = (e, conversation) => {
    e.stopPropagation();
    setConversationToBlock(conversation);
    setShowBlockModal(true);
  };

  const handleBlockConfirm = async () => {
    if (!conversationToBlock) return;

    setIsBlocking(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/block-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: conversationToBlock.chatId,
          userId: userProfile.id
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        // Remove conversation from local state immediately
        setConversations(prev => prev.filter(conv => conv.chatId !== conversationToBlock.chatId));
        setShowBlockModal(false);
        setConversationToBlock(null);
        
        // Show success message
      } else {
        throw new Error(result.message || 'Failed to block user');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      setShowServerError(true);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleBlockCancel = () => {
    setShowBlockModal(false);
    setConversationToBlock(null);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return 'No messages yet';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="messages-container">
        <div className="messages-header">
          <h2 className="messages-title">Messages</h2>
        </div>
        <div className="messages-loading">
          <div className="loading-spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h2 className="messages-title">Messages</h2>
        {totalUnread > 0 && (
          <div className="total-unread-badge">
            {totalUnread}
          </div>
        )}
      </div>

      {conversations.length === 0 ? (
        <div className="no-conversations">
          <div className="no-conversations-icon">💬</div>
          <h3>No conversations yet</h3>
          <p>Start chatting with your matches to see conversations here!</p>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map((conversation) => (
            <div
              key={conversation.chatId}
              className={`conversation-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
              onClick={() => handleConversationClick(conversation)}
            >
              <div className="conversation-avatar">
                {conversation.otherUser.profilePicture ? (
                  <img
                    src={conversation.otherUser.profilePicture}
                    alt={conversation.otherUser.firstName}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-initials">
                    {conversation.otherUser.firstName?.[0]}{conversation.otherUser.lastName?.[0]}
                  </div>
                )}
              </div>

              <div className="conversation-content">
                <div className="conversation-header">
                  <h4 className="conversation-name">
                    {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                  </h4>
                  <span className="conversation-time">
                    {formatTimestamp(conversation.lastMessageAt)}
                  </span>
                </div>
                
                <div className="conversation-preview">
                  <p className="last-message">
                    {truncateMessage(conversation.lastMessage)}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <div className="unread-badge">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons container */}
              <div className="conversation-actions">
                {/* Delete button */}
                <button 
                  className="delete-conversation-button"
                  onClick={(e) => handleDeleteClick(e, conversation)}
                  title="Delete conversation"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>

                {/* NEW: Block button */}
                <button 
                  className="block-conversation-button"
                  onClick={(e) => handleBlockClick(e, conversation)}
                  title="Block user"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-header">
              <h3>Delete Conversation</h3>
            </div>
            
            <div className="delete-modal-body">
              <p>
                Are you sure you want to delete this conversation with{' '}
                <strong>
                  {conversationToDelete?.otherUser?.firstName} {conversationToDelete?.otherUser?.lastName}
                </strong>?
              </p>
              <p className="delete-modal-note">
                This will remove the conversation from your messages. If they send you a new message, 
                the conversation will reappear with the full message history.
              </p>
            </div>
            
            <div className="delete-modal-actions">
              <button 
                className="cancel-button" 
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="delete-button" 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Block Confirmation Modal */}
      {showBlockModal && (
        <div className="block-modal-overlay">
          <div className="block-modal">
            <div className="block-modal-header">
              <h3>Block User</h3>
            </div>
            
            <div className="block-modal-body">
              <p>
                Are you sure you want to block{' '}
                <strong>
                  {conversationToBlock?.otherUser?.firstName} {conversationToBlock?.otherUser?.lastName}
                </strong>?
              </p>
              <p className="block-modal-warning">
                This will permanently:
              </p>
              <ul className="block-modal-list">
                <li>Remove them from your love matches</li>
                <li>Delete all conversation history</li>
                <li>Remove the conversation from both of your message lists</li>
              </ul>
              <p className="block-modal-note">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="block-modal-actions">
              <button 
                className="cancel-button" 
                onClick={handleBlockCancel}
                disabled={isBlocking}
              >
                Cancel
              </button>
              <button 
                className="block-button" 
                onClick={handleBlockConfirm}
                disabled={isBlocking}
              >
                {isBlocking ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface Modal */}
      {selectedChatId && selectedOtherUser && (
        <ChatInterface
          chatId={selectedChatId}
          currentUser={userProfile}
          otherUser={selectedOtherUser}
          onClose={handleChatClose}
        />
      )}

      <ErrorModal 
        isOpen={showServerError} 
        onOkClick={handleErrorOkClick}
      />
    </div>
  );
};

export default Messages;