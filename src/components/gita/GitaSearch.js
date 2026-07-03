import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGitaData } from '../../context/GitaDataContext';
import { useGitaTeacherFilter } from '../../hooks/useGitaTeacherFilter';
import { searchVerses } from '../../utils/gitaSearch';
import './Gita.css';

function formatTeacherMatches(teachers) {
  if (!teachers?.length) return null;
  const names = teachers.map((name) => name.replace(/^Swami\s+/i, 'Sw. '));
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

function GitaSearch() {
  const { data } = useGitaData();
  const { withTeacherQuery } = useGitaTeacherFilter();
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
        placeholder="Keyword, verse, or teacher (e.g. karma, 2.47, Tattwamayananda)"
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
                to={withTeacherQuery(`/gita/${result.chapter}/${result.verse}`)}
                className="gita-search-result"
              >
                <span className="gita-search-result-ref">{result.verseKey}</span>
                <span className="gita-search-result-chapter">
                  Chapter {result.chapter}
                  {result.chapterName ? ` · ${result.chapterName}` : ''}
                </span>
                {result.matchingTeachers?.length > 0 && (
                  <span className="gita-search-result-teachers">
                    Other teachers: {formatTeacherMatches(result.matchingTeachers)}
                  </span>
                )}
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
