import React from 'react';
import './AnswerList.css';

// Convert timestamp (HH:MM:SS or MM:SS) to seconds
function timeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function AnswerList({ answers, relatedQuestion, relatedQuestions, youtubeSearchResults, searchStatus, onRelatedQuestionClick }) {
  // Handle related questions fallback
  if (searchStatus === 'related_questions' && relatedQuestions && relatedQuestions.length > 0) {
    return (
      <div className="answer-list">
        <div className="no-answers-message">
          <p>We couldn't find a direct answer to your question in our Q&A database.</p>
          <p className="suggestions-label">Try these related questions:</p>
          <div className="related-questions-pills">
            {relatedQuestions.map((q, index) => (
              <button
                key={index}
                className="related-question-pill"
                onClick={() => onRelatedQuestionClick(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle YouTube search results
  if (searchStatus === 'youtube_search' && youtubeSearchResults && youtubeSearchResults.length > 0) {
    return (
      <div className="answer-list">
        <div className="search-context">
          <p>No Q&A match found. Here are related videos:</p>
        </div>
        <h2>Related Videos ({youtubeSearchResults.length})</h2>
        {youtubeSearchResults.map((answer, index) => (
          <div key={index} className="answer-card youtube-search-result">
            <div className="answer-content">
              {answer.thumbnail && (
                <div className="thumbnail-container">
                  <a 
                    href={answer.videoLink + (answer.time && answer.time !== '00:00:00' ? `&t=${timeToSeconds(answer.time)}s` : '')}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="thumbnail-link"
                  >
                    <img 
                      src={answer.thumbnail} 
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
              <div className="answer-details">
                {answer.questionTitle && (
                  <h3 className="question-title">{answer.questionTitle}</h3>
                )}
                <div className="answer-header">
                  {answer.videoLink && (
                    <a 
                      href={answer.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="full-video-link"
                    >
                      View Full Video
                    </a>
                  )}
                  {answer.date && answer.date !== '2024-01-01' && (
                    <span className="date">{answer.date}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle no results
  if (searchStatus === 'no_results') {
    return (
      <div className="answer-list">
        <div className="no-answers-message">
          <p>No results found. Try rephrasing your question or browse the playlist.</p>
        </div>
      </div>
    );
  }

  // Normal Q&A results
  if (!answers || answers.length === 0) {
    return null;
  }

  // Get playlist ID from first answer (all should be from same playlist)
  const playlistId = answers.length > 0 ? answers[0].playlistId : null;

  return (
    <div className="answer-list">
      <div className="answer-list-header">
        <h2>Answers ({answers.length})</h2>
        {playlistId && (
          <a 
            href={`https://www.youtube.com/playlist?list=${playlistId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="playlist-link-header"
          >
            View Full Playlist
          </a>
        )}
      </div>
      {answers.map((answer, index) => (
        <div key={index} className="answer-card">
          <div className="answer-content">
            {answer.thumbnail && (
              <div className="thumbnail-container">
                <a 
                  href={answer.videoLink + (answer.time && answer.time !== '00:00:00' ? `&t=${timeToSeconds(answer.time)}s` : '')}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="thumbnail-link"
                >
                  <img 
                    src={answer.thumbnail} 
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
            <div className="answer-details">
              {answer.questionTitle && (
                <h3 className="question-title">{answer.questionTitle}</h3>
              )}
              <div className="answer-header">
                {answer.videoLink && (
                  <a 
                    href={answer.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="full-video-link"
                  >
                    View Full Video
                  </a>
                )}
                {answer.date && answer.date !== '2024-01-01' && (
                  <span className="date">{answer.date}</span>
                )}
              </div>
              {answer.region && (
                <div className="region">Region: {answer.region}</div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {relatedQuestion && (
        <div className="related-question-section">
          <h3>Explore Next</h3>
          <button 
            className="related-question-button"
            onClick={() => onRelatedQuestionClick(relatedQuestion)}
          >
            {relatedQuestion}
          </button>
        </div>
      )}
    </div>
  );
}

export default AnswerList;

