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
  const [expandedFromSubtle, setExpandedFromSubtle] = useState(false);

  useEffect(() => {
    setQueueInfo(initialQueueInfo || EMPTY_QUEUE_INFO);
    setShowSimilar(false);
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
        setMessage({ type: 'success', text: 'Requested. We will use upvotes to decide what to cover next.' });
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to request question' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error requesting question. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequest = async () => {
    setMessage(null);
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

    await submitQuestion();
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
        setMessage({ type: 'success', text: `Upvoted. Total: ${data.upvotes}` });
        setQueueInfo((prev) => {
          if (!prev) return prev;
          const similarQuestions = (prev.similarQuestions || []).map((sq) =>
            sq.question === question ? { ...sq, upvotes: data.upvotes } : sq
          );
          return { ...prev, similarQuestions };
        });
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to upvote' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error upvoting. Please try again.' });
    }
  };

  const others = otherSimilarQuestions(queueInfo, userQuestion);
  const isSubtle = prominence === 'subtle' && !expandedFromSubtle;
  const busy = loadingInfo || isSubmitting;

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
            {busy ? 'Checking...' : 'Request this question'}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className={`queue-section queue-section-${prominence}`}>
      {queueInfo.questionInQueue && (
        <div className="queue-status success">
          Requested · {queueInfo.upvotes} upvote{queueInfo.upvotes === 1 ? '' : 's'}
        </div>
      )}

      {message && (
        <div className={`queue-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {loadingInfo && <div className="queue-loading">Checking for similar requests...</div>}

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

      {!queueInfo.questionInQueue && !showSimilar && (
        <button
          className="request-question-button"
          onClick={handleRequest}
          disabled={busy || !userQuestion?.trim()}
        >
          {busy ? 'Checking...' : 'Request this question'}
        </button>
      )}
    </div>
  );
}

export default QueueSection;
