import React from 'react';
import { Link } from 'react-router-dom';
import { getChapterName, getChapterVerseCount, useGitaData } from '../../context/GitaDataContext';
import { useGitaTeacherFilter } from '../../hooks/useGitaTeacherFilter';
import GitaSearch from './GitaSearch';
import './Gita.css';

const CHAPTERS = Array.from({ length: 18 }, (_, index) => index + 1);

function GitaLanding() {
  const { data, loading, error } = useGitaData();
  const { withTeacherQuery } = useGitaTeacherFilter();

  if (loading) {
    return <div className="gita-status">Loading Gita lectures…</div>;
  }

  if (error) {
    return <div className="gita-status gita-status-error">{error}</div>;
  }

  return (
    <div className="gita-page">
      <header className="gita-header">
        <p className="gita-kicker">Bhagavad Gita</p>
        <h2 className="gita-title">Swami Sarvapriyananda</h2>
        <p className="gita-subtitle">
          Browse chapter by chapter. Each mapped verse opens the lecture that covers it.
        </p>
        {data?.source?.playlistUrl && (
          <a
            className="gita-source-link"
            href={data.source.playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Full playlist on YouTube
          </a>
        )}
      </header>

      <GitaSearch />

      <div className="gita-chapter-grid">
        {CHAPTERS.map((chapter) => {
          const verseCount = getChapterVerseCount(data, chapter);
          const chapterName = getChapterName(data, chapter);
          const mappedCount = Object.keys(data.verseMap || {}).filter((key) =>
            key.startsWith(`${chapter}.`)
          ).length;

          return (
            <Link
              key={chapter}
              to={withTeacherQuery(`/gita/${chapter}`)}
              className="gita-chapter-card"
            >
              <span className="gita-chapter-number">Chapter {chapter}</span>
              <span className="gita-chapter-name">{chapterName}</span>
              <span className="gita-chapter-meta">
                {mappedCount > 0
                  ? `${mappedCount} of ${verseCount} verses mapped`
                  : `${verseCount} verses · coming soon`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default GitaLanding;
