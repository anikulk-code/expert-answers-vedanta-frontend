import React, { useState, useEffect } from 'react';
import './TagsExplorer.css';

function TagsExplorer({ onSearch }) {
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [thumbnails, setThumbnails] = useState({}); // Map of videoId -> thumbnail URL

  const apiUrl = process.env.REACT_APP_API_URL || 'https://expertanswersapi-ege8htfcg5a0bgbk.westus2-01.azurewebsites.net';

  useEffect(() => {
    // Load tags on component mount
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setSearchQuery(''); // Clear search when selecting a tag
    setSearchResults([]); // Clear search results
    setIsSearching(false);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/tags/${encodeURIComponent(tag)}/questions`);
      if (!response.ok) {
        throw new Error('Failed to load questions');
      }
      const data = await response.json();
      console.log(`Loaded ${data.length} questions for tag "${tag}":`, data);
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

  // Extract video ID from YouTube URL
  const extractVideoId = (videoLink) => {
    if (!videoLink) return null;
    const baseUrl = videoLink.split('&t=')[0].split('#')[0]; // Remove timestamp and fragment
    const match = baseUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
    const videoId = match ? match[1] : null;
    if (videoId) {
      console.log(`Extracted video ID: ${videoId} from ${videoLink}`);
    }
    return videoId;
  };

  // Track which thumbnails are currently loading to avoid duplicate requests
  const loadingThumbnails = React.useRef(new Set());

  // Load thumbnail for a single video ID
  const loadThumbnail = React.useCallback(async (videoId) => {
    if (!videoId || thumbnails[videoId] || loadingThumbnails.current.has(videoId)) {
      return; // Already loaded or loading
    }

    loadingThumbnails.current.add(videoId);

    try {
      const response = await fetch(`${apiUrl}/api/thumbnails/${videoId}`);
      if (!response.ok) {
        console.warn(`Thumbnail API returned ${response.status} for ${videoId}`);
        return;
      }
      const data = await response.json();
      if (data && data.thumbnail) {
        setThumbnails(prev => ({ ...prev, [videoId]: data.thumbnail }));
      }
    } catch (err) {
      console.error(`Error loading thumbnail for ${videoId}:`, err);
    } finally {
      loadingThumbnails.current.delete(videoId);
    }
  }, [apiUrl, thumbnails]);

  // Load thumbnails for all visible items using Intersection Observer
  useEffect(() => {
    if (questions.length === 0 && searchResults.length === 0) {
      return;
    }

    // Wait for DOM to update, then observe
    const timeoutId = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const videoId = entry.target.dataset.videoId;
              if (videoId) {
                loadThumbnail(videoId);
                // Once we start loading, unobserve to avoid duplicate requests
                observer.unobserve(entry.target);
              }
            }
          });
        },
        {
          root: null,
          rootMargin: '100px', // Start loading 100px before item becomes visible
          threshold: 0.1
        }
      );

      // Observe all question items that don't have thumbnails yet
      const questionItems = document.querySelectorAll('.question-item[data-video-id]');
      questionItems.forEach((item) => {
        const videoId = item.dataset.videoId;
        if (videoId && !thumbnails[videoId] && !loadingThumbnails.current.has(videoId)) {
          observer.observe(item);
        }
      });

      return () => {
        questionItems.forEach((item) => observer.unobserve(item));
      };
    }, 100); // Small delay to ensure DOM is updated

    return () => {
      clearTimeout(timeoutId);
    };
  }, [questions, searchResults, loadThumbnail, thumbnails]);

  // Clear thumbnails when switching from search to tag view
  useEffect(() => {
    if (questions.length > 0 && searchResults.length === 0) {
      setThumbnails({});
      loadingThumbnails.current.clear();
    }
  }, [questions.length, searchResults.length]);

  // Clear thumbnails when switching from tag to search view
  useEffect(() => {
    if (searchResults.length > 0 && questions.length === 0) {
      setThumbnails({});
      loadingThumbnails.current.clear();
    }
  }, [questions.length, searchResults.length]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    // If onSearch prop is provided, use it (for main search page)
    if (onSearch) {
      onSearch(query);
      return;
    }
    
    // Otherwise, search within tags
    await performSearch(query);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearchSubmit(e);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Clear search results when input is cleared
    if (!value.trim()) {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const performSearch = async (query) => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setSearchQuery(query);
    setIsSearching(true);
    setLoading(true);
    setError(null);
    setSelectedTag(null);
    setSearchResults([]);
    
    try {
      const url = `${apiUrl}/api/tags/search?query=${encodeURIComponent(query)}`;
      console.log('Searching:', url);
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to search questions: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('Search results:', data.length, 'items');
      setSearchResults(data);
    } catch (err) {
      setError(err.message);
      console.error('Error searching questions:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  return (
    <div className="tags-explorer">
      <h2>Explore by Topic</h2>
      
      {/* Search form */}
      <form className="tags-search-form" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search by topic or keyword... (Press Enter to search)"
          className="tags-search-input"
        />
      </form>
      
      {/* Example queries for "Other" category */}
      {!selectedTag && (
        <div className="search-examples">
          <p className="examples-label">Try searching for:</p>
          <div className="example-queries">
            <button
              type="button"
              className="example-query"
              onClick={() => performSearch('Brahman')}
            >
              Brahman
            </button>
            <button
              type="button"
              className="example-query"
              onClick={() => performSearch('daily life')}
            >
              daily life
            </button>
            <button
              type="button"
              className="example-query"
              onClick={() => performSearch('relationships')}
            >
              relationships
            </button>
            <button
              type="button"
              className="example-query"
              onClick={() => performSearch('Ramakrishna')}
            >
              Ramakrishna
            </button>
            <button
              type="button"
              className="example-query"
              onClick={() => performSearch('ignorance')}
            >
              ignorance
            </button>
            <button
              type="button"
              className="example-query"
              onClick={() => performSearch('dharma')}
            >
              dharma
            </button>
          </div>
        </div>
      )}
      
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

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="questions-section">
          <h3>
            Search results for "{searchQuery}" ({searchResults.length})
            {loading && <span className="loading-inline">Loading...</span>}
          </h3>
          
          {error && (
            <div className="error-message">Error: {error}</div>
          )}

          <div className="questions-list">
            {searchResults.map((q, index) => {
              const videoLink = q.videoLink || '#';
              const timeStr = q.time && q.time !== '00:00:00' ? `&t=${timeToSeconds(q.time)}s` : '';
              const fullLink = videoLink !== '#' ? videoLink + timeStr : '#';
              const questionTitle = q.questionTitle || q.question || 'Untitled Question';
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
                            <path d="M8 5v14l11-7z"/>
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
        </div>
      )}

      {/* No search results message */}
      {!isSearching && !loading && searchQuery.trim() && searchResults.length === 0 && (
        <div className="questions-section">
          <div className="no-questions">No questions found for "{searchQuery}".</div>
        </div>
      )}

      {/* Selected tag results */}
      {selectedTag && !isSearching && (
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
                              <path d="M8 5v14l11-7z"/>
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

