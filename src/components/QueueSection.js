import React, { useEffect, useState } from 'react';
import './QueueSection.css';

const EMPTY_QUEUE_INFO = {
  questionInQueue: false,
  upvotes: 0,
  similarQuestions: null,
  canPostNewQuestion: true,
};

function QueueSection({
  queueInfo: initialQueueInfo,
  userQuestion,
  apiUrl,
  prominence = 'prominent',
  lazyLoad = false,
}) {
  const [queueInfo, setQueueInfo] = useState(initialQueueInfo || (lazyLoad ? EMPTY_QUEUE_INFO : null));
  const [infoLoaded, setInfoLoaded] = useState(Boolean(initialQueueInfo?.similarQuestions));
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [newQuestion, setNewQuestion] = useState(userQuestion || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showFullQueue, setShowFullQueue] = useState(prominence !== 'subtle');
  const [showQueueList, setShowQueueList] = useState(false);
  const [queueQuestions, setQueueQuestions] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  useEffect(() => {
    setNewQuestion(userQuestion || '');
  }, [userQuestion]);

  useEffect(() => {
    if (initialQueueInfo) {
      setQueueInfo(initialQueueInfo);
      setInfoLoaded(Boolean(initialQueueInfo.similarQuestions) || !lazyLoad);
    } else if (lazyLoad) {
      setQueueInfo(EMPTY_QUEUE_INFO);
      setInfoLoaded(false);
    } else {
      setQueueInfo(null);
      setInfoLoaded(false);
    }
    setShowFullQueue(prominence !== 'subtle');
    setMessage(null);
  }, [initialQueueInfo, lazyLoad, prominence, userQuestion]);

  const fetchQueueInfo = async () => {
    if (!userQuestion || !apiUrl || loadingInfo) {
      return null;
    }

    setLoadingInfo(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/answers/v1/queue-info?question=${encodeURIComponent(userQuestion)}`,
        { headers: { Accept: 'application/json' } }
      );

      if (!response.ok) {
        setMessage({ type: 'error', text: 'Failed to load related questions' });
        return null;
      }

      const data = await response.json();
      setQueueInfo(data);
      setInfoLoaded(true);
      return data;
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading related questions. Please try again.' });
      return null;
    } finally {
      setLoadingInfo(false);
    }
  };

  const ensureQueueInfo = async () => {
    if (infoLoaded || !lazyLoad) {
      return queueInfo;
    }
    return fetchQueueInfo();
  };

  const handleExpandFullSection = async () => {
    setShowFullQueue(true);
    await ensureQueueInfo();
  };

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
        setQueueInfo((prev) => {
          if (!prev) return prev;
          const similarQuestions = (prev.similarQuestions || []).map((sq) =>
            sq.question === question ? { ...sq, upvotes: data.upvotes } : sq
          );
          const isOwn =
            (prev.questionInQueue && userQuestion && question.trim().toLowerCase() === userQuestion.trim().toLowerCase());
          return {
            ...prev,
            upvotes: isOwn ? data.upvotes : prev.upvotes,
            similarQuestions: similarQuestions.length ? similarQuestions : prev.similarQuestions,
          };
        });
        if (showQueueList) {
          fetchQueue();
        }
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
        setMessage({
          type: 'success',
          text: data.message || `Question added to queue! Upvotes: ${data.upvotes}`,
        });
        setQueueInfo((prev) =>
          prev
            ? {
                ...prev,
                questionInQueue: true,
                upvotes: data.upvotes ?? prev.upvotes,
                canPostNewQuestion: true,
              }
            : prev
        );
        setNewQuestion('');
        if (showQueueList) {
          fetchQueue();
        }
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
          Accept: 'application/json',
        },
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

  const handleToggleQueue = async () => {
    if (!showQueueList) {
      await ensureQueueInfo();
      fetchQueue();
    }
    setShowQueueList(!showQueueList);
  };

  if (!queueInfo && !lazyLoad) {
    return null;
  }

  if (!queueInfo) {
    return null;
  }

  const sectionClass = `queue-section queue-section-${prominence}`;
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

      {showFullSection && loadingInfo && !infoLoaded && (
        <div className="queue-loading">Loading related questions...</div>
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
            disabled={loadingQueue || loadingInfo}
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
                Not what you&apos;re looking for?{' '}
                <button
                  className="subtle-link-button"
                  onClick={handleExpandFullSection}
                  disabled={isSubmitting || loadingInfo}
                >
                  {loadingInfo ? 'Loading...' : 'Add your question to our queue'}
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
