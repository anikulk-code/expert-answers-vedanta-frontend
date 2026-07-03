import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGospelData } from '../../context/GospelDataContext';
import { useGospelTeacherFilter } from '../../hooks/useGospelTeacherFilter';
import { searchGospelChapters } from '../../utils/gospelSearch';
import '../gita/Gita.css';

function GospelSearch() {
  const { data } = useGospelData();
  const { withTeacherQuery } = useGospelTeacherFilter();
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => searchGospelChapters(data, query),
    [data, query]
  );

  const trimmed = query.trim();

  return (
    <section className="gita-search">
      <label className="gita-search-label" htmlFor="gospel-keyword-search">
        Search chapters
      </label>
      <input
        id="gospel-keyword-search"
        type="search"
        className="gita-search-input"
        placeholder="Keyword, section, or chapter (e.g. Narendra, holy company, 12)"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
      />
      {trimmed && (
        <p className="gita-search-meta">
          {results.length === 0
            ? 'No matching chapters.'
            : `${results.length} chapter${results.length === 1 ? '' : 's'} found`}
        </p>
      )}
      {trimmed && results.length > 0 && (
        <ul className="gita-search-results">
          {results.map((chapter) => (
            <li key={chapter.chapterNumber}>
              <Link
                to={withTeacherQuery(`/gospel/${chapter.chapterNumber}`)}
                className="gita-search-result"
              >
                <span className="gita-search-result-ref">
                  Chapter {chapter.chapterNumber}
                </span>
                <span className="gita-search-result-chapter">
                  {chapter.title}
                  {chapter.dateText ? ` · ${chapter.dateText}` : ''}
                </span>
                {chapter.sections?.[0] && (
                  <span className="gita-search-result-snippet">
                    {chapter.sections[0]}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default GospelSearch;
