import React, { useState, useEffect } from 'react';
import './TagsExplorer.css';

function TagsExplorer() {
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'https://expertanswersapi-ege8htfcg5a0bgbk.westus2-01.azurewebsites.net';

  useEffect(() => {
    // Load tags on component mount
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to load tags');
      }
      const data = await response.json();
      setTags(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = async (tag) => {
    if (selectedTag === tag) {
      // Deselect if clicking the same tag
      setSelectedTag(null);
      setQuestions([]);
      return;
    }

    setSelectedTag(tag);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/tags/${encodeURIComponent(tag)}/questions`);
      if (!response.ok) {
        throw new Error('Failed to load questions');
      }
      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const timeToSeconds = (timeStr) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  return (
    <div className="tags-explorer">
      <h2>Explore by Topic</h2>
      
      {loading && !selectedTag && (
        <div className="loading">Loading topics...</div>
      )}
      
      {error && (
        <div className="error-message">Error: {error}</div>
      )}

      {tags.length > 0 && (
        <div className="tags-container">
          {tags.map((tagInfo) => (
            <button
              key={tagInfo.tag}
              className={`tag-chip ${selectedTag === tagInfo.tag ? 'active' : ''}`}
              onClick={() => handleTagClick(tagInfo.tag)}
            >
              {tagInfo.tag}
              <span className="tag-count">({tagInfo.count})</span>
            </button>
          ))}
        </div>
      )}

      {selectedTag && (
        <div className="questions-section">
          <h3>
            Questions about "{selectedTag}"
            {loading && <span className="loading-inline">Loading...</span>}
          </h3>
          
          {error && (
            <div className="error-message">Error: {error}</div>
          )}

          {questions.length > 0 ? (
            <div className="questions-list">
              {questions.map((q, index) => (
                <div key={index} className="question-item">
                  <a
                    href={q.url + (q.timestamp && q.timestamp !== '00:00:00' ? `&t=${timeToSeconds(q.timestamp)}s` : '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="question-link"
                  >
                    {q.question}
                  </a>
                  <div className="question-meta">
                    <span className="video-title">{q.video_title}</span>
                    {q.timestamp && q.timestamp !== '00:00:00' && (
                      <span className="timestamp">{q.timestamp}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && (
            <div className="no-questions">No questions found for this topic.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default TagsExplorer;

