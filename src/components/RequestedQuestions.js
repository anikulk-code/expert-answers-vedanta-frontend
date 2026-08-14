import React, { useState } from 'react';
import './QueueSection.css';
import './RequestedQuestions.css';

function RequestedQuestions({ apiUrl }) {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/questions/queue?limit=20&sort_by=upvotes`, {
        headers: { Accept: 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Failed to load requested questions');
        return;
      }
      setQuestions(data.questions || []);
    } catch (err) {
      setError('Error loading requested questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (questions.length === 0) {
      await loadQueue();
    }
  };

  const handleUpvote = async (question) => {
    try {
      const response = await fetch(`${apiUrl}/api/questions/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Failed to upvote');
        return;
      }
      setQuestions((prev) =>
        prev.map((item) =>
          item.question === question
            ? { ...item, voteUp: data.upvotes, upvotes: data.upvotes }
            : item
        )
      );
    } catch (err) {
      setError('Error upvoting. Please try again.');
    }
  };

  return (
    <div className="requested-questions">
      <button type="button" className="requested-questions-toggle" onClick={handleToggle}>
        {open ? 'Hide requested questions' : 'See requested questions'}
      </button>
      {open && (
        <div className="requested-questions-list">
          {loading && <div className="queue-loading">Loading requested questions...</div>}
          {error && <div className="queue-message error">{error}</div>}
          {!loading && questions.length > 0 &&
            questions.map((item, index) => (
              <div key={item.id || index} className="question-item">
                <div className="question-text">{item.question || item.questionText}</div>
                <button
                  type="button"
                  className="upvote-button"
                  onClick={() => handleUpvote(item.question || item.questionText)}
                >
                  <span>👍</span>
                  <span className="upvote-count">
                    {item.voteUp ?? item.votes ?? item.upvotes ?? 0}
                  </span>
                </button>
              </div>
            ))}
          {!loading && !error && questions.length === 0 && (
            <div className="queue-empty">No requested questions yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default RequestedQuestions;
