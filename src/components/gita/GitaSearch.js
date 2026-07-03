import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGitaData } from '../../context/GitaDataContext';
import { searchVerses } from '../../utils/gitaSearch';
import './Gita.css';

function GitaSearch() {
  const { data } = useGitaData();
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => searchVerses(data, query),
    [data, query]
  );

  const trimmed = query.trim();

  return (
    <section className="gita-search">
      <label className="gita-search-label" htmlFor="gita-keyword-search">
        Search verses
      </label>
      <input
        id="gita-keyword-search"
        type="search"
        className="gita-search-input"
        placeholder="Keyword or verse (e.g. karma, detachment, 2.47)"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
      />
      {trimmed && (
        <p className="gita-search-meta">
          {results.length === 0
            ? 'No matching verses.'
            : `${results.length} verse${results.length === 1 ? '' : 's'} found`}
        </p>
      )}
      {trimmed && results.length > 0 && (
        <ul className="gita-search-results">
          {results.map((result) => (
            <li key={result.verseKey}>
              <Link
                to={`/gita/${result.chapter}/${result.verse}`}
                className="gita-search-result"
              >
                <span className="gita-search-result-ref">{result.verseKey}</span>
                <span className="gita-search-result-chapter">
                  Chapter {result.chapter}
                  {result.chapterName ? ` · ${result.chapterName}` : ''}
                </span>
                {result.snippet && (
                  <span className="gita-search-result-snippet">{result.snippet}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default GitaSearch;
