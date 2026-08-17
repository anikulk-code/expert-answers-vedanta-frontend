import React from 'react';
import './AnswerList.css';
import QueueSection from './QueueSection';

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

function AnswerCard({ answer, showRelatedLabel = false }) {
  const videoHref =
    answer.videoLink +
    (answer.time && answer.time !== '00:00:00'
      ? `&t=${timeToSeconds(answer.time)}s`
      : '');

  return (
    <div className="answer-card">
      <div className="answer-content">
        {answer.thumbnail && (
          <div className="thumbnail-container">
            <a
              href={videoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="thumbnail-link"
            >
              <img src={answer.thumbnail} alt="Video thumbnail" className="thumbnail" />
              <div className="play-icon-overlay">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </a>
          </div>
        )}
        <div className="answer-details">
          {showRelatedLabel && <span className="related-answer-label">Related</span>}
          {answer.questionTitle && <h3 className="question-title">{answer.questionTitle}</h3>}
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
  );
}

function AnswerList({
  answers,
  relatedQuestion,
  relatedQuestions,
  youtubeSearchResults,
  searchStatus,
  queueInfo,
  userMessage,
  currentQuestion,
  onRelatedQuestionClick,
  apiUrl,
}) {
  // Related-only: show answer cards when payloads are present (no second search).
  if (searchStatus === 'related_only') {
    const relatedAnswers = answers && answers.length > 0 ? answers : [];
    const relatedCount =
      relatedAnswers.length ||
      (relatedQuestions && relatedQuestions.length) ||
      0;

    if (relatedCount === 0) {
      return (
        <div className="answer-list">
          <div className="no-answers-message no-answers-message-strong">
            <h2 className="no-answers-title">No related Q&amp;A found</h2>
          </div>
          <QueueSection
            queueInfo={queueInfo}
            userQuestion={currentQuestion}
            apiUrl={apiUrl}
            prominence="very-prominent"
          />
        </div>
      );
    }

    return (
      <div className="answer-list">
        <div className="no-answers-message">
          <div className="answered-related-heading">
            <h2 className="no-answers-title">No direct answer found</h2>
            <span className="answered-related-badge">
              ✓ {relatedCount} related question{relatedCount === 1 ? '' : 's'} answered
            </span>
          </div>
          <p className="no-answers-hint">
            Here {relatedCount === 1 ? 'is a closely related answer' : 'are closely related answers'} from AskSwami.
          </p>
        </div>
        {relatedAnswers.length > 0 ? (
          relatedAnswers.map((answer, index) => (
            <AnswerCard key={index} answer={answer} showRelatedLabel />
          ))
        ) : (
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
        )}
        <QueueSection
          queueInfo={queueInfo}
          userQuestion={currentQuestion}
          apiUrl={apiUrl}
          prominence="prominent"
        />
      </div>
    );
  }

  // Handle YouTube search results (legacy status; not used by current API)
  if (searchStatus === 'youtube_search' && youtubeSearchResults && youtubeSearchResults.length > 0) {
    return (
      <div className="answer-list">
        {userMessage && (
          <div className="search-context">
            <p>{userMessage}</p>
          </div>
        )}
        <h2>Related Videos ({youtubeSearchResults.length})</h2>
        {youtubeSearchResults.map((answer, index) => (
          <AnswerCard key={index} answer={answer} />
        ))}
        <QueueSection
          queueInfo={queueInfo}
          userQuestion={currentQuestion}
          apiUrl={apiUrl}
          prominence="prominent"
        />
      </div>
    );
  }

  // Explicit no-match (and legacy tags_fallback)
  if (searchStatus === 'unanswered' || searchStatus === 'no_results' || searchStatus === 'tags_fallback') {
    return (
      <div className="answer-list">
        <div className="no-answers-message no-answers-message-strong">
          <h2 className="no-answers-title">No related Q&amp;A found</h2>
        </div>
        <QueueSection
          queueInfo={queueInfo}
          userQuestion={currentQuestion}
          apiUrl={apiUrl}
          prominence="very-prominent"
        />
      </div>
    );
  }

  // Normal Q&A results
  if (!answers || answers.length === 0) {
    return null;
  }

  const playlistId = answers[0].playlistId || null;

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
        <AnswerCard key={index} answer={answer} />
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

      {relatedQuestions && relatedQuestions.length > 0 && (
        <div className="related-question-section">
          <h3>Related questions</h3>
          <div className="related-questions-pills">
            {relatedQuestions.map((question, index) => (
              <button
                key={index}
                className="related-question-pill"
                onClick={() => onRelatedQuestionClick(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <QueueSection
        queueInfo={queueInfo}
        userQuestion={currentQuestion}
        apiUrl={apiUrl}
        prominence="subtle"
      />
    </div>
  );
}

export default AnswerList;
