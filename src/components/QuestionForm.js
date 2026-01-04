import React, { useState } from 'react';
import './QuestionForm.css';

function QuestionForm({ onSubmit, loading }) {
  const [question, setQuestion] = useState('');

  const placeholderQuestions = [
    "Why should I care about spirituality?",
    "What is the nature of consciousness?",
    "How does Vedanta view suffering?",
    "Does Vedanta promote indifference to social problems?"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(question);
      // Keep the question in the input field
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (but allow Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (question.trim()) {
        onSubmit(question);
      }
    }
  };

  const handlePlaceholderClick = (placeholderQuestion) => {
    setQuestion(placeholderQuestion);
    onSubmit(placeholderQuestion);
  };

  return (
    <form className="question-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="question">Ask a question:</label>
        <div className="placeholder-questions">
          {placeholderQuestions.map((pq, index) => (
            <button
              key={index}
              type="button"
              className="placeholder-question"
              onClick={() => handlePlaceholderClick(pq)}
              disabled={loading}
            >
              {pq}
            </button>
          ))}
        </div>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your question here... (Press Enter to submit, Shift+Enter for new line)"
          rows="4"
          disabled={loading}
        />
      </div>
      <button type="submit" disabled={loading || !question.trim()}>
        {loading ? 'Searching...' : 'Get Answers'}
      </button>
    </form>
  );
}

export default QuestionForm;

