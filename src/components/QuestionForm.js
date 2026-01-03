import React, { useState } from 'react';
import './QuestionForm.css';

function QuestionForm({ onSubmit, loading }) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(question);
      setQuestion('');
    }
  };

  return (
    <form className="question-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="question">Ask a question about Vedanta:</label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question here..."
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

