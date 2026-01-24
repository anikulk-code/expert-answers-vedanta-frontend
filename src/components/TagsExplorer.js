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
            {searchResults.map((q, index) => (
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
                  {q.primary_tag && (
                    <span className="question-tag">{q.primary_tag}</span>
                  )}
                </div>
              </div>
            ))}
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

