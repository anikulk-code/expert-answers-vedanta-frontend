import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  getChapterName,
  getChapterVerseCount,
  useGitaData,
  verseKey,
} from '../../context/GitaDataContext';
import './Gita.css';

function GitaVerse() {
  const { chapter: chapterParam, verse: verseParam } = useParams();
  const chapter = parseInt(chapterParam, 10);
  const verse = parseInt(verseParam, 10);
  const { data, loading, error } = useGitaData();

  if (
    Number.isNaN(chapter) ||
    Number.isNaN(verse) ||
    chapter < 1 ||
    chapter > 18
  ) {
    return <Navigate to="/gita" replace />;
  }

  const verseCount = data ? getChapterVerseCount(data, chapter) : 0;
  if (verse < 1 || verse > verseCount) {
    return <Navigate to={`/gita/${chapter}`} replace />;
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
          <Link to="/gita">Gita</Link>
          <span aria-hidden="true"> / </span>
          <Link to={`/gita/${chapter}`}>Chapter {chapter}</Link>
          <span aria-hidden="true"> / </span>
          <span>Verse {verse}</span>
        </nav>
        <div className="gita-coming-soon">
          <h2>{chapter}.{verse}</h2>
          <p>
            Swamiji&apos;s lecture for this verse is not mapped yet. Check back
            as the series continues.
          </p>
          <Link to={`/gita/${chapter}`} className="gita-back-link">
            Back to Chapter {chapter}
          </Link>
        </div>
      </div>
    );
  }

  const { slok, transliteration, translation, translationSource, lecture } = entry;
  const embedUrl = lecture?.videoId
    ? `https://www.youtube.com/embed/${lecture.videoId}?rel=0`
    : null;

  return (
    <div className="gita-page">
      <nav className="gita-breadcrumb">
        <Link to="/gita">Gita</Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/gita/${chapter}`}>Chapter {chapter}</Link>
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

      {lecture && (
        <section className="gita-lecture-block">
          <h3 className="gita-section-label">Lecture</h3>
          <p className="gita-lecture-title">{lecture.title}</p>
          {embedUrl && (
            <div className="gita-video-wrap">
              <iframe
                title={lecture.title}
                src={embedUrl}
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}
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
        </section>
      )}

      <div className="gita-verse-nav">
        {verse > 1 && (
          <Link to={`/gita/${chapter}/${verse - 1}`} className="gita-nav-link">
            ← {chapter}.{verse - 1}
          </Link>
        )}
        <Link to={`/gita/${chapter}`} className="gita-nav-link gita-nav-center">
          Chapter {chapter}
        </Link>
        {verse < verseCount && (
          <Link to={`/gita/${chapter}/${verse + 1}`} className="gita-nav-link">
            {chapter}.{verse + 1} →
          </Link>
        )}
      </div>
    </div>
  );
}

export default GitaVerse;
