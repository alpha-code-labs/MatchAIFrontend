import React, { useState, useEffect, useCallback } from 'react';
import { database } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';
import ChatInterface from './ChatInterface';
import './Matches.css';
import ErrorModal from '../ErrorModal';

const Matches = ({ userProfile, matches }) => {
  const [activeTab, setActiveTab] = useState('mutual');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({});
  const [actionStates, setActionStates] = useState({});
  const [showServerError, setShowServerError] = useState(false);
  const [localMatches, setLocalMatches] = useState({
    oneWayMatches: [],
    mutualMatches: [],
    loveMatches: []
  });
  const [animatingMatch, setAnimatingMatch] = useState(null);
  
  // NEW: Chat interface state
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeOtherUser, setActiveOtherUser] = useState(null);
  
  // Track current match index for each tab
  const [currentMatchIndex, setCurrentMatchIndex] = useState({
    oneway: 0,
    mutual: 0,
    love: 0
  });

  // NEW: Swipe gesture state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Just close the error modal, user stays on the current page
  };

  // Initialize local matches from props
  useEffect(() => {
    if (matches) {
      setLocalMatches({
        oneWayMatches: matches.oneWayMatches || [],
        mutualMatches: matches.mutualMatches || [],
        loveMatches: matches.loveMatches || []
      });
    }
  }, [matches]);

  // 🚀 NEW: Real-time match update handlers
  const moveToLoveTabRealtime = (matchId, update) => {
    setLocalMatches(prev => {
      const oneWayMatch = prev.oneWayMatches.find(m => m.id === matchId);
      const mutualMatch = prev.mutualMatches.find(m => m.id === matchId);
      const matchToMove = oneWayMatch || mutualMatch;

      if (matchToMove) {
        // Create love match with updated data
        const loveMatch = {
          ...matchToMove,
          chatUnlocked: true,
          category: 'love',
          showButtons: false,
          buttonText: null,
          description: 'You both liked each other! Start chatting.',
          // Update with real-time data
          ...update.matchData
        };

        const newLoveMatchesLength = prev.loveMatches.length;

        const updatedMatches = {
          oneWayMatches: prev.oneWayMatches.filter(m => m.id !== matchId),
          mutualMatches: prev.mutualMatches.filter(m => m.id !== matchId),
          loveMatches: [...prev.loveMatches, loveMatch]
        };

        // Set animation for smooth transition
        setAnimatingMatch(matchId);
        setTimeout(() => {
          setAnimatingMatch(null);
          // Auto-switch to love tab to show the new match
          setActiveTab('love');
          setCurrentMatchIndex(prevIndex => ({
            ...prevIndex,
            love: newLoveMatchesLength
          }));
        }, 500);

        return updatedMatches;
      }
      return prev;
    });
  };

  const updateMatchStatusRealtime = (matchId, update) => {
    setLocalMatches(prev => {
      const updateMatchInArray = (matches) => 
        matches.map(m => {
          if (m.id === matchId) {
            // Update match with real-time data
            const updatedMatch = { ...m, ...update.matchData };
            
            // Update UI state based on new data
            if (update.updateType === 'second_chance') {
              updatedMatch.showButtons = true;
              updatedMatch.buttonText = { primary: 'Like', secondary: 'Still Pass' };
              updatedMatch.description = 'The other person has liked you. Are you sure?';
              updatedMatch.isSecondChance = true;
            } else {
              // Regular status update - keep existing UI logic
              if (updatedMatch.hasUserActed && !updatedMatch.hasOtherUserActed) {
                updatedMatch.showButtons = false;
                updatedMatch.buttonText = { primary: 'Awaiting Reply', secondary: null };
                updatedMatch.description = `You ${updatedMatch.userAction}d this profile. Waiting for their response.`;
              }
            }
            
            return updatedMatch;
          }
          return m;
        });

      return {
        oneWayMatches: updateMatchInArray(prev.oneWayMatches),
        mutualMatches: updateMatchInArray(prev.mutualMatches),
        loveMatches: updateMatchInArray(prev.loveMatches)
      };
    });
  };

  // Get matches array for current tab
  const getMatchesForTab = useCallback((tab) => {
    switch(tab) {
      case 'oneway':
        return localMatches.oneWayMatches;
      case 'mutual':
        return localMatches.mutualMatches;
      case 'love':
        return localMatches.loveMatches;
      default:
        return [];
    }
  }, [localMatches]);

  const removeMatchRealtime = useCallback((matchId) => {
    setLocalMatches(prev => {
      const matchesArray = getMatchesForTab(activeTab);
      const currentIndex = currentMatchIndex[activeTab];
      
      const updatedMatches = {
        oneWayMatches: prev.oneWayMatches.filter(m => m.id !== matchId),
        mutualMatches: prev.mutualMatches.filter(m => m.id !== matchId),
        loveMatches: prev.loveMatches.filter(m => m.id !== matchId)
      };
      
      // Adjust current index if needed
      if (currentIndex >= matchesArray.length - 1 && currentIndex > 0) {
        setCurrentMatchIndex(prevIndex => ({
          ...prevIndex,
          [activeTab]: currentIndex - 1
        }));
      }
      
      return updatedMatches;
    });
  }, [activeTab, currentMatchIndex, getMatchesForTab]);

  // 🚀 NEW: Real-time listener for match updates
  useEffect(() => {
    if (!userProfile?.id) {
      return;
    }

    const matchUpdatesRef = ref(database, `match_updates/${userProfile.id}`);    
    const handleMatchUpdate = (snapshot) => {

      if (snapshot.exists()) {
        const updates = snapshot.val();
        
        // Process each match update
        Object.entries(updates).forEach(([matchId, update]) => {
          
          switch (update.updateType) {
            case 'love_match':
              moveToLoveTabRealtime(matchId, update);
              break;
              
            case 'status_change':
              updateMatchStatusRealtime(matchId, update);
              break;
              
            case 'second_chance':
              updateMatchStatusRealtime(matchId, update);
              break;
              
            case 'match_removed':
              removeMatchRealtime(matchId);
              break;
              
            default:
              break;
          }
        });
      } 
    };

    const handleError = (error) => {
      console.error('❌ Real-time listener error:', error);
    };

    // Set up the listener with error handling
    try {
      onValue(matchUpdatesRef, handleMatchUpdate, handleError);
    } catch (error) {
      console.error('❌ Error setting up real-time listener:', error);
    }

    // Cleanup listener on unmount
    return () => {
      try {
        off(matchUpdatesRef, 'value', handleMatchUpdate);
      } catch (error) {
        console.error('❌ Error cleaning up real-time listener:', error);
      }
    };
  }, [userProfile?.id, removeMatchRealtime]);

  // NEW: Touch handlers for swipe
  const handleTouchStart = (e) => {
    // Only on mobile
    if (window.innerWidth > 768) return;
    
    // Don't interfere with buttons, sections, or photos
    const target = e.target;
    if (target.closest('button') || 
        target.closest('.section-toggle') || 
        target.closest('.match-photo-container') ||
        target.closest('.action-buttons')) {
      return;
    }
    
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Add visual feedback
    const distance = touchStart - currentTouch;
    const elem = e.currentTarget;
    if (elem && Math.abs(distance) > 10) {
      elem.style.transform = `translateX(${-distance * 0.5}px) rotate(${-distance * 0.05}deg)`;
      elem.style.opacity = Math.max(0.5, 1 - Math.abs(distance) / 300);
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !touchEnd) {
      // Reset styles if any
      const elem = e.currentTarget;
      if (elem) {
        elem.style.transform = '';
        elem.style.opacity = '';
      }
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    // Reset styles
    const elem = e.currentTarget;
    if (elem) {
      elem.style.transform = '';
      elem.style.opacity = '';
      elem.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (elem) elem.style.transition = '';
      }, 300);
    }
    
    if (isLeftSwipe) {
      navigateMatch('next');
    } else if (isRightSwipe) {
      navigateMatch('prev');
    }
    
    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Get current match based on active tab and index
  const getCurrentMatch = useCallback(() => {
    const matchesArray = getMatchesForTab(activeTab);
    return matchesArray[currentMatchIndex[activeTab]];
  }, [activeTab, currentMatchIndex, getMatchesForTab]);

  // Navigate between matches
  const navigateMatch = useCallback((direction) => {
    const matchesArray = getMatchesForTab(activeTab);
    if (matchesArray.length === 0) return;

    setCurrentMatchIndex(prev => {
      const currentIndex = prev[activeTab];
      let newIndex;
      
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % matchesArray.length;
      } else {
        newIndex = (currentIndex - 1 + matchesArray.length) % matchesArray.length;
      }
      
      return { ...prev, [activeTab]: newIndex };
    });
  }, [activeTab, getMatchesForTab]);

  // API call helper
  const makeAPICall = async (endpoint, data) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/matching/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API call failed');
      }

      return response.json();
    } catch (error) {
      console.error('API call failed:', error);
      setShowServerError(true);
      throw error;
    }
  };

  // Handle Express Interest (One-way matches)
  const handleExpressInterest = useCallback(async (matchId) => {
    
    setActionStates(prev => ({ ...prev, [matchId]: 'expressing' }));

    try {
      const result = await makeAPICall('express-interest', {
        matchId: matchId,
        userId: userProfile.id
      });

      if (result.status === 'success') {
        updateMatchInPlace(matchId, {
          user1_expressed_interest: true,
          showButtons: false,
          buttonText: { primary: 'Awaiting Reply', secondary: null },
          description: 'Your interest has been sent. Waiting for their response.'
        });
      }
    } catch (error) {
      console.error('Express interest failed:', error);
    } finally {
      setActionStates(prev => ({ ...prev, [matchId]: null }));
    }
  }, [userProfile.id]);

  // Handle Accept Interest (One-way matches)
  const handleAccept = useCallback(async (matchId) => {
    
    setActionStates(prev => ({ ...prev, [matchId]: 'accepting' }));

    try {
      const result = await makeAPICall('accept-interest', {
        matchId: matchId,
        userId: userProfile.id
      });

      if (result.status === 'success' && result.data.isLoveMatch) {
        // Real-time will handle the actual move, but we can show immediate feedback
        moveToLoveTab(matchId);
      }
    } catch (error) {
      console.error('Accept interest failed:', error);
    } finally {
      setActionStates(prev => ({ ...prev, [matchId]: null }));
    }
  }, [userProfile.id]);

  // Handle Like (Mutual matches)
  const handleLike = useCallback(async (matchId, isSecondChance = false) => {
    
    setActionStates(prev => ({ ...prev, [matchId]: 'liking' }));

    try {
      const result = await makeAPICall('like', {
        matchId: matchId,
        userId: userProfile.id,
        isSecondChance: isSecondChance
      });

      if (result.status === 'success') {
        if (result.data.isLoveMatch) {
          // Real-time will handle the actual move, but we can show immediate feedback
          moveToLoveTab(matchId);
        } else if (result.data.secondChanceOffered) {
          updateMatchInPlace(matchId, {
            showButtons: false,
            buttonText: { primary: 'Awaiting Reply', secondary: null },
            description: 'Waiting for their final decision...'
          });
        } else {
          updateMatchInPlace(matchId, {
            hasUserActed: true,
            userAction: 'like',
            showButtons: false,
            buttonText: { primary: 'Awaiting Reply', secondary: null },
            description: 'You liked this profile. Waiting for their response.'
          });
        }
      }
    } catch (error) {
      console.error('Like failed:', error);
    } finally {
      setActionStates(prev => ({ ...prev, [matchId]: null }));
    }
  }, [userProfile.id]);

  const removeMatch = useCallback((matchId) => {
  const matchesArray = getMatchesForTab(activeTab);
  const currentIndex = currentMatchIndex[activeTab];
  
  setLocalMatches(prev => ({
    oneWayMatches: prev.oneWayMatches.filter(m => m.id !== matchId),
    mutualMatches: prev.mutualMatches.filter(m => m.id !== matchId),
    loveMatches: prev.loveMatches.filter(m => m.id !== matchId)
  }));
  
  if (currentIndex >= matchesArray.length - 1 && currentIndex > 0) {
    setCurrentMatchIndex(prev => ({
      ...prev,
      [activeTab]: currentIndex - 1
    }));
  }
}, [activeTab, currentMatchIndex, getMatchesForTab]);

  // Handle Pass (Both one-way and mutual matches)
  const handlePass = useCallback(async (matchId, isSecondChance = false) => {
    
    setActionStates(prev => ({ ...prev, [matchId]: 'passing' }));

    try {
      const result = await makeAPICall('pass', {
        matchId: matchId,
        userId: userProfile.id,
        isSecondChance: isSecondChance
      });

      if (result.status === 'success') {
        if (result.data.isDeleted) {
          // Real-time will handle the actual removal
          removeMatch(matchId);
        } else if (result.data.secondChanceOffered) {
          const match = localMatches.mutualMatches.find(m => m.id === matchId);
          if (match) {
            updateMatchInPlace(matchId, {
              showButtons: true,
              buttonText: { primary: 'Like', secondary: 'Still Pass' },
              description: 'The other person has liked you. Are you sure?',
              isSecondChance: true
            });
          }
        } else {
          updateMatchInPlace(matchId, {
            hasUserActed: true,
            userAction: 'pass',
            showButtons: false,
            buttonText: { primary: 'Awaiting Reply', secondary: null },
            description: 'You passed on this profile. Waiting for their response.'
          });
        }
      }
    } catch (error) {
      console.error('Pass failed:', error);
    } finally {
      setActionStates(prev => ({ ...prev, [matchId]: null }));
    }
  }, [userProfile.id, localMatches.mutualMatches, removeMatch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle keyboard if not in a modal or chat
      if (showPhotoModal || showChatInterface) return;

      switch(e.key) {
        case 'ArrowLeft':
          navigateMatch('prev');
          break;
        case 'ArrowRight':
          navigateMatch('next');
          break;
        case ' ': // Spacebar
          e.preventDefault();
          const currentMatch = getCurrentMatch();
          if (currentMatch && currentMatch.showButtons) {
            if (activeTab === 'oneway' && currentMatch.userPosition === 'user1' && !currentMatch.user1_expressed_interest) {
              handleExpressInterest(currentMatch.id);
            } else if (activeTab === 'oneway' && currentMatch.userPosition === 'user2' && currentMatch.user1_expressed_interest) {
              handleAccept(currentMatch.id);
            } else if (activeTab === 'mutual') {
              handleLike(currentMatch.id, currentMatch.isSecondChance);
            }
          }
          break;
        case 'x':
        case 'X':
          const matchToPass = getCurrentMatch();
          if (matchToPass && matchToPass.showButtons) {
            handlePass(matchToPass.id, matchToPass.isSecondChance);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTab, showPhotoModal, showChatInterface, getCurrentMatch, handleAccept, handleExpressInterest, handleLike, handlePass, navigateMatch]);

  // Toggle expanded sections
  const toggleSection = (matchId, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${matchId}-${section}`]: !prev[`${matchId}-${section}`]
    }));
  };

  // Handle photo modal
  const openPhotoModal = (match, photoIndex = 0) => {
    setSelectedMatch(match);
    setCurrentPhotoIndex(photoIndex);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedMatch(null);
    setCurrentPhotoIndex(0);
  };

  const navigatePhoto = (direction) => {
    const photos = getMatchPhotos(selectedMatch);
    const newIndex = direction === 'next' 
      ? (currentPhotoIndex + 1) % photos.length
      : (currentPhotoIndex - 1 + photos.length) % photos.length;
    setCurrentPhotoIndex(newIndex);
  };

  // Get all photos for a match
  const getMatchPhotos = (match) => {
    if (!match) return [];
    
    const photos = [];
    
    if (match.matchedUser?.profilePictures && Array.isArray(match.matchedUser.profilePictures)) {
      match.matchedUser.profilePictures.forEach(pic => {
        if (pic.url) photos.push(pic.url);
      });
    } else if (match.matchedUser?.profilePicture) {
      photos.push(match.matchedUser.profilePicture);
    }
    
    return photos.slice(0, 5);
  };

  // Move match to love tab with animation (LOCAL ONLY - real-time will handle the actual move)
  const moveToLoveTab = (matchId) => {
    setAnimatingMatch(matchId);
    
    setTimeout(() => {
      setLocalMatches(prev => {
        const oneWayMatch = prev.oneWayMatches.find(m => m.id === matchId);
        const mutualMatch = prev.mutualMatches.find(m => m.id === matchId);
        const matchToMove = oneWayMatch || mutualMatch;

        if (matchToMove) {
          const loveMatch = {
            ...matchToMove,
            chatUnlocked: true,
            category: 'love',
            showButtons: false,
            buttonText: null,
            description: 'You both liked each other! Start chatting.'
          };

          const newLoveMatchesLength = prev.loveMatches.length;

          const updatedMatches = {
            oneWayMatches: prev.oneWayMatches.filter(m => m.id !== matchId),
            mutualMatches: prev.mutualMatches.filter(m => m.id !== matchId),
            loveMatches: [...prev.loveMatches, loveMatch]
          };

          setTimeout(() => {
            setCurrentMatchIndex(prevIndex => ({
              ...prevIndex,
              love: newLoveMatchesLength
            }));
          }, 0);

          return updatedMatches;
        }
        return prev;
      });

      setActiveTab('love');
      setAnimatingMatch(null);
    }, 500);
  };

  // Remove match from all tabs
  // Remove match from all tabs

  // Update match in place
  const updateMatchInPlace = (matchId, updates) => {
    setLocalMatches(prev => {
      const updateMatchInArray = (matches) => 
        matches.map(m => m.id === matchId ? { ...m, ...updates } : m);

      return {
        oneWayMatches: updateMatchInArray(prev.oneWayMatches),
        mutualMatches: updateMatchInArray(prev.mutualMatches),
        loveMatches: updateMatchInArray(prev.loveMatches)
      };
    });
  };

  // Handle Still Pass (Second chance rejection)
  const handleStillPass = async (matchId) => {
    await handlePass(matchId, true);
  };

  // NEW: Handle Start Chat - Opens chat interface immediately
  const handleStartChat = async (matchId) => {
    
    // Find the match to get the other user's data
    const match = [...localMatches.oneWayMatches, ...localMatches.mutualMatches, ...localMatches.loveMatches]
      .find(m => m.id === matchId);
    
    if (!match || !match.matchedUser) {
      alert('Unable to start chat. Match data not found.');
      return;
    }

    try {
      // Create or get existing conversation
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user1Id: userProfile.id,
          user2Id: match.matchedUser.id
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        // Set up chat interface data
        const chatId = result.data.chatId;
        const otherUser = {
          id: match.matchedUser.id,
          firstName: match.matchedUser.firstName,
          lastName: match.matchedUser.lastName,
          profilePicture: match.matchedUser.profilePicture
        };
        
        // Open chat interface immediately
        setActiveChatId(chatId);
        setActiveOtherUser(otherUser);
        setShowChatInterface(true);
        
      } else {
        throw new Error(result.message || 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      setShowServerError(true);
    }
  };

  // NEW: Handle chat interface close
  const handleChatClose = () => {
    setShowChatInterface(false);
    setActiveChatId(null);
    setActiveOtherUser(null);
    // Chat conversation is automatically saved in the database and will appear in Messages tab
  };

  // Render match card
  const renderMatchCard = (match, tabType) => {
    const photos = getMatchPhotos(match);
    const mainPhoto = photos[0] || '/default-avatar.png';
    const isActing = actionStates[match.id];
    const isAnimating = animatingMatch === match.id;
    
    return (
      <div 
        key={match.id} 
        className={`match-card single-card ${isAnimating ? 'animating-to-love' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="match-card-header">
          <div 
            className="match-photo-container"
            onClick={() => openPhotoModal(match, 0)}
          >
            <img 
              src={mainPhoto} 
              alt={match.matchedUser?.firstName} 
              className="match-photo"
            />
            {photos.length > 1 && (
              <div className="photo-count">
                <span className="photo-icon">📷</span>
                <span>{photos.length}</span>
              </div>
            )}
          </div>
          
          <div className="match-score-badge">
            <span className="score-value">{match.score}%</span>
            <span className="score-label">Match</span>
          </div>
        </div>

        <div className="match-card-body">
          <h3 className="match-name">
            {match.matchedUser?.firstName} {match.matchedUser?.lastName}
          </h3>
          
          {match.matchedUser?.age && (
            <p className="match-details">
              {match.matchedUser.age} years old
              {match.matchedUser.city && ` • ${match.matchedUser.city}`}
            </p>
          )}

          <div className="match-algorithm">
            <span className="algorithm-icon">🎯</span>
            <span className="algorithm-text">{match.algorithm}</span>
          </div>

          <p className="match-reason">{match.reason}</p>
          
          <p className="match-description">{match.description}</p>

          {/* Profile Information Section */}
          {(match.matchedUser?.age || match.matchedUser?.city || match.matchedUser?.bioData) && (
            <div className="collapsible-section">
              <button 
                className="section-toggle"
                onClick={() => toggleSection(match.id, 'profile')}
              >
                <span className="toggle-icon">
                  {expandedSections[`${match.id}-profile`] ? '▼' : '▶'}
                </span>
                <span className="toggle-label">Profile Information</span>
                <span className="toggle-badge">Details</span>
              </button>
              
              {expandedSections[`${match.id}-profile`] && (
                <div className="section-content profile-content">
                  <div className="profile-details">
                    {match.matchedUser.age && (
                      <div className="profile-item">
                        <span className="profile-label">🎂 Age:</span>
                        <span>{match.matchedUser.age} years old</span>
                      </div>
                    )}
                    {match.matchedUser.city && (
                      <div className="profile-item">
                        <span className="profile-label">📍 Location:</span>
                        <span>{match.matchedUser.city}</span>
                      </div>
                    )}
                    {match.matchedUser.lookingFor && (
                      <div className="profile-item">
                        <span className="profile-label">💝 Looking for:</span>
                        <span>{match.matchedUser.lookingFor}</span>
                      </div>
                    )}
                    {match.matchedUser.relationshipStatus && (
                      <div className="profile-item">
                        <span className="profile-label">💍 Status:</span>
                        <span>{match.matchedUser.relationshipStatus}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Bio Data if available */}
                  {match.matchedUser.bioData && (
                    <>
                      {match.matchedUser.bioData.personalBio && (
                        <div className="bio-section">
                          <h4>About Me</h4>
                          <p className="bio-text">{match.matchedUser.bioData.personalBio}</p>
                        </div>
                      )}
                      
                      <div className="bio-details">
                        {match.matchedUser.bioData.occupation && (
                          <div className="bio-item">
                            <span className="bio-label">💼 Work:</span>
                            <span>{match.matchedUser.bioData.occupation} 
                              {match.matchedUser.bioData.company && ` at ${match.matchedUser.bioData.company}`}
                            </span>
                          </div>
                        )}
                        
                        {match.matchedUser.bioData.education && (
                          <div className="bio-item">
                            <span className="bio-label">🎓 Education:</span>
                            <span>{match.matchedUser.bioData.education}</span>
                          </div>
                        )}
                        
                        {match.matchedUser.bioData.height && (
                          <div className="bio-item">
                            <span className="bio-label">📏 Height:</span>
                            <span>{match.matchedUser.bioData.height}</span>
                          </div>
                        )}
                        
                        {match.matchedUser.bioData.languages && match.matchedUser.bioData.languages.length > 0 && (
                          <div className="bio-item">
                            <span className="bio-label">🗣️ Languages:</span>
                            <span>{match.matchedUser.bioData.languages.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      
                      {match.matchedUser.bioData.interests && match.matchedUser.bioData.interests.length > 0 && (
                        <div className="bio-tags">
                          <span className="tags-label">Interests:</span>
                          <div className="tags-list">
                            {match.matchedUser.bioData.interests.map((interest, idx) => (
                              <span key={idx} className="tag">{interest}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {match.matchedUser.bioData.hobbies && match.matchedUser.bioData.hobbies.length > 0 && (
                        <div className="bio-tags">
                          <span className="tags-label">Hobbies:</span>
                          <div className="tags-list">
                            {match.matchedUser.bioData.hobbies.map((hobby, idx) => (
                              <span key={idx} className="tag">{hobby}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="lifestyle-grid">
                        {match.matchedUser.bioData.fitnessLevel && (
                          <div className="lifestyle-item">
                            <span className="lifestyle-icon">🏃</span>
                            <span>{match.matchedUser.bioData.fitnessLevel}</span>
                          </div>
                        )}
                        {match.matchedUser.bioData.dietPreference && (
                          <div className="lifestyle-item">
                            <span className="lifestyle-icon">🥗</span>
                            <span>{match.matchedUser.bioData.dietPreference}</span>
                          </div>
                        )}
                        {match.matchedUser.bioData.smokingHabits && (
                          <div className="lifestyle-item">
                            <span className="lifestyle-icon">🚭</span>
                            <span>{match.matchedUser.bioData.smokingHabits}</span>
                          </div>
                        )}
                        {match.matchedUser.bioData.drinkingHabits && (
                          <div className="lifestyle-item">
                            <span className="lifestyle-icon">🍷</span>
                            <span>{match.matchedUser.bioData.drinkingHabits}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Personality Analysis Section */}
          {match.matchedUser?.personalityAnalysis && (
            <div className="collapsible-section">
              <button 
                className="section-toggle"
                onClick={() => toggleSection(match.id, 'personality')}
              >
                <span className="toggle-icon">
                  {expandedSections[`${match.id}-personality`] ? '▼' : '▶'}
                </span>
                <span className="toggle-label">Personality Profile</span>
                <span className="toggle-badge">AI Analysis</span>
              </button>
              
              {expandedSections[`${match.id}-personality`] && (
                <div className="section-content personality-content">
                  {match.matchedUser.personalityAnalysis.corePersonality && (
                    <div className="personality-section">
                      <h4>Core Personality</h4>
                      {match.matchedUser.personalityAnalysis.corePersonality.primaryTraits && (
                        <div className="trait-list">
                          <span className="trait-label">Primary Traits:</span>
                          {match.matchedUser.personalityAnalysis.corePersonality.primaryTraits.map((trait, idx) => (
                            <span key={idx} className="trait-badge">{trait}</span>
                          ))}
                        </div>
                      )}
                      {match.matchedUser.personalityAnalysis.corePersonality.strengths && (
                        <div className="trait-list">
                          <span className="trait-label">Strengths:</span>
                          {match.matchedUser.personalityAnalysis.corePersonality.strengths.map((strength, idx) => (
                            <span key={idx} className="trait-badge strength">{strength}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {match.matchedUser.personalityAnalysis.personalityScore && (
                    <div className="personality-scores">
                      <h4>Personality Scores</h4>
                      <div className="score-bars">
                        {Object.entries(match.matchedUser.personalityAnalysis.personalityScore).map(([trait, score]) => (
                          <div key={trait} className="score-bar-item">
                            <span className="score-label">{trait}</span>
                            <div className="score-bar">
                              <div 
                                className="score-fill" 
                                style={{width: `${score}%`}}
                              />
                            </div>
                            <span className="score-value">{score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {match.matchedUser.personalityAnalysis.relationshipStyle && (
                    <div className="personality-section">
                      <h4>Relationship Style</h4>
                      <div className="relationship-info">
                        <p><strong>Attachment:</strong> {match.matchedUser.personalityAnalysis.relationshipStyle.attachmentStyle}</p>
                        <p><strong>Communication:</strong> {match.matchedUser.personalityAnalysis.relationshipStyle.communicationStyle}</p>
                      </div>
                    </div>
                  )}
                  
                  {match.matchedUser.personalityAnalysis.matchingInsights && (
                    <div className="personality-section">
                      <h4>Matching Insights</h4>
                      <p className="insight-text">{match.matchedUser.personalityAnalysis.matchingInsights.idealPartnerType}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="match-card-footer">
          {/* Render buttons based on match state */}
          {match.showButtons && (
            <div className="action-buttons">
              {tabType === 'oneway' && match.userPosition === 'user1' && !match.user1_expressed_interest && (
                <>
                  <button 
                    className="btn-primary"
                    onClick={() => handleExpressInterest(match.id)}
                    disabled={isActing}
                  >
                    {isActing === 'expressing' ? 'Sending...' : match.buttonText?.primary}
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => handlePass(match.id)}
                    disabled={isActing}
                  >
                    {isActing === 'passing' ? 'Passing...' : match.buttonText?.secondary}
                  </button>
                </>
              )}

              {tabType === 'oneway' && match.userPosition === 'user2' && match.user1_expressed_interest && (
                <>
                  <button 
                    className="btn-primary"
                    onClick={() => handleAccept(match.id)}
                    disabled={isActing}
                  >
                    {isActing === 'accepting' ? 'Accepting...' : match.buttonText?.primary}
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => handlePass(match.id)}
                    disabled={isActing}
                  >
                    {isActing === 'passing' ? 'Passing...' : match.buttonText?.secondary}
                  </button>
                </>
              )}

              {tabType === 'mutual' && !match.isSecondChance && (
                <>
                  <button 
                    className="btn-primary"
                    onClick={() => handleLike(match.id)}
                    disabled={isActing}
                  >
                    {isActing === 'liking' ? 'Liking...' : match.buttonText?.primary}
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => handlePass(match.id)}
                    disabled={isActing}
                  >
                    {isActing === 'passing' ? 'Passing...' : match.buttonText?.secondary}
                  </button>
                </>
              )}

              {tabType === 'mutual' && match.isSecondChance && (
                <>
                  <button 
                    className="btn-primary"
                    onClick={() => handleLike(match.id, true)}
                    disabled={isActing}
                  >
                    {isActing === 'liking' ? 'Liking...' : 'Like'}
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => handleStillPass(match.id)}
                    disabled={isActing}
                  >
                    {isActing === 'passing' ? 'Passing...' : 'Still Pass'}
                  </button>
                </>
              )}
            </div>
          )}

          {!match.showButtons && match.buttonText?.primary && (
            <div className="status-badge">
              {match.buttonText.primary}
            </div>
          )}

          {tabType === 'love' && (
            <button 
              className="btn-chat"
              onClick={() => handleStartChat(match.id)}
            >
              <span className="chat-icon">💬</span>
              Start Chatting
            </button>
          )}
        </div>
      </div>
    );
  };

  // Handle tab change
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  return (
    <div className="matches-container">
      <div className="matches-header">
        <h2 className="matches-title">Your Matches</h2>
        <p className="matches-subtitle">
          Discover people who are compatible with you
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="matches-tabs">
        <button 
          className={`tab-button ${activeTab === 'oneway' ? 'active' : ''}`}
          onClick={() => handleTabChange('oneway')}
        >
          <span className="tab-icon">💘</span>
          <span className="tab-label">One-Way</span>
          {localMatches.oneWayMatches.length > 0 && (
            <span className="tab-badge">{localMatches.oneWayMatches.length}</span>
          )}
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'mutual' ? 'active' : ''}`}
          onClick={() => handleTabChange('mutual')}
        >
          <span className="tab-icon">🎯</span>
          <span className="tab-label">Mutual</span>
          {localMatches.mutualMatches.length > 0 && (
            <span className="tab-badge">{localMatches.mutualMatches.length}</span>
          )}
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'love' ? 'active' : ''}`}
          onClick={() => handleTabChange('love')}
        >
          <span className="tab-icon">💕</span>
          <span className="tab-label">Love</span>
          {localMatches.loveMatches.length > 0 && (
            <span className="tab-badge love">{localMatches.loveMatches.length}</span>
          )}
        </button>
      </div>

      {/* Tab Content - SINGLE CARD VIEW */}
      <div className="matches-content single-card-view">
        {activeTab === 'oneway' && (
          <div className="match-stack">
            {localMatches.oneWayMatches.length > 0 ? (
              <>
                {renderMatchCard(localMatches.oneWayMatches[currentMatchIndex.oneway], 'oneway')}
                
                {/* Navigation Controls */}
                <div className="navigation-controls">
                  <button 
                    className="nav-button prev"
                    onClick={() => navigateMatch('prev')}
                    disabled={localMatches.oneWayMatches.length <= 1}
                  >
                    <span className="nav-arrow">‹</span>
                    <span className="nav-text">Previous</span>
                  </button>
                  
                  <div className="match-counter">
                    <span className="current-match">{currentMatchIndex.oneway + 1}</span>
                    <span className="separator">/</span>
                    <span className="total-matches">{localMatches.oneWayMatches.length}</span>
                  </div>
                  
                  <button 
                    className="nav-button next"
                    onClick={() => navigateMatch('next')}
                    disabled={localMatches.oneWayMatches.length <= 1}
                  >
                    <span className="nav-text">Next</span>
                    <span className="nav-arrow">›</span>
                  </button>
                </div>
                
                {/* Progress Indicators */}
                {localMatches.oneWayMatches.length > 1 && (
                  <div className="progress-indicators">
                    {localMatches.oneWayMatches.map((_, index) => (
                      <button
                        key={index}
                        className={`progress-dot ${index === currentMatchIndex.oneway ? 'active' : ''}`}
                        onClick={() => setCurrentMatchIndex(prev => ({ ...prev, oneway: index }))}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="no-matches">
                <span className="no-matches-icon">💘</span>
                <h3>No one-way matches yet</h3>
                <p>Check back tomorrow for new matches!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mutual' && (
          <div className="match-stack">
            {localMatches.mutualMatches.length > 0 ? (
              <>
                {renderMatchCard(localMatches.mutualMatches[currentMatchIndex.mutual], 'mutual')}
                
                {/* Navigation Controls */}
                <div className="navigation-controls">
                  <button 
                    className="nav-button prev"
                    onClick={() => navigateMatch('prev')}
                    disabled={localMatches.mutualMatches.length <= 1}
                  >
                    <span className="nav-arrow">‹</span>
                    <span className="nav-text">Previous</span>
                  </button>
                  
                  <div className="match-counter">
                    <span className="current-match">{currentMatchIndex.mutual + 1}</span>
                    <span className="separator">/</span>
                    <span className="total-matches">{localMatches.mutualMatches.length}</span>
                  </div>
                  
                  <button 
                    className="nav-button next"
                    onClick={() => navigateMatch('next')}
                    disabled={localMatches.mutualMatches.length <= 1}
                  >
                    <span className="nav-text">Next</span>
                    <span className="nav-arrow">›</span>
                  </button>
                </div>
                
                {/* Progress Indicators */}
                {localMatches.mutualMatches.length > 1 && (
                  <div className="progress-indicators">
                    {localMatches.mutualMatches.map((_, index) => (
                      <button
                        key={index}
                        className={`progress-dot ${index === currentMatchIndex.mutual ? 'active' : ''}`}
                        onClick={() => setCurrentMatchIndex(prev => ({ ...prev, mutual: index }))}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="no-matches">
                <span className="no-matches-icon">🎯</span>
                <h3>No mutual matches yet</h3>
                <p>We're finding people who match with you!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'love' && (
          <div className="match-stack">
            {localMatches.loveMatches.length > 0 ? (
              <>
                {renderMatchCard(localMatches.loveMatches[currentMatchIndex.love], 'love')}
                
                {/* Navigation Controls */}
                <div className="navigation-controls">
                  <button 
                    className="nav-button prev"
                    onClick={() => navigateMatch('prev')}
                    disabled={localMatches.loveMatches.length <= 1}
                  >
                    <span className="nav-arrow">‹</span>
                    <span className="nav-text">Previous</span>
                  </button>
                  
                  <div className="match-counter">
                    <span className="current-match">{currentMatchIndex.love + 1}</span>
                    <span className="separator">/</span>
                    <span className="total-matches">{localMatches.loveMatches.length}</span>
                  </div>
                  
                  <button 
                    className="nav-button next"
                    onClick={() => navigateMatch('next')}
                    disabled={localMatches.loveMatches.length <= 1}
                  >
                    <span className="nav-text">Next</span>
                    <span className="nav-arrow">›</span>
                  </button>
                </div>
                
                {/* Progress Indicators */}
                {localMatches.loveMatches.length > 1 && (
                  <div className="progress-indicators">
                    {localMatches.loveMatches.map((_, index) => (
                      <button
                        key={index}
                        className={`progress-dot ${index === currentMatchIndex.love ? 'active' : ''}`}
                        onClick={() => setCurrentMatchIndex(prev => ({ ...prev, love: index }))}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="no-matches">
                <span className="no-matches-icon">💕</span>
                <h3>No love matches yet</h3>
                <p>Like someone from your matches to create a connection!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="keyboard-help">
        <span className="help-item">
          <kbd>←</kbd> Previous
        </span>
        <span className="help-item">
          <kbd>→</kbd> Next
        </span>
        <span className="help-item">
          <kbd>Space</kbd> Like/Accept
        </span>
        <span className="help-item">
          <kbd>X</kbd> Pass
        </span>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && selectedMatch && (
        <div className="photo-modal-overlay" onClick={closePhotoModal}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closePhotoModal}>
              ✕
            </button>
            
            <div className="modal-photo-container">
              {getMatchPhotos(selectedMatch).length > 1 && (
                <button 
                  className="photo-nav prev"
                  onClick={() => navigatePhoto('prev')}
                >
                  ‹
                </button>
              )}
              
              <img 
                src={getMatchPhotos(selectedMatch)[currentPhotoIndex]} 
                alt={`${selectedMatch.matchedUser?.firstName || 'User'} ${currentPhotoIndex + 1}`}
                className="modal-photo"
              />
              
              {getMatchPhotos(selectedMatch).length > 1 && (
                <button 
                  className="photo-nav next"
                  onClick={() => navigatePhoto('next')}
                >
                  ›
                </button>
              )}
            </div>
            
            {getMatchPhotos(selectedMatch).length > 1 && (
              <div className="photo-indicators">
                {getMatchPhotos(selectedMatch).map((_, index) => (
                  <button
                    key={index}
                    className={`indicator ${index === currentPhotoIndex ? 'active' : ''}`}
                    onClick={() => setCurrentPhotoIndex(index)}
                  />
                ))}
              </div>
            )}
            
            <div className="modal-info">
              <h3>{selectedMatch.matchedUser?.firstName} {selectedMatch.matchedUser?.lastName}</h3>
              <p>Photo {currentPhotoIndex + 1} of {getMatchPhotos(selectedMatch).length}</p>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Chat Interface Modal */}
      {showChatInterface && activeChatId && activeOtherUser && (
        <ChatInterface
          chatId={activeChatId}
          currentUser={userProfile}
          otherUser={activeOtherUser}
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

export default Matches;