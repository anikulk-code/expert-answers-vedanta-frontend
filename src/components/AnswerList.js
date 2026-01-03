import React from 'react';
import './AnswerList.css';

function AnswerList({ answers }) {
  if (!answers || answers.length === 0) {
    return (
      <div className="no-answers">
        No answers found. Try a different question.
      </div>
    );
  }

  return (
    <div className="answer-list">
      <h2>Answers ({answers.length})</h2>
      {answers.map((answer, index) => (
        <div key={index} className="answer-card">
          <div className="answer-header">
            <span className="speaker">{answer.speakers}</span>
            <span className="date">{answer.date}</span>
          </div>
          <div className="video-link">
            <a 
              href={answer.videoLink} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Watch Video
              {answer.time && ` (${answer.time})`}
            </a>
          </div>
          {answer.region && (
            <div className="region">Region: {answer.region}</div>
          )}
          {answer.score && (
            <div className="score">Score: {answer.score}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default AnswerList;

