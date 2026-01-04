import React, { useState } from 'react';
import './App.css';
import QuestionForm from './components/QuestionForm';
import AnswerList from './components/AnswerList';

// Dummy change for redeploy

function App() {
  const [answers, setAnswers] = useState([]);
  const [relatedQuestion, setRelatedQuestion] = useState(null);
  const [relatedQuestions, setRelatedQuestions] = useState(null);
  const [youtubeSearchResults, setYoutubeSearchResults] = useState(null);
  const [searchStatus, setSearchStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Searching...');
  const [error, setError] = useState(null);

  const handleQuestionSubmit = async (question) => {
    setLoading(true);
    setError(null);
    setRelatedQuestion(null);
    setRelatedQuestions(null);
    setYoutubeSearchResults(null);
    setSearchStatus(null);
    setLoadingMessage('Searching Q&A database...');
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const questionText = question.trim();
      
      if (!questionText) {
        throw new Error('Please enter a question');
      }
      
      // Step 1: Try Q&A matching
      const response = await fetch(
        `${apiUrl}/api/answers/v1?question=${encodeURIComponent(questionText)}&count=5`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch answers');
      }
      
      const data = await response.json();
      
      // If we have answers, we're done
      if (data.answers && data.answers.length > 0) {
        setAnswers(data.answers);
        setRelatedQuestion(data.relatedQuestion || null);
        setSearchStatus('qa_match');
        setLoading(false);
        return;
      }
      
      // Step 2: No Q&A matches - try related questions
      setLoadingMessage('Searching for related questions...');
      
      // The backend already handles this, but we can show the progress
      // Check if backend returned related questions
      if (data.relatedQuestions && data.relatedQuestions.length > 0) {
        setRelatedQuestions(data.relatedQuestions);
        setSearchStatus('related_questions');
        setLoading(false);
        return;
      }
      
      // Step 3: Related questions also failed - try YouTube search
      setLoadingMessage('Searching related talks...');
      
      // Backend should have done YouTube search, check results
      if (data.youtubeSearchResults && data.youtubeSearchResults.length > 0) {
        setYoutubeSearchResults(data.youtubeSearchResults);
        setSearchStatus('youtube_search');
        setLoading(false);
        return;
      }
      
      // Step 4: No results found
      setSearchStatus('no_results');
      setLoading(false);
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching answers:', err);
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Vedanta Answers</h1>
        <p>Get answers from YouTube videos by Swami Sarvapriyananda</p>
        <div className="trust-badge">
          <span className="trust-badge-text">Source: Official YouTube talks</span>
        </div>
      </header>
      
      <main className="App-main">
        <QuestionForm onSubmit={handleQuestionSubmit} loading={loading} />
        
        {loading && (
          <div className="loading-message">
            {loadingMessage}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}
        
        {(answers.length > 0 || relatedQuestions || youtubeSearchResults || searchStatus === 'no_results') && (
          <AnswerList 
            answers={answers} 
            relatedQuestion={relatedQuestion}
            relatedQuestions={relatedQuestions}
            youtubeSearchResults={youtubeSearchResults}
            searchStatus={searchStatus}
            onRelatedQuestionClick={handleQuestionSubmit}
          />
        )}
      </main>
    </div>
  );
}

export default App;

