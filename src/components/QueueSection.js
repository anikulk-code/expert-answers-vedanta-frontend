import React, { useEffect, useState } from 'react';
import './QueueSection.css';

const EMPTY_QUEUE_INFO = {
  questionInQueue: false,
  upvotes: 0,
  similarQuestions: null,
  canPostNewQuestion: true,
};

function otherSimilarQuestions(queueInfo, userQuestion) {
  const similar = queueInfo?.similarQuestions || [];
  const own = (userQuestion || '').trim().toLowerCase();
  return similar.filter((sq) => (sq.question || '').trim().toLowerCase() !== own);
}

function QueueSection({
  queueInfo: initialQueueInfo,
  userQuestion,
  apiUrl,
  prominence = 'prominent',
}) {
  const [queueInfo, setQueueInfo] = useState(initialQueueInfo || EMPTY_QUEUE_INFO);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSimilar, setShowSimilar] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [queueQuestions, setQueueQuestions] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [expandedFromSubtle, setExpandedFromSubtle] = useState(false);

  useEffect(() => {
    setQueueInfo(initialQueueInfo || EMPTY_QUEUE_INFO);
    setShowSimilar(false);
    setShowConfirm(false);
    setShowQueue(false);
    setQueueQuestions([]);
    setExpandedFromSubtle(false);
    setMessage(null);
  }, [initialQueueInfo, userQuestion]);

  const fetchQueueInfo = async () => {
    if (!userQuestion || !apiUrl) {
      return null;
    }

    setLoadingInfo(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/answers/v1/queue-info?question=${encodeURIComponent(userQuestion)}`,
        { headers: { Accept: 'application/json' } }
      );

      if (!response.ok) {
        setMessage({ type: 'error', text: 'Failed to check similar questions' });
        return null;
      }

      const data = await response.json();
      setQueueInfo(data);
      return data;
    } catch (error) {
      setMessage({ type: 'error', text: 'Error checking similar questions. Please try again.' });
      return null;
    } finally {
      setLoadingInfo(false);
    }
  };

  const submitQuestion = async () => {
    if (!userQuestion?.trim()) {
      setMessage({ type: 'error', text: 'Please enter a question' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiUrl}/api/questions/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQuestion.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setQueueInfo((prev) => ({
          ...(prev || EMPTY_QUEUE_INFO),
          questionInQueue: true,
          upvotes: data.upvotes ?? prev?.upvotes ?? 1,
          similarQuestions: null,
        }));
        setShowSimilar(false);
        setShowConfirm(false);
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to request question' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error requesting question. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleQueue = async () => {
    if (showQueue) {
      setShowQueue(false);
      return;
    }
    if (queueQuestions.length > 0) {
      setShowQueue(true);
      return;
    }

    setLoadingQueue(true);
    try {
      const response = await fetch(`${apiUrl}/api/questions/queue?limit=10&sort_by=upvotes`);
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', text: data.detail || 'Failed to load requested questions' });
        return;
      }
      const own = (userQuestion || '').trim().toLowerCase();
      setQueueQuestions(
        (data.questions || []).filter(
          (item) => (item.question || '').trim().toLowerCase() !== own
        )
      );
      setShowQueue(true);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading requested questions. Please try again.' });
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleRequest = async () => {
    setMessage(null);

    const trimmed = (userQuestion || '').trim();
    if (trimmed.length < 10) {
      setMessage({
        type: 'error',
        text: 'Please write out your question a little more fully before requesting it.',
      });
      return;
    }

    const data = await fetchQueueInfo();
    const others = otherSimilarQuestions(data || queueInfo, userQuestion);

    if (data?.questionInQueue) {
      setShowSimilar(false);
      return;
    }

    if (others.length > 0) {
      setShowSimilar(true);
      return;
    }

    // Let the user see exactly what will be posted before it goes public.
    setShowConfirm(true);
  };

  const handleUpvote = async (question) => {
    try {
      const response = await fetch(`${apiUrl}/api/questions/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(null);
        setQueueInfo((prev) => {
          if (!prev) return prev;
          const similarQuestions = (prev.similarQuestions || []).map((sq) =>
            sq.question === question ? { ...sq, upvotes: data.upvotes } : sq
          );
          return { ...prev, similarQuestions };
        });
        setQueueQuestions((prev) => prev.map((item) =>
          item.question === question ? { ...item, voteUp: data.upvotes, upvotes: data.upvotes } : item
        ));
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to upvote' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error upvoting. Please try again.' });
    }
  };

  const others = otherSimilarQuestions(queueInfo, userQuestion);
  const isSubtle = prominence === 'subtle' && !expandedFromSubtle;
  const busy = loadingInfo || isSubmitting || loadingQueue;

  if (isSubtle) {
    return (
      <div className="queue-section queue-section-subtle">
        <p className="subtle-text">
          Not what you&apos;re looking for?{' '}
          <button
            className="subtle-link-button"
            onClick={() => {
              setExpandedFromSubtle(true);
              handleRequest();
            }}
            disabled={busy}
          >
            {busy ? 'Checking...' : 'Request this exact question'}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className={`queue-section queue-section-${prominence}`}>
      {queueInfo.questionInQueue && (
        <div className="queue-submitted">
          <div className="queue-submitted-message">✓ Your question was submitted.</div>
          <button className="browse-queue-button" onClick={toggleQueue} disabled={loadingQueue}>
            {loadingQueue ? 'Loading...' : showQueue ? 'Hide other upvoted questions' : 'See other upvoted questions'}
          </button>
        </div>
      )}

      {message && (
        <div className={`queue-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {loadingInfo && <div className="queue-loading">Checking for similar requests...</div>}

      {queueInfo.questionInQueue && showQueue && (
        <div className="queue-list submitted-queue-list">
          {queueQuestions.length > 0 ? queueQuestions.map((item, index) => (
            <div key={item.id || index} className="question-item">
              <div className="question-text">{item.question}</div>
              <button
                className="upvote-button"
                onClick={() => handleUpvote(item.question)}
                disabled={busy}
                aria-label={`Upvote: ${item.question}`}
              >
                <span>👍</span>
                <span className="upvote-count">
                  {item.voteUp ?? item.votes ?? item.upvotes ?? 0}
                </span>
              </button>
            </div>
          )) : (
            <div className="queue-empty">No other requested questions yet.</div>
          )}
        </div>
      )}

      {showConfirm && !queueInfo.questionInQueue && (
        <div className="request-confirm">
          <h3>Submit this question as written?</h3>
          <blockquote className="request-confirm-question">{(userQuestion || '').trim()}</blockquote>
          <p className="request-confirm-note">
            It will appear on the public requested-questions list for others to upvote.
          </p>
          <div className="request-confirm-actions">
            <button
              className="request-question-button"
              onClick={submitQuestion}
              disabled={busy}
            >
              {isSubmitting ? 'Submitting…' : 'Submit request'}
            </button>
            <button
              className="request-cancel-button"
              onClick={() => setShowConfirm(false)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showSimilar && others.length > 0 && !queueInfo.questionInQueue && (
        <div className="similar-questions">
          <h3>A similar request already exists. Upvote it instead?</h3>
          {others.map((sq, index) => (
            <div key={index} className="question-item">
              <div className="question-text">{sq.question}</div>
              <button
                className="upvote-button"
                onClick={() => handleUpvote(sq.question)}
                disabled={busy}
                aria-label={`Upvote: ${sq.question}`}
              >
                <span>👍</span>
                <span className="upvote-count">{sq.upvotes}</span>
              </button>
            </div>
          ))}
          <button
            className="request-anyway-button"
            onClick={submitQuestion}
            disabled={busy}
          >
            Request mine anyway
          </button>
        </div>
      )}

      {!queueInfo.questionInQueue && !showSimilar && !showConfirm && (
        <button
          className="request-question-button"
          onClick={handleRequest}
          disabled={busy || !userQuestion?.trim()}
        >
          {busy ? 'Checking...' : 'Request this exact question'}
        </button>
      )}
    </div>
  );
}

export default QueueSection;
