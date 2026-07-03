import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const GospelDataContext = createContext(null);

export function GospelDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGospelData() {
      try {
        const response = await fetch('/data/gospel-map.json');
        if (!response.ok) {
          throw new Error(`Failed to load Gospel data (${response.status})`);
        }
        const json = await response.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load Gospel data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGospelData();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ data, loading, error }),
    [data, loading, error]
  );

  return (
    <GospelDataContext.Provider value={value}>
      {children}
    </GospelDataContext.Provider>
  );
}

export function useGospelData() {
  const context = useContext(GospelDataContext);
  if (!context) {
    throw new Error('useGospelData must be used within GospelDataProvider');
  }
  return context;
}

export function getGospelChapter(data, chapterNumber) {
  return data?.chapters?.find(
    (chapter) => chapter.chapterNumber === chapterNumber
  );
}

export function getGospelTalks(data, chapterNumber) {
  return data?.talksByChapter?.[String(chapterNumber)] || {
    sarvapriyanandaTalks: [],
    relatedTalks: [],
  };
}

export function hasGospelChapterTalks(data, chapterNumber) {
  const talks = getGospelTalks(data, chapterNumber);
  return (
    talks.sarvapriyanandaTalks.length > 0 || talks.relatedTalks.length > 0
  );
}
