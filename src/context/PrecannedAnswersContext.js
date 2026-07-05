import React, { createContext, useContext, useEffect, useState } from 'react';

const PrecannedAnswersContext = createContext({
  responsesByQuestion: null,
  loading: true,
  error: null,
});

export function PrecannedAnswersProvider({ children }) {
  const [responsesByQuestion, setResponsesByQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/data/precanned-answers.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load precanned answers (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setResponsesByQuestion(data.questions || {});
        setLoading(false);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setError(fetchError.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PrecannedAnswersContext.Provider value={{ responsesByQuestion, loading, error }}>
      {children}
    </PrecannedAnswersContext.Provider>
  );
}

export function usePrecannedAnswers() {
  return useContext(PrecannedAnswersContext);
}
