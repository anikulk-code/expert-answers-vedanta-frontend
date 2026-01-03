import React, { useState } from 'react';
import './App.css';
import QuestionForm from './components/QuestionForm';
import AnswerList from './components/AnswerList';

function App() {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuestionSubmit = async (question) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/answers?topic=Vedanta&author=Sarvapriyananda&count=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch answers');
      }
      
      const data = await response.json();
      setAnswers(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching answers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Expert Answers - Vedanta</h1>
        <p>Get answers from YouTube videos by Sarvapriyananda</p>
      </header>
      
      <main className="App-main">
        <QuestionForm onSubmit={handleQuestionSubmit} loading={loading} />
        
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}
        
        {answers.length > 0 && (
          <AnswerList answers={answers} />
        )}
      </main>
    </div>
  );
}

export default App;

