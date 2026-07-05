import React, { useState, useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import QuestionForm from './components/QuestionForm';
import AnswerList from './components/AnswerList';
import TagsExplorer from './components/TagsExplorer';
import SearchDebug from './components/SearchDebug';
import ProgressBar from './components/ProgressBar';
import GitaRoutes from './components/gita/GitaRoutes';
import GospelRoutes from './components/gospel/GospelRoutes';
import { usePrecannedAnswers } from './context/PrecannedAnswersContext';
import { getPrecannedResponse } from './utils/precannedAnswers';

function App() {
  const showDebug = process.env.REACT_APP_ENABLE_DEBUG === 'true';
  const location = useLocation();
  const navigate = useNavigate();

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
  const { responsesByQuestion } = usePrecannedAnswers();

  const activeTab = location.pathname.startsWith('/gospel')
    ? 'gospel'
    : location.pathname.startsWith('/gita')
      ? 'gita'
      : location.pathname.startsWith('/explore')
        ? 'explore'
        : location.pathname.startsWith('/debug')
          ? 'debug'
          : 'search';

  useEffect(() => {
    if (activeTab === 'debug' && !showDebug) {
      navigate('/', { replace: true });
    }
  }, [activeTab, showDebug, navigate]);

  const apiUrl = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL
    : 'https://expertanswersapi-ege8htfcg5a0bgbk.westus2-01.azurewebsites.net';

  const applyAnswerPayload = (data, question) => {
    setQueueInfo(data.queueInfo || null);
    setUserMessage(data.userMessage || null);

    if (data.answers && data.answers.length > 0) {
      setAnswers(data.answers);
      setRelatedQuestion(data.relatedQuestion || null);
      setSearchStatus('qa_match');
      return;
    }

    setAnswers([]);
    setRelatedQuestion(null);
    setSearchStatus('no_results');
  };

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

    try {
      const questionText = question.trim();

      if (!questionText) {
        throw new Error('Please enter a question');
      }

      const precanned = getPrecannedResponse(questionText, responsesByQuestion);
      if (precanned) {
        applyAnswerPayload(precanned, questionText);
        setLoading(false);
        return;
      }

      setLoadingMessage('Searching Q&A database...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      let response;
      try {
        response = await fetch(
          `${apiUrl}/api/answers/v1?question=${encodeURIComponent(questionText)}&count=5`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          }
        );
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(
            'Request timed out after 90 seconds. The search is taking longer than expected. Please try again or check your connection.'
          );
        }
        throw new Error(
          `Network error: ${fetchError.message}. Please check your internet connection and try again.`
        );
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
      applyAnswerPayload(data, questionText);
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

  const searchPanel = (
    <>
      <QuestionForm onSubmit={handleQuestionSubmit} loading={loading} />
      <ProgressBar loading={loading} message={loadingMessage} />
      {error && <div className="error-message">Error: {error}</div>}
      {(answers.length > 0 ||
        relatedQuestions ||
        youtubeSearchResults ||
        searchStatus === 'no_results' ||
        queueInfo) && (
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
          apiUrl={apiUrl}
        />
      )}
    </>
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>Vedanta Answers</h1>
        <p>Get answers from YouTube videos by Swami Sarvapriyananda</p>
        <div className="trust-badge">
          <a
            href="https://www.youtube.com/playlist?list=PLDqahtm2vA70VohJ__IobJSOGFJ2SdaRO"
            target="_blank"
            rel="noopener noreferrer"
            className="trust-badge-text"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Source: AskSwami Q&A | Swami Sarvapriyananda
          </a>
        </div>
      </header>

      <main className="App-main">
        <div className="tabs">
          <Link
            to="/"
            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          >
            Search
          </Link>
          <Link
            to="/explore"
            className={`tab-button ${activeTab === 'explore' ? 'active' : ''}`}
          >
            Explore by Topic
          </Link>
          <Link
            to="/gita"
            className={`tab-button ${activeTab === 'gita' ? 'active' : ''}`}
          >
            Gita
          </Link>
          <Link
            to="/gospel"
            className={`tab-button ${activeTab === 'gospel' ? 'active' : ''}`}
          >
            Gospel
          </Link>
          {showDebug && (
            <Link
              to="/debug"
              className={`tab-button ${activeTab === 'debug' ? 'active' : ''}`}
            >
              Debug Search
            </Link>
          )}
        </div>

        <Routes>
          <Route path="/gita/*" element={<GitaRoutes />} />
          <Route path="/gospel/*" element={<GospelRoutes />} />
          <Route path="/explore" element={<TagsExplorer onSearch={handleQuestionSubmit} />} />
          <Route
            path="/debug"
            element={
              showDebug ? (
                <SearchDebug apiUrl={apiUrl} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/" element={searchPanel} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
