import React, { useState, useEffect, useRef } from 'react';
import './AIChatInterface.css';
import ErrorModal from './ErrorModal';

const AIChatInterface = ({ onClose, userProfile, onDashboardOpen, startFromQuestion = 1 }) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [questionsPhase, setQuestionsPhase] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnalysisLoading, setShowAnalysisLoading] = useState(false);
  const [isEnrichmentMode] = useState(startFromQuestion === 9);
  const [showServerError, setShowServerError] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typeIntervalRef = useRef(null);
  const typeStateRef = useRef(null);

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Just close the error modal, user stays on the current page
  };

  const initialMessages = [
    {
      id: 1,
      text: `Hey ${userProfile?.firstName || 'there'}! 👋 Welcome to Match.AI!`,
      delay: 1000
    },
    {
      id: 2,
      text: "I'm your AI matchmaker, and I'm here to help you find something truly special - not just another swipe.",
      delay: 2000
    },
    {
      id: 3,
      text: "Dating should be about meaningful connections, not just photos. That's why we've ditched endless swiping for thoughtful questions that reveal the real you. Ready to find someone who truly gets you?",
      delay: 2500
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showResponseInput]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [userResponse]);

  // Enhanced typing function with background tab support
  const typeMessage = (messageText, speed = 50) => {
    return new Promise((resolve) => {
      // Store typing state in ref to persist across renders
      typeStateRef.current = {
        fullText: messageText,
        currentIndex: 0,
        startTime: Date.now(),
        speed: speed,
        resolve: resolve
      };

      const performTyping = () => {
        if (!typeStateRef.current) return;

        const state = typeStateRef.current;
        const now = Date.now();
        const elapsed = now - state.startTime;
        
        // Calculate how many characters should be displayed based on elapsed time
        const targetIndex = Math.min(
          Math.floor(elapsed / state.speed),
          state.fullText.length
        );

        // Update the displayed text
        const displayedText = state.fullText.substring(0, targetIndex);
        
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              text: displayedText
            };
          }
          return newMessages;
        });

        // Check if typing is complete
        if (targetIndex >= state.fullText.length) {
          if (typeIntervalRef.current) {
            clearInterval(typeIntervalRef.current);
            typeIntervalRef.current = null;
          }
          setIsTyping(false);
          if (state.resolve) {
            state.resolve();
          }
          typeStateRef.current = null;
        }
      };

      // Use requestAnimationFrame when tab is visible, setInterval as fallback
      const useRAF = !document.hidden;
      
      if (useRAF) {
        const animate = () => {
          performTyping();
          if (typeStateRef.current && typeStateRef.current.currentIndex < messageText.length) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      } else {
        // Use shorter interval to catch up faster when returning to tab
        typeIntervalRef.current = setInterval(performTyping, 50);
      }
    });
  };

  // Handle visibility change to resume typing smoothly
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && typeStateRef.current) {
        // Tab became visible - immediately update to show correct progress
        const state = typeStateRef.current;
        const now = Date.now();
        const elapsed = now - state.startTime;
        const targetIndex = Math.min(
          Math.floor(elapsed / state.speed),
          state.fullText.length
        );
        
        const displayedText = state.fullText.substring(0, targetIndex);
        
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              text: displayedText
            };
          }
          return newMessages;
        });

        // If message should be complete, finish it immediately
        if (targetIndex >= state.fullText.length) {
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                text: state.fullText
              };
            }
            return newMessages;
          });
          setIsTyping(false);
          if (state.resolve) {
            state.resolve();
          }
          typeStateRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const addMessage = (text) => {
    // Generate unique ID using timestamp + random number to guarantee uniqueness
    const uniqueId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setMessages(prev => [...prev, {
      id: uniqueId,
      text: '',
      sender: 'ai'
    }]);
    setIsTyping(true);
  };

  const displayQuestion = (questionData, isFirst = false) => {
    setCurrentQuestion(questionData);
    
    if (isFirst && !isEnrichmentMode) {
      // First question - show intro message first
      addMessage("Here is your first question");
      
      setTimeout(async () => {
        await typeMessage("Here is your first question");
        
        setTimeout(() => {
          // Then add the actual question
          addMessage(questionData.question);
          
          setTimeout(async () => {
            await typeMessage(questionData.question);
            setTimeout(() => {
              setShowResponseInput(true);
            }, 500);
          }, 100);
          
        }, 1500);
      }, 100);
    } else {
      // Subsequent questions or enrichment mode
      addMessage(questionData.question);
      
      setTimeout(async () => {
        await typeMessage(questionData.question);
        setTimeout(() => {
          setShowResponseInput(true);
        }, 500);
      }, 100);
    }
  };

  const fetchQuestionsFromAPI = async () => {
    try {
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/questions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data && result.data.question) {
        setQuestionsPhase(true);
        displayQuestion(result.data.question, true);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Failed to fetch first question:', error);
      setShowServerError(true);
      throw error;
    }
  };

  const fetchEnrichmentQuestionFromAPI = async () => {
    try {
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/questions/enrichment`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch enrichment questions: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data && result.data.question) {
        setQuestionsPhase(true);
        displayQuestion(result.data.question, true);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Failed to fetch enrichment question:', error);
      setShowServerError(true);
      throw error;
    }
  };

  const submitAnswerAndGetNext = async (answer, questionId) => {
    try {
      
      const endpoint = isEnrichmentMode ? 
        `${process.env.REACT_APP_API_URL}/api/questions/enrichment/answer` :
        `${process.env.REACT_APP_API_URL}/api/questions/answer`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userProfile.email,
          questionId: questionId,
          answer: answer
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data && result.data.isComplete) {
        // All questions completed
        // Check if we received user data
        if (result.data.userData) {
          if (onDashboardOpen) {
            onDashboardOpen(result.data.userData);
          } else {
            console.error('❌ onDashboardOpen callback is not available!');
          }
        } else {
          console.error('❌ No userData received from API');
        }
        
      } else if (result.data && result.data.question) {
        // Display next question
        setTimeout(() => {
          displayQuestion(result.data.question, false);
        }, 1000);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Failed to submit answer:', error);
      setShowServerError(true);
      throw error;
    }
  };

  const sendNextMessage = async () => {
    if (isEnrichmentMode) {
      // Skip initial messages and go directly to enrichment question
      await fetchEnrichmentQuestionFromAPI();
      return;
    }

    if (currentMessageIndex >= initialMessages.length) {
      // All welcome messages are complete - fetch first question from API
      await fetchQuestionsFromAPI();
      return;
    }

    const message = initialMessages[currentMessageIndex];
    
    // Add initial empty message with unique ID using timestamp + random
    const uniqueId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setMessages(prev => [...prev, {
      id: uniqueId,
      text: '',
      sender: 'ai'
    }]);

    setIsTyping(true);
    
    // Wait for delay, then type the message
    setTimeout(async () => {
      await typeMessage(message.text);
      setCurrentMessageIndex(prev => prev + 1);
    }, message.delay);
  };

  const handleResponseSubmit = async () => {
    if (!userResponse.trim() || !currentQuestion || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Add user message to chat with unique ID using timestamp + random
    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setMessages(prev => [...prev, {
      id: userMessageId,
      text: userResponse,
      sender: 'user'
    }]);
    
    
    const answer = userResponse;
    const questionId = currentQuestion.id;
    
    // Clear input and hide it
    setUserResponse('');
    setShowResponseInput(false);
    
    // Check if this is the final question BEFORE making API call
    const isFinalQuestion = (isEnrichmentMode && questionId === 15) || (!isEnrichmentMode && questionId === 8);
    
    if (isFinalQuestion) {
      setShowAnalysisLoading(true);
    }
    
    try {
      // Submit answer and get next question
      const result = await submitAnswerAndGetNext(answer, questionId);
      
      // Handle non-final questions
      if (!isFinalQuestion && result.data && result.data.question) {
        setTimeout(() => {
          displayQuestion(result.data.question, false);
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      // If there's an error and we showed loading, hide it
      if (isFinalQuestion) {
        setShowAnalysisLoading(false);
        setShowResponseInput(true); // Show input again for retry
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleResponseSubmit();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
      }
      typeStateRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Start the conversation after component mounts
    const timer = setTimeout(() => {
      sendNextMessage();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (isEnrichmentMode) return; // Skip for enrichment mode
    
    // Send next message when current one is complete
    if (currentMessageIndex > 0 && currentMessageIndex < initialMessages.length && !isTyping) {
      const timer = setTimeout(() => {
        sendNextMessage();
      }, 1500); // Wait 1.5s between messages

      return () => clearTimeout(timer);
    } else if (currentMessageIndex >= initialMessages.length && !isTyping && !questionsPhase) {
      // All messages complete - trigger API call
      const timer = setTimeout(() => {
        sendNextMessage();
      }, 2000); // Wait 2s after last message before API call

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMessageIndex, isTyping, questionsPhase, isEnrichmentMode]); // Removed initialMessages.length and sendNextMessage

  // Analysis Loading Screen
  if (showAnalysisLoading) {
    const loadingTitle = isEnrichmentMode ? 
      "Updating your enhanced personality profile!" :
      "Hold tight! We're doing your detailed personality analysis";
    
    const loadingMessage = isEnrichmentMode ?
      "Our AI is updating your personality analysis with your additional responses to provide even better matches!" :
      "Our AI is analyzing your responses to understand your personality, values, and what makes you unique. This helps us find you the most compatible matches!";


    return (
      <div className="chat-overlay">
        <div className="analysis-loading-container">
          <div className="analysis-loading-content">
            <div className="analysis-icon">🧠</div>
            <h2 className="analysis-title">{loadingTitle}</h2>
            <p className="analysis-message">{loadingMessage}</p>
            <div className="analysis-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <div className="progress-steps">
                <div className="progress-step active">
                  <div className="step-icon">📝</div>
                  <span>Analyzing Responses</span>
                </div>
                <div className="progress-step active">
                  <div className="step-icon">🎯</div>
                  <span>Identifying Patterns</span>
                </div>
                <div className="progress-step">
                  <div className="step-icon">💫</div>
                  <span>Creating Profile</span>
                </div>
              </div>
            </div>
            <div className="analysis-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-overlay">
      <div className="chat-container">
        <div className="chat-header">
          <div className="ai-avatar">
            <div className="ai-icon">💜</div>
            <div className="ai-status">
              <span className="ai-name">Match.AI Assistant</span>
              <span className="ai-online">
                <div className="online-dot"></div>
                Online
              </span>
            </div>
          </div>
          <button className="chat-close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message-container ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}>
              <div className="message-avatar">
                {message.sender === 'user' ? (
                  <div className="user-avatar">
                    {userProfile?.profilePicture ? (
                      <img src={userProfile.profilePicture} alt="User" className="user-avatar-image" />
                    ) : (
                      <div className="user-avatar-initials">
                        {userProfile?.firstName?.charAt(0)}{userProfile?.lastName?.charAt(0)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ai-avatar-small">💜</div>
                )}
              </div>
              <div className={`message-bubble ${message.sender === 'user' ? 'user-bubble' : ''}`}>
                <div className="message-text">{message.text}</div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message-container ai-message">
              <div className="message-avatar">
                <div className="ai-avatar-small">💜</div>
              </div>
              <div className="message-bubble typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {showResponseInput ? (
          <div className="chat-input">
            <div className="input-container">
              <textarea
                ref={textareaRef}
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                className="response-textarea"
                rows="1"
                disabled={isSubmitting}
              />
              <button 
                onClick={handleResponseSubmit}
                disabled={!userResponse.trim() || isSubmitting}
                className="send-button"
              >
                {isSubmitting ? (
                  <div className="loading-spinner-small"></div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-footer">
            <div className="chat-footer-content">
              <div className="footer-icon">💫</div>
              <span className="footer-text">Getting to know you better...</span>
            </div>
          </div>
        )}
      </div>

      <ErrorModal 
        isOpen={showServerError} 
        onOkClick={handleErrorOkClick}
      />
    </div>
  );
};

export default AIChatInterface;
