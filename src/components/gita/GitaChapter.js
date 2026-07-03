import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  getChapterName,
  getChapterVerseCount,
  isVerseMapped,
  useGitaData,
} from '../../context/GitaDataContext';
import './Gita.css';

function GitaChapter() {
  const { chapter: chapterParam } = useParams();
  const chapter = parseInt(chapterParam, 10);
  const { data, loading, error } = useGitaData();

  if (Number.isNaN(chapter) || chapter < 1 || chapter > 18) {
    return <Navigate to="/gita" replace />;
  }

  if (loading) {
    return <div className="gita-status">Loading chapter…</div>;
  }

  if (error) {
    return <div className="gita-status gita-status-error">{error}</div>;
  }

  const verseCount = getChapterVerseCount(data, chapter);
  const chapterName = getChapterName(data, chapter);
  const verses = Array.from({ length: verseCount }, (_, index) => index + 1);

  return (
    <div className="gita-page">
      <nav className="gita-breadcrumb">
        <Link to="/gita">Gita</Link>
        <span aria-hidden="true"> / </span>
        <span>Chapter {chapter}</span>
      </nav>

      <header className="gita-header">
        <p className="gita-kicker">Chapter {chapter}</p>
        <h2 className="gita-title">{chapterName}</h2>
        <p className="gita-subtitle">{verseCount} verses</p>
      </header>

      <div className="gita-verse-grid">
        {verses.map((verse) => {
          const mapped = isVerseMapped(data, chapter, verse);

          if (mapped) {
            return (
              <Link
                key={verse}
                to={`/gita/${chapter}/${verse}`}
                className="gita-verse-tile gita-verse-tile-mapped"
              >
                {verse}
              </Link>
            );
          }

          return (
            <span
              key={verse}
              className="gita-verse-tile gita-verse-tile-unmapped"
              title="Coming soon"
            >
              {verse}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default GitaChapter;
