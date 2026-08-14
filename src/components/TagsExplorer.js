import React, { useState, useEffect, useCallback, useRef } from 'react';
import './TagsExplorer.css';

function TagsExplorer() {
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [thumbnails, setThumbnails] = useState({});

  const apiUrl = process.env.REACT_APP_API_URL || 'https://expertanswersapi-ege8htfcg5a0bgbk.westus2-01.azurewebsites.net';
  const loadingThumbnails = useRef(new Set());

  useEffect(() => {
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

    loadTags();
  }, [apiUrl]);

  const handleTagClick = async (tag) => {
    if (selectedTag === tag) {
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
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const extractVideoId = (videoLink) => {
    if (!videoLink) return null;
    const baseUrl = videoLink.split('&t=')[0].split('#')[0];
    const match = baseUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
    return match ? match[1] : null;
  };

  const loadThumbnail = useCallback(async (videoId) => {
    if (!videoId || thumbnails[videoId] || loadingThumbnails.current.has(videoId)) {
      return;
    }

    loadingThumbnails.current.add(videoId);

    try {
      const response = await fetch(`${apiUrl}/api/thumbnails/${videoId}`);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (data && data.thumbnail) {
        setThumbnails((prev) => ({ ...prev, [videoId]: data.thumbnail }));
      }
    } catch (err) {
      console.error(`Error loading thumbnail for ${videoId}:`, err);
    } finally {
      loadingThumbnails.current.delete(videoId);
    }
  }, [apiUrl, thumbnails]);

  useEffect(() => {
    if (questions.length === 0) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const videoId = entry.target.dataset.videoId;
              if (videoId) {
                loadThumbnail(videoId);
                observer.unobserve(entry.target);
              }
            }
          });
        },
        {
          root: null,
          rootMargin: '100px',
          threshold: 0.1,
        }
      );

      const questionItems = document.querySelectorAll('.question-item[data-video-id]');
      questionItems.forEach((item) => {
        const videoId = item.dataset.videoId;
        if (videoId && !thumbnails[videoId] && !loadingThumbnails.current.has(videoId)) {
          observer.observe(item);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [questions, loadThumbnail, thumbnails]);

  useEffect(() => {
    setThumbnails({});
    loadingThumbnails.current.clear();
  }, [selectedTag]);

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
            Questions about &quot;{selectedTag}&quot;
            {loading && <span className="loading-inline">Loading...</span>}
          </h3>

          {questions.length > 0 ? (
            <div className="questions-list">
              {questions.map((q, index) => {
                const videoLink = q.videoLink || '#';
                const timeStr = q.time && q.time !== '00:00:00' ? `&t=${timeToSeconds(q.time)}s` : '';
                const fullLink = videoLink !== '#' ? videoLink + timeStr : '#';
                const questionTitle = q.questionTitle || 'Untitled Question';
                const videoId = extractVideoId(q.videoLink);
                const thumbnail = videoId ? thumbnails[videoId] : null;

                return (
                  <div
                    key={index}
                    className="question-item"
                    data-video-id={videoId || ''}
                  >
                    {thumbnail && (
                      <div className="thumbnail-container">
                        <a
                          href={fullLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="thumbnail-link"
                        >
                          <img
                            src={thumbnail}
                            alt="Video thumbnail"
                            className="thumbnail"
                          />
                          <div className="play-icon-overlay">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </a>
                      </div>
                    )}
                    <div className="question-content">
                      <a
                        href={fullLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="question-link"
                      >
                        {questionTitle}
                      </a>
                      <div className="question-meta">
                        {q.time && q.time !== '00:00:00' && (
                          <span className="timestamp">{q.time}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
