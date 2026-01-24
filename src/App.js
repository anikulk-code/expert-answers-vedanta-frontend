import React, { useState, useEffect } from 'react';
import './App.css';
import QuestionForm from './components/QuestionForm';
import AnswerList from './components/AnswerList';
import TagsExplorer from './components/TagsExplorer';
import SearchDebug from './components/SearchDebug';
import ProgressBar from './components/ProgressBar';

// Dummy change to trigger rebuild

function App() {
  // Check if debug view should be shown
  // Controlled by REACT_APP_ENABLE_DEBUG environment variable
  // Set to 'true' to show, 'false' or unset to hide
  const showDebug = process.env.REACT_APP_ENABLE_DEBUG === 'true';
  
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'explore', or 'debug'
  
  // Reset to 'search' tab if debug is selected but debug is disabled
  useEffect(() => {
    if (activeTab === 'debug' && !showDebug) {
      setActiveTab('search');
    }
  }, [activeTab, showDebug]);
  const [answers, setAnswers] = useState([]);
  const [relatedQuestion, setRelatedQuestion] = useState(null);
  const [relatedQuestions, setRelatedQuestions] = useState(null);
  const [youtubeSearchResults, setYoutubeSearchResults] = useState(null);
  const [searchStatus, setSearchStatus] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);
  const [userMessage, setUserMessage] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
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
    setQueueInfo(null);
    setUserMessage(null);
    setCurrentQuestion(question);
    setLoadingMessage('Searching Q&A database...');
    
    try {
      const questionText = question.trim();
      
      if (!questionText) {
        throw new Error('Please enter a question');
      }
      
      // Step 1: Try Q&A matching
      // Default to Azure backend, override with .env file for local development
      const apiUrl = process.env.REACT_APP_API_URL 
        ? process.env.REACT_APP_API_URL 
        : 'https://expertanswersapi-ege8htfcg5a0bgbk.westus2-01.azurewebsites.net';
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout (GPT-4o can be slow)
      
      console.log('Making API request to:', `${apiUrl}/api/answers/v1?question=${encodeURIComponent(questionText)}&count=5`);
      
      let response;
      try {
        response = await fetch(
          `${apiUrl}/api/answers/v1?question=${encodeURIComponent(questionText)}&count=5`,
          { 
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            }
          }
        );
        clearTimeout(timeoutId);
        console.log('API response status:', response.status);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Fetch error:', error);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out after 90 seconds. The search is taking longer than expected. Please try again or check your connection.');
        }
        throw new Error(`Network error: ${error.message}. Please check your internet connection and try again.`);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch answers';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Capture queueInfo and userMessage from API response
      setQueueInfo(data.queueInfo || null);
      setUserMessage(data.userMessage || null);
      
      // If we have answers, we're done
      if (data.answers && data.answers.length > 0) {
        setAnswers(data.answers);
        setRelatedQuestion(data.relatedQuestion || null);
        setSearchStatus('qa_match');
        setLoading(false);
        return;
      }
      
      // Step 2: No Q&A matches - show related questions and upvoting
      // Backend returns queueInfo with similar questions for upvoting
      setSearchStatus('no_results');
      setLoading(false);
      
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Error fetching answers:', err);
      setLoading(false);
      setLoadingMessage('');
      setAnswers([]);
      setSearchStatus(null);
      setQueueInfo(null);
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
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
          <button
            className={`tab-button ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            Explore by Topic
          </button>
          {showDebug && (
            <button
              className={`tab-button ${activeTab === 'debug' ? 'active' : ''}`}
              onClick={() => setActiveTab('debug')}
            >
              Debug Search
            </button>
          )}
        </div>

        {activeTab === 'search' && (
          <>
            <QuestionForm onSubmit={handleQuestionSubmit} loading={loading} />
            
            <ProgressBar loading={loading} message={loadingMessage} />
            
            {error && (
              <div className="error-message">
                Error: {error}
              </div>
            )}
            
            {(answers.length > 0 || relatedQuestions || youtubeSearchResults || searchStatus === 'no_results' || queueInfo) && (
              <AnswerList 
                answers={answers} 
                relatedQuestion={relatedQuestion}
                relatedQuestions={relatedQuestions}
                youtubeSearchResults={youtubeSearchResults}
                searchStatus={searchStatus}
                queueInfo={queueInfo}
                userMessage={userMessage}
                currentQuestion={currentQuestion}
                onRelatedQuestionClick={handleQuestionSubmit}
                apiUrl={process.env.REACT_APP_API_URL || 'https://expertanswersapi-ege8htfcg5a0bgbk.westus2-01.azurewebsites.net'}
              />
            )}
          </>
        )}

              {activeTab === 'explore' && (
                <TagsExplorer onSearch={handleQuestionSubmit} />
              )}

              {showDebug && activeTab === 'debug' && (
                <SearchDebug 
                  apiUrl={process.env.REACT_APP_API_URL || 'https://expertanswersapi-ege8htfcg5a0bgbk.westus2-01.azurewebsites.net'}
                />
              )}
      </main>
    </div>
  );
}

export default App;

