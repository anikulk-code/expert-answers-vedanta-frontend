import React, { useState } from 'react';
import './QueueSection.css';

function QueueSection({ queueInfo, userQuestion, apiUrl, prominence = 'prominent' }) {
  const [newQuestion, setNewQuestion] = useState(userQuestion || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showFullQueue, setShowFullQueue] = useState(prominence !== 'subtle'); // Start expanded unless subtle
  const [showQueueList, setShowQueueList] = useState(false);
  const [queueQuestions, setQueueQuestions] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const handleUpvote = async (question) => {
    try {
      const response = await fetch(`${apiUrl}/api/questions/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Question upvoted! Total upvotes: ${data.upvotes}` });
        // Refresh queue list if it's visible
        if (showQueueList) {
          fetchQueue();
        }
        // Don't trigger a search - just update the upvote count locally
        // The queueInfo will be refreshed on next search
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to upvote' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error upvoting question. Please try again.' });
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
      setMessage({ type: 'error', text: 'Please enter a question' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiUrl}/api/questions/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: newQuestion.trim() }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || `Question added to queue! Upvotes: ${data.upvotes}` });
        // Clear the input after successful submission
        setNewQuestion('');
        // Refresh queue list if it's visible
        if (showQueueList) {
          fetchQueue();
        }
        // Don't trigger a search - just show success message
        // The queueInfo will be refreshed on next search
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to add question' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error adding question. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const response = await fetch(`${apiUrl}/api/questions/queue?limit=20&sort_by=upvotes`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQueueQuestions(data.questions || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load queue' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading queue. Please try again.' });
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleToggleQueue = () => {
    if (!showQueueList) {
      // Fetch queue when showing for the first time
      fetchQueue();
    }
    setShowQueueList(!showQueueList);
  };

  if (!queueInfo) {
    return null;
  }

  // Determine styling based on prominence
  const sectionClass = `queue-section queue-section-${prominence}`;
  // If user clicked "Add to Queue" from subtle mode, show full section
  const showFullSection = showFullQueue || prominence === 'very-prominent' || prominence === 'prominent';
  const showSubtleOption = prominence === 'subtle' && !showFullQueue;

  return (
    <div className={sectionClass}>
      {showFullSection && <h2>Questions & Voting</h2>}

      {queueInfo.questionInQueue && showFullSection && (
        <div className="queue-status success">
          Your question is in the queue with {queueInfo.upvotes} upvote(s).
        </div>
      )}

      {message && (
        <div className={`queue-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {showFullSection && queueInfo.similarQuestions && queueInfo.similarQuestions.length > 0 && (
        <div className="similar-questions">
          <h3>Similar Questions (Upvote if relevant)</h3>
          {queueInfo.similarQuestions.map((sq, index) => (
            <div key={index} className="question-item">
              <div className="question-text">{sq.question}</div>
              <button
                className="upvote-button"
                onClick={() => handleUpvote(sq.question)}
                disabled={isSubmitting}
              >
                <span>👍</span>
                <span className="upvote-count">{sq.upvotes}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {showFullSection && (
        <div className="queue-list-section">
          <button
            className="toggle-queue-button"
            onClick={handleToggleQueue}
            disabled={loadingQueue}
          >
            {showQueueList ? '▼ Hide Queue' : '▶ Show Queue'}
          </button>
          
          {showQueueList && (
            <div className="queue-list">
              {loadingQueue ? (
                <div className="queue-loading">Loading queue...</div>
              ) : queueQuestions.length > 0 ? (
                <>
                  <h3>All Questions in Queue ({queueQuestions.length})</h3>
                  {queueQuestions.map((q, index) => {
                    const upvotes = q.voteUp || q.votes || q.upvotes || 0;
                    const questionText = q.question || q.questionText || '';
                    return (
                      <div key={q.id || index} className="question-item">
                        <div className="question-text">{questionText}</div>
                        <button
                          className="upvote-button"
                          onClick={() => handleUpvote(questionText)}
                          disabled={isSubmitting}
                        >
                          <span>👍</span>
                          <span className="upvote-count">{upvotes}</span>
                        </button>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="queue-empty">No questions in queue yet.</div>
              )}
            </div>
          )}
        </div>
      )}

      {queueInfo.canPostNewQuestion && (
        <>
          {showSubtleOption && !showFullQueue ? (
            <div className="add-question-form subtle">
              <p className="subtle-text">
                Not what you're looking for?{' '}
                <button
                  className="subtle-link-button"
                  onClick={() => setShowFullQueue(true)}
                  disabled={isSubmitting}
                >
                  Add your question to our queue
                </button>
              </p>
            </div>
          ) : (
            <div className="add-question-form">
              <h3>Add Your Question to Queue</h3>
              <div className="input-group">
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Enter your question..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddQuestion()}
                />
                <button
                  onClick={handleAddQuestion}
                  disabled={isSubmitting || !newQuestion.trim()}
                  className={prominence === 'very-prominent' ? 'prominent-button' : ''}
                >
                  {isSubmitting ? 'Adding...' : 'Add to Queue'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default QueueSection;
