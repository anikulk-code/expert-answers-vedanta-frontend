import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  getChapterName,
  getChapterVerseCount,
  useGitaData,
  verseKey,
} from '../../context/GitaDataContext';
import { useGitaTeacherFilter } from '../../hooks/useGitaTeacherFilter';
import GitaLectureList from './GitaLectureList';
import './Gita.css';

function GitaVerse() {
  const { chapter: chapterParam, verse: verseParam } = useParams();
  const chapter = parseInt(chapterParam, 10);
  const verse = parseInt(verseParam, 10);
  const { data, loading, error } = useGitaData();
  const { withTeacherQuery } = useGitaTeacherFilter();

  if (
    Number.isNaN(chapter) ||
    Number.isNaN(verse) ||
    chapter < 1 ||
    chapter > 18
  ) {
    return <Navigate to={withTeacherQuery('/gita')} replace />;
  }

  const verseCount = data ? getChapterVerseCount(data, chapter) : 0;
  if (verse < 1 || verse > verseCount) {
    return <Navigate to={withTeacherQuery(`/gita/${chapter}`)} replace />;
  }

  if (loading) {
    return <div className="gita-status">Loading verse…</div>;
  }

  if (error) {
    return <div className="gita-status gita-status-error">{error}</div>;
  }

  const entry = data.verseMap?.[verseKey(chapter, verse)];
  const chapterName = getChapterName(data, chapter);

  if (!entry) {
    return (
      <div className="gita-page">
        <nav className="gita-breadcrumb">
          <Link to={withTeacherQuery('/gita')}>Gita</Link>
          <span aria-hidden="true"> / </span>
          <Link to={withTeacherQuery(`/gita/${chapter}`)}>Chapter {chapter}</Link>
          <span aria-hidden="true"> / </span>
          <span>Verse {verse}</span>
        </nav>
        <div className="gita-coming-soon">
          <h2>{chapter}.{verse}</h2>
          <p>
            Swamiji&apos;s lecture for this verse is not mapped yet. Check back
            as the series continues.
          </p>
          <Link to={withTeacherQuery(`/gita/${chapter}`)} className="gita-back-link">
            Back to Chapter {chapter}
          </Link>
        </div>
      </div>
    );
  }

  const {
    slok,
    transliteration,
    translation,
    translationSource,
    lecture,
    otherLectures,
  } = entry;

  return (
    <div className="gita-page">
      <nav className="gita-breadcrumb">
        <Link to={withTeacherQuery('/gita')}>Gita</Link>
        <span aria-hidden="true"> / </span>
        <Link to={withTeacherQuery(`/gita/${chapter}`)}>Chapter {chapter}</Link>
        <span aria-hidden="true"> / </span>
        <span>Verse {verse}</span>
      </nav>

      <header className="gita-header gita-header-verse">
        <p className="gita-kicker">
          Chapter {chapter} · {chapterName}
        </p>
        <h2 className="gita-title gita-verse-ref">{chapter}.{verse}</h2>
      </header>

      {slok && (
        <section className="gita-verse-block">
          <h3 className="gita-section-label">Sanskrit</h3>
          <p className="gita-slok">{slok}</p>
        </section>
      )}

      {transliteration && (
        <section className="gita-verse-block">
          <h3 className="gita-section-label">Transliteration</h3>
          <p className="gita-transliteration">{transliteration}</p>
        </section>
      )}

      {translation?.text && (
        <section className="gita-verse-block">
          <h3 className="gita-section-label">English</h3>
          {translation.speaker && (
            <p className="gita-speaker">{translation.speaker}</p>
          )}
          <p className="gita-translation">{translation.text}</p>
          {translationSource?.translator && (
            <p className="gita-attribution">
              Translation: {translationSource.translator}
              {translationSource.work ? ` · ${translationSource.work}` : ''}
            </p>
          )}
        </section>
      )}

      <GitaLectureList
        primaryLecture={lecture}
        otherLectures={otherLectures}
      />

      <div className="gita-verse-nav">
        {verse > 1 && (
          <Link
            to={withTeacherQuery(`/gita/${chapter}/${verse - 1}`)}
            className="gita-nav-link"
          >
            ← {chapter}.{verse - 1}
          </Link>
        )}
        <Link
          to={withTeacherQuery(`/gita/${chapter}`)}
          className="gita-nav-link gita-nav-center"
        >
          Chapter {chapter}
        </Link>
        {verse < verseCount && (
          <Link
            to={withTeacherQuery(`/gita/${chapter}/${verse + 1}`)}
            className="gita-nav-link"
          >
            {chapter}.{verse + 1} →
          </Link>
        )}
      </div>
    </div>
  );
}

export default GitaVerse;
