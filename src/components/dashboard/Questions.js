import React, { useState, useEffect } from 'react';
import './Questions.css';
import ErrorModal from '../ErrorModal';

const Questions = ({ userProfile, onQuestionsUpdate }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [responses, setResponses] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [questionsList, setQuestionsList] = useState([]);

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Just close the error modal, user stays on the current page
  };

  // Fetch questions from backend when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/questions/all`);        
        if (!response.ok) {
          throw new Error(`Failed to fetch questions: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract questions array from response
        const questions = data.matchingQuestions || data.questions || data;
        setQuestionsList(questions);
        
      } catch (error) {
        console.error('❌ Error fetching questions:', error);
        setShowServerError(true);
        // Set empty array on error
        setQuestionsList([]);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  // Merge questions with answers when both are available
  useEffect(() => {
    if (questionsList.length > 0) {
      
      // Create responses array for all 15 questions
      const mergedResponses = questionsList.map((question) => {
        // Find corresponding answer if it exists
        let userAnswer = '';
        
        if (userProfile?.answers) {
          const answerKey = `question${question.id}`;
          const answerData = userProfile.answers[answerKey];
          
          if (answerData) {
            userAnswer = answerData.answer || '';
          }
        }
        
        return {
          questionId: question.id,
          question: question.question || question.text,
          answer: userAnswer,
          category: question.category,
          type: question.type || 'text', // Default to text type
          options: question.options || [],
          scaleStart: question.scaleStart || 'Strongly Disagree',
          scaleEnd: question.scaleEnd || 'Strongly Agree'
        };
      });
      
      setResponses(mergedResponses);
    }
  }, [questionsList, userProfile]);

  const handleLockToggle = () => {
    setIsLocked(!isLocked);
  };

  const handleAnswerChange = (questionIndex, newAnswer) => {
    if (isLocked) return;

    const updatedResponses = responses.map((response, index) => {
      if (index === questionIndex) {
        return {
          ...response,
          answer: newAnswer
        };
      }
      return response;
    });

    setResponses(updatedResponses);
  };

  const handleSubmit = async () => {
    
    setIsSubmitting(true);
    
    try {
      // Send responses array directly as backend expects
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/questions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userProfile.email,
          responses: responses  // Send array directly
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Lock the form after successful update
      setIsLocked(true);
      
      // Notify parent components about the update
      if (onQuestionsUpdate) {
        onQuestionsUpdate(result.data.user);
      } else {
        console.error('❌ Questions: onQuestionsUpdate callback not provided');
      }

    } catch (error) {
      console.error('❌ Questions update failed:', error);
      setShowServerError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while fetching questions
  if (isLoadingQuestions) {
    return (
      <div className="questions-loading-overlay">
        <div className="questions-loading-container">
          <div className="questions-loading-content">
            <div className="questions-loading-icon">📋</div>
            <h2 className="questions-loading-title">Loading Questions</h2>
            <p className="questions-loading-message">
              Please wait while we fetch your personality questions...
            </p>
            <div className="questions-loading-spinner">
              <div className="questions-spinner-ring"></div>
              <div className="questions-spinner-ring"></div>
              <div className="questions-spinner-ring"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading Screen for submission
  if (isSubmitting) {
    return (
      <div className="questions-loading-overlay">
        <div className="questions-loading-container">
          <div className="questions-loading-content">
            <div className="questions-loading-icon">🧠</div>
            <h2 className="questions-loading-title">Re-analyzing Your Personality</h2>
            <p className="questions-loading-message">
              We're updating your personality analysis based on your revised responses. 
              This helps us find even better matches for you!
            </p>
            <div className="questions-loading-progress">
              <div className="questions-progress-bar">
                <div className="questions-progress-fill"></div>
              </div>
              <div className="questions-progress-steps">
                <div className="questions-progress-step active">
                  <div className="questions-step-icon">💾</div>
                  <span>Saving Responses</span>
                </div>
                <div className="questions-progress-step active">
                  <div className="questions-step-icon">🧠</div>
                  <span>AI Analysis</span>
                </div>
                <div className="questions-progress-step">
                  <div className="questions-step-icon">✅</div>
                  <span>Complete</span>
                </div>
              </div>
            </div>
            <div className="questions-loading-spinner">
              <div className="questions-spinner-ring"></div>
              <div className="questions-spinner-ring"></div>
              <div className="questions-spinner-ring"></div>
            </div>
            <div className="questions-loading-tip">
              <div className="tip-icon">💡</div>
              <p className="tip-text">
                Our AI is intelligently updating your personality profile while maintaining consistency with your core traits.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate answered questions count
  const answeredCount = responses.filter(r => r.answer && r.answer.trim() !== '').length;
  const totalCount = responses.length;

  return (
    <div className="questions-page-section">
      {/* Header with Lock/Unlock */}
      <div className="questions-header">
        <div className="questions-header-content">
          <h2 className="questions-title">Your Personality Questions</h2>
          <div className="questions-subtitle">
            <span className="questions-count">{answeredCount}/{totalCount} Questions Answered</span>
            <span className="questions-status">
              {userProfile?.isAnalysisComplete ? '✅ Analysis Complete' : '⏳ Analysis Pending'}
            </span>
          </div>
        </div>
        <button 
          className={`lock-button ${isLocked ? 'locked' : 'unlocked'}`}
          onClick={handleLockToggle}
          title={isLocked ? 'Click to edit your responses' : 'Click to lock your responses'}
        >
          {isLocked ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10A2,2 0 0,1 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18Z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Questions List */}
      <div className="questions-list-section">
        {!isLocked && (
          <div className="questions-edit-notice">
            <div className="notice-icon">✏️</div>
            <div className="notice-content">
              <h4 className="notice-title">Edit Mode Active</h4>
              <p className="notice-text">
                Make changes to your responses below. When you save, our AI will update your personality analysis 
                while maintaining consistency with your core traits.
              </p>
            </div>
          </div>
        )}

        <div className="questions-container">
          {responses.map((response, index) => (
            <div key={response.questionId} className={`question-card ${!isLocked ? 'editable' : ''} ${!response.answer ? 'unanswered' : ''}`}>
              <div className="question-number">
                <span className="number-circle">{response.questionId}</span>
              </div>
              
              <div className="question-content">
                <h3 className="question-text">{response.question}</h3>
                
                {response.category && (
                  <div className="question-category">
                    <span className="category-badge">{response.category.replace(/_/g, ' ')}</span>
                  </div>
                )}
                
                {response.type === 'multiple-choice' && response.options && response.options.length > 0 ? (
                  <div className="answer-section">
                    <div className="answer-options">
                      {response.options.map((option, optionIndex) => (
                        <label 
                          key={optionIndex} 
                          className={`answer-option ${!isLocked ? 'clickable' : ''} ${response.answer === option ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`question-${response.questionId}`}
                            value={option}
                            checked={response.answer === option}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            disabled={isLocked}
                            className="answer-radio"
                          />
                          <div className="option-indicator">
                            <div className="option-dot"></div>
                          </div>
                          <span className="option-text">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : response.type === 'scale' ? (
                  <div className="answer-section">
                    <div className="scale-container">
                      <div className="scale-labels">
                        <span className="scale-label-start">{response.scaleStart}</span>
                        <span className="scale-label-end">{response.scaleEnd}</span>
                      </div>
                      <div className="scale-options">
                        {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                          <label 
                            key={value} 
                            className={`scale-option ${!isLocked ? 'clickable' : ''} ${parseInt(response.answer) === value ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`question-${response.questionId}`}
                              value={value}
                              checked={parseInt(response.answer) === value}
                              onChange={(e) => handleAnswerChange(index, e.target.value)}
                              disabled={isLocked}
                              className="scale-radio"
                            />
                            <div className="scale-number">{value}</div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="answer-section">
                    <textarea
                      value={response.answer}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      disabled={isLocked}
                      className={`answer-textarea ${!isLocked ? 'editable' : ''}`}
                      placeholder={!response.answer ? "No response yet - click unlock to add your answer" : "Your response..."}
                      rows="4"
                    />
                  </div>
                )}

                {response.answer && (
                  <div className="answer-summary">
                    <div className="answer-label">Your Answer:</div>
                    <div className="answer-display">
                      {response.type === 'scale' ? (
                        <span className="scale-answer">
                          {response.answer}/7 
                          <span className="scale-description">
                            ({parseInt(response.answer) <= 3 ? response.scaleStart : 
                              parseInt(response.answer) >= 6 ? response.scaleEnd : 'Neutral'})
                          </span>
                        </span>
                      ) : (
                        <span className="text-answer">{response.answer}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      {!isLocked && (
        <div className="questions-submit-section">
          <div className="submit-info">
            <div className="submit-icon">🧠</div>
            <div className="submit-text">
              <h4>Ready to Update Your Analysis?</h4>
              <p>Our AI will intelligently update your personality profile based on your changes.</p>
            </div>
          </div>
          <button className="questions-submit-button" onClick={handleSubmit}>
            <span className="button-icon">💾</span>
            Save Changes & Re-analyze
          </button>
        </div>
      )}

      <ErrorModal 
        isOpen={showServerError} 
        onOkClick={handleErrorOkClick}
      />
    </div>
  );
};

export default Questions;