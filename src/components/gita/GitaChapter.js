import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  getChapterName,
  getChapterOtherLectures,
  getChapterVerseCount,
  isVerseMapped,
  useGitaData,
} from '../../context/GitaDataContext';
import { useGitaTeacherFilter } from '../../hooks/useGitaTeacherFilter';
import './Gita.css';

function GitaChapterOtherLectures({ chapter, lectures }) {
  const { showAllTeachers } = useGitaTeacherFilter();

  if (!showAllTeachers || !lectures?.length) return null;

  return (
    <section className="gita-lecture-block gita-chapter-other-block">
      <h3 className="gita-section-label">Chapter-level lectures</h3>
      <p className="gita-lecture-note">
        Talks covering Chapter {chapter} as a whole from other teachers in the
        Ramakrishna Order.
      </p>
      <div className="gita-lecture-list">
        {lectures.map((lecture) => (
          <article
            key={`${lecture.videoId}-${lecture.swami}`}
            className="gita-lecture-card gita-lecture-card-compact"
          >
            <p className="gita-lecture-speaker">
              {lecture.swami}
              {lecture.language ? ` · ${lecture.language}` : ''}
            </p>
            <p className="gita-lecture-title">{lecture.title}</p>
            {lecture.url && (
              <a
                className="gita-source-link"
                href={lecture.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on YouTube
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function GitaChapter() {
  const { chapter: chapterParam } = useParams();
  const chapter = parseInt(chapterParam, 10);
  const { data, loading, error } = useGitaData();
  const { withTeacherQuery } = useGitaTeacherFilter();

  if (Number.isNaN(chapter) || chapter < 1 || chapter > 18) {
    return <Navigate to={withTeacherQuery('/gita')} replace />;
  }

  if (loading) {
    return <div className="gita-status">Loading chapter…</div>;
  }

  if (error) {
    return <div className="gita-status gita-status-error">{error}</div>;
  }

  const verseCount = getChapterVerseCount(data, chapter);
  const chapterName = getChapterName(data, chapter);
  const chapterOtherLectures = getChapterOtherLectures(data, chapter);
  const verses = Array.from({ length: verseCount }, (_, index) => index + 1);

  return (
    <div className="gita-page">
      <nav className="gita-breadcrumb">
        <Link to={withTeacherQuery('/gita')}>Gita</Link>
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
                to={withTeacherQuery(`/gita/${chapter}/${verse}`)}
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

      <GitaChapterOtherLectures
        chapter={chapter}
        lectures={chapterOtherLectures}
      />
    </div>
  );
}

export default GitaChapter;
