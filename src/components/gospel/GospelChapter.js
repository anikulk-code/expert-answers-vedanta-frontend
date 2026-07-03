import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  getGospelChapter,
  getGospelTalks,
  useGospelData,
} from '../../context/GospelDataContext';
import { useGospelTeacherFilter } from '../../hooks/useGospelTeacherFilter';
import '../gita/Gita.css';

function youtubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

function GospelTalkEmbed({ talk, label }) {
  if (!talk?.videoId) return null;

  return (
    <article className="gita-lecture-card">
      {label && <p className="gita-lecture-speaker">{label}</p>}
      <p className="gita-lecture-title">{talk.title}</p>
      <div className="gita-video-wrap">
        <iframe
          title={talk.title}
          src={youtubeEmbedUrl(talk.videoId)}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {talk.url && (
        <a
          className="gita-source-link"
          href={talk.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open on YouTube
        </a>
      )}
    </article>
  );
}

function GospelTalkLink({ talk }) {
  return (
    <article className="gita-lecture-card gita-lecture-card-compact">
      <p className="gita-lecture-speaker">{talk.speaker}</p>
      <p className="gita-lecture-title">{talk.title}</p>
      {talk.url && (
        <a
          className="gita-source-link"
          href={talk.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open on YouTube
        </a>
      )}
    </article>
  );
}

function GospelChapter() {
  const { chapter: chapterParam } = useParams();
  const chapterNumber = parseInt(chapterParam, 10);
  const { data, loading, error } = useGospelData();
  const { withTeacherQuery, sarvapriyanandaOnly } = useGospelTeacherFilter();

  if (Number.isNaN(chapterNumber) || chapterNumber < 1 || chapterNumber > 52) {
    return <Navigate to={withTeacherQuery('/gospel')} replace />;
  }

  if (loading) {
    return <div className="gita-status">Loading chapter…</div>;
  }

  if (error) {
    return <div className="gita-status gita-status-error">{error}</div>;
  }

  const chapter = getGospelChapter(data, chapterNumber);
  const talks = getGospelTalks(data, chapterNumber);

  if (!chapter) {
    return <Navigate to={withTeacherQuery('/gospel')} replace />;
  }

  return (
    <div className="gita-page">
      <nav className="gita-breadcrumb">
        <Link to={withTeacherQuery('/gospel')}>Gospel</Link>
        <span aria-hidden="true"> / </span>
        <span>Chapter {chapterNumber}</span>
      </nav>

      <header className="gita-header gita-header-verse">
        <p className="gita-kicker">
          Chapter {chapterNumber}
          {chapter.volume ? ` · Volume ${chapter.volume}` : ''}
        </p>
        <h2 className="gita-title">{chapter.title}</h2>
        {chapter.dateText && (
          <p className="gita-subtitle">{chapter.dateText}</p>
        )}
        {chapter.sourceUrl && (
          <a
            className="gita-source-link"
            href={chapter.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read chapter text
          </a>
        )}
      </header>

      {chapter.sections?.length > 0 && (
        <section className="gita-verse-block">
          <h3 className="gita-section-label">Sections in this chapter</h3>
          <ul className="gospel-section-list">
            {chapter.sections.map((section) => (
              <li key={section}>{section}</li>
            ))}
          </ul>
        </section>
      )}

      {talks.sarvapriyanandaTalks.length > 0 ? (
        <section className="gita-lecture-block">
          <h3 className="gita-section-label">
            Talks · Swami Sarvapriyananda
          </h3>
          <div className="gita-lecture-list">
            {talks.sarvapriyanandaTalks.map((talk) => (
              <GospelTalkEmbed
                key={talk.videoId}
                talk={talk}
                label="Swami Sarvapriyananda"
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="gita-coming-soon">
          <p>
            Swami Sarvapriyananda&apos;s talk for this chapter is not mapped
            yet.
          </p>
        </section>
      )}

      {!sarvapriyanandaOnly && talks.relatedTalks.length > 0 && (
        <section className="gita-lecture-block">
          <h3 className="gita-section-label">Other teachers on this chapter</h3>
          <div className="gita-lecture-list">
            {talks.relatedTalks.map((talk) => (
              <GospelTalkLink key={`${talk.videoId}-${talk.speaker}`} talk={talk} />
            ))}
          </div>
        </section>
      )}

      <div className="gita-verse-nav">
        {chapterNumber > 1 && (
          <Link
            to={withTeacherQuery(`/gospel/${chapterNumber - 1}`)}
            className="gita-nav-link"
          >
            ← Chapter {chapterNumber - 1}
          </Link>
        )}
        <Link
          to={withTeacherQuery('/gospel')}
          className="gita-nav-link gita-nav-center"
        >
          All chapters
        </Link>
        {chapterNumber < 52 && (
          <Link
            to={withTeacherQuery(`/gospel/${chapterNumber + 1}`)}
            className="gita-nav-link"
          >
            Chapter {chapterNumber + 1} →
          </Link>
        )}
      </div>
    </div>
  );
}

export default GospelChapter;
