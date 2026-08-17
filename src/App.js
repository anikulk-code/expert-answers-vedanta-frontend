import React, { useState, useEffect, useRef } from 'react';
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
import RequestedQuestions from './components/RequestedQuestions';
import { useRequestQueue } from './hooks/useRequestQueue';

function App() {
  const showDebug = process.env.REACT_APP_ENABLE_DEBUG === 'true';
  const location = useLocation();
  const navigate = useNavigate();
  const { requestsEnabled, withParams } = useRequestQueue();

  const [answers, setAnswers] = useState([]);
  const [relatedQuestion, setRelatedQuestion] = useState(null);
  const [relatedQuestions, setRelatedQuestions] = useState(null);
  const [relatedAnswers, setRelatedAnswers] = useState([]);
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

  // Per-route document titles (verse/chapter detail derived from the path so the
  // Gita/Gospel components stay untouched).
  useEffect(() => {
    const path = location.pathname;
    let title = 'Vedanta Answers';
    const gitaMatch = path.match(/^\/gita\/(\d+)(?:\/(\d+))?/);
    const gospelMatch = path.match(/^\/gospel\/(\d+)/);
    if (gitaMatch) {
      title = gitaMatch[2]
        ? `Gita ${gitaMatch[1]}.${gitaMatch[2]} · Vedanta Answers`
        : `Gita Chapter ${gitaMatch[1]} · Vedanta Answers`;
    } else if (path.startsWith('/gita')) {
      title = 'Bhagavad Gita · Vedanta Answers';
    } else if (gospelMatch) {
      title = `Gospel Chapter ${gospelMatch[1]} · Vedanta Answers`;
    } else if (path.startsWith('/gospel')) {
      title = 'Gospel of Sri Ramakrishna · Vedanta Answers';
    } else if (path.startsWith('/explore')) {
      title = 'Explore by Topic · Vedanta Answers';
    }
    document.title = title;
  }, [location.pathname]);

  const resultsRef = useRef(null);

  // When a search finishes, bring the results into view without losing the
  // question box (scroll-margin keeps context above the results).
  useEffect(() => {
    if (!loading && searchStatus && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, searchStatus]);

  const apiUrl = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL
    : 'https://expertanswersapi-ege8htfcg5a0bgbk.westus2-01.azurewebsites.net';

  const applyAnswerPayload = (data) => {
    setUserMessage(data.userMessage || null);
    setRelatedQuestions(data.relatedQuestions || null);
    setRelatedAnswers(data.relatedAnswers || []);
    setYoutubeSearchResults(data.youtubeSearchResults || null);

    const apiStatus = data.searchStatus || null;
    const hasAnswers = Boolean(data.answers && data.answers.length > 0);
    const isRelatedOnly =
      apiStatus === 'related_only' || apiStatus === 'related_questions';

    // related_only may include full answer payloads for the related pills so a
    // click does not need a second search.
    if (isRelatedOnly) {
      const relatedPayloads = data.relatedAnswers || data.answers || [];
      setAnswers(relatedPayloads);
      setRelatedAnswers(relatedPayloads);
      setRelatedQuestion(null);
      setQueueInfo(data.queueInfo || null);
      setSearchStatus('related_only');
      if (!data.relatedQuestions && relatedPayloads.length > 0) {
        setRelatedQuestions(
          relatedPayloads
            .map((answer) => answer.questionTitle)
            .filter(Boolean)
        );
      }
      return;
    }

    if (hasAnswers) {
      setAnswers(data.answers);
      setRelatedQuestion(data.relatedQuestion || null);
      setSearchStatus(
        apiStatus === 'qa_match' ? 'answered' : apiStatus || 'answered'
      );
      // Always defer queue work on hits (API no longer sends it; ignore stale precanned queueInfo)
      setQueueInfo(null);
      return;
    }

    setAnswers([]);
    setRelatedAnswers([]);
    setRelatedQuestion(null);
    setQueueInfo(data.queueInfo || null);
    // Prefer the three-outcome API contract while accepting legacy responses.
    if (apiStatus === 'tags_fallback' || apiStatus === 'no_results') {
      setSearchStatus('unanswered');
    } else {
      setSearchStatus(apiStatus || 'unanswered');
    }
  };

  const handleRelatedQuestionClick = (question) => {
    const questionText = (question || '').trim();
    if (!questionText) {
      return;
    }

    const cached = [...relatedAnswers, ...answers].find(
      (answer) =>
        (answer.questionTitle || '').trim().toLowerCase() ===
        questionText.toLowerCase()
    );
    if (cached) {
      setError(null);
      setLoading(false);
      setLoadingMessage('');
      setCurrentQuestion(questionText);
      setAnswers([cached]);
      setRelatedQuestion(null);
      setRelatedQuestions(null);
      setRelatedAnswers([]);
      setYoutubeSearchResults(null);
      setSearchStatus('answered');
      setQueueInfo(null);
      setUserMessage(null);
      return;
    }

    handleQuestionSubmit(questionText);
  };

  const handleQuestionSubmit = async (question) => {
    setLoading(true);
    setError(null);
    setRelatedQuestion(null);
    setRelatedQuestions(null);
    setRelatedAnswers([]);
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
        applyAnswerPayload(precanned);
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
      applyAnswerPayload(data);
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
      <QuestionForm
        onSubmit={handleQuestionSubmit}
        loading={loading}
        requestsEnabled={requestsEnabled}
      />
      {requestsEnabled && <RequestedQuestions apiUrl={apiUrl} />}
      <ProgressBar loading={loading} message={loadingMessage} />
      {error && <div className="error-message">Error: {error}</div>}
      {(answers.length > 0 ||
        relatedQuestions ||
        youtubeSearchResults ||
        searchStatus === 'unanswered' ||
        searchStatus === 'related_only' ||
        queueInfo) && (
        <div ref={resultsRef} className="results-anchor">
        <AnswerList
          answers={answers}
          relatedQuestion={relatedQuestion}
          relatedQuestions={relatedQuestions}
          relatedAnswers={relatedAnswers}
          youtubeSearchResults={youtubeSearchResults}
          searchStatus={searchStatus}
          queueInfo={queueInfo}
          userMessage={userMessage}
          currentQuestion={currentQuestion}
          onRelatedQuestionClick={handleRelatedQuestionClick}
          apiUrl={apiUrl}
          requestsEnabled={requestsEnabled}
        />
        </div>
      )}
    </>
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>Vedanta Answers</h1>
        <p className="App-tagline">
          Answers from Swami Sarvapriyananda&apos;s talks
          {' · '}
          <a
            href="https://www.youtube.com/playlist?list=PLDqahtm2vA70VohJ__IobJSOGFJ2SdaRO"
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
          >
            Source: AskSwami Q&amp;A
          </a>
        </p>
      </header>

      <main className="App-main">
        <div className="tabs">
          <Link
            to={withParams('/')}
            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          >
            Ask
          </Link>
          <Link
            to={withParams('/explore')}
            className={`tab-button ${activeTab === 'explore' ? 'active' : ''}`}
          >
            Explore
          </Link>
          <Link
            to={withParams('/gita')}
            className={`tab-button ${activeTab === 'gita' ? 'active' : ''}`}
          >
            Gita
          </Link>
          <Link
            to={withParams('/gospel')}
            className={`tab-button ${activeTab === 'gospel' ? 'active' : ''}`}
          >
            Gospel
          </Link>
          {showDebug && (
            <Link
              to={withParams('/debug')}
              className={`tab-button ${activeTab === 'debug' ? 'active' : ''}`}
            >
              Debug Search
            </Link>
          )}
        </div>

        <Routes>
          <Route path="/gita/*" element={<GitaRoutes />} />
          <Route path="/gospel/*" element={<GospelRoutes />} />
          <Route path="/explore" element={<TagsExplorer />} />
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
