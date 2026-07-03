import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const GitaDataContext = createContext(null);

export function GitaDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGitaData() {
      try {
        const response = await fetch('/data/gita-map.json');
        if (!response.ok) {
          throw new Error(`Failed to load Gita data (${response.status})`);
        }
        const json = await response.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load Gita data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGitaData();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ data, loading, error }),
    [data, loading, error]
  );

  return (
    <GitaDataContext.Provider value={value}>
      {children}
    </GitaDataContext.Provider>
  );
}

export function useGitaData() {
  const context = useContext(GitaDataContext);
  if (!context) {
    throw new Error('useGitaData must be used within GitaDataProvider');
  }
  return context;
}

export function verseKey(chapter, verse) {
  return `${chapter}.${verse}`;
}

export function isVerseMapped(data, chapter, verse) {
  if (!data?.verseMap) return false;
  return Boolean(data.verseMap[verseKey(chapter, verse)]);
}

export function getChapterVerseCount(data, chapter) {
  return data?.chapterVerseCounts?.[String(chapter)] || 0;
}

export function getChapterName(data, chapter) {
  return data?.chapterNames?.[chapter] || data?.chapterNames?.[String(chapter)] || '';
}
