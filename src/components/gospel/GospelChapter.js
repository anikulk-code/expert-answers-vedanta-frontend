import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  getGospelChapter,
  getGospelTalks,
  useGospelData,
} from '../../context/GospelDataContext';
import { useGospelTeacherFilter } from '../../hooks/useGospelTeacherFilter';
import {
  gospelChapterDates,
  groupGospelChapterTalks,
} from '../../utils/gospelSections';
import '../gita/Gita.css';

function youtubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function GospelTalkCard({ group, embed }) {
  const { talk, sectionIndexes, sectionTitles } = group;
  const speakerLine = talk.part
    ? `${talk.speaker} · Part ${talk.part}`
    : talk.speaker;

  return (
    <article className="gita-lecture-card gospel-talk-card">
      <p className="gita-lecture-speaker">{speakerLine}</p>
      <p className="gita-lecture-title">{talk.title}</p>

      {embed && talk.videoId && (
        <div className="gita-video-wrap">
          <iframe
            title={talk.title}
            src={youtubeEmbedUrl(talk.videoId)}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      {sectionTitles.length > 0 ? (
        <div className="gospel-talk-coverage">
          <p className="gospel-coverage-label">
            Covers {plural(sectionTitles.length, 'section')}
          </p>
          <ol
            className="gospel-section-list"
            start={sectionIndexes[0] + 1}
          >
            {sectionTitles.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="gospel-coverage-none">
          Covers the chapter as a whole — not mapped to specific sections.
        </p>
      )}

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

  const {
    sarvapriyanandaGroups,
    relatedGroups,
    uncoveredSections,
    sectionCount,
    coveredSectionCount,
    talkCount,
  } = groupGospelChapterTalks(chapter, talks, { sarvapriyanandaOnly });

  const dates = gospelChapterDates(chapter);

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
        {dates.length > 0 && (
          <p className="gita-subtitle">
            {dates.length > 1 && (
              <span className="gospel-date-label">
                {plural(dates.length, 'sitting')}:{' '}
              </span>
            )}
            {dates.join(' · ')}
          </p>
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

      {talkCount > 0 && (
        <p className="gospel-coverage-summary">
          {plural(talkCount, 'talk')} · {coveredSectionCount} of{' '}
          {plural(sectionCount, 'section')} covered
        </p>
      )}

      {sarvapriyanandaGroups.length > 0 && (
        <section className="gita-lecture-block">
          <h3 className="gita-section-label">Swami Sarvapriyananda</h3>
          <div className="gita-lecture-list">
            {sarvapriyanandaGroups.map((group) => (
              <GospelTalkCard key={group.talk.videoId} group={group} embed />
            ))}
          </div>
        </section>
      )}

      {relatedGroups.length > 0 && (
        <section className="gita-lecture-block">
          <h3 className="gita-section-label">Other teachers</h3>
          <div className="gita-lecture-list">
            {relatedGroups.map((group) => (
              <GospelTalkCard
                key={`${group.talk.videoId}-${group.talk.speaker}`}
                group={group}
              />
            ))}
          </div>
        </section>
      )}

      {talkCount === 0 && (
        <section className="gita-coming-soon">
          <p>
            No {sarvapriyanandaOnly ? 'Swami Sarvapriyananda ' : ''}talk is
            mapped to this chapter yet. The chapter text is still available
            below.
          </p>
        </section>
      )}

      {uncoveredSections.length > 0 && (
        <section className="gospel-uncovered">
          <h3 className="gita-section-label">
            Not yet on video · {plural(uncoveredSections.length, 'section')}
          </h3>
          <ul className="gospel-section-list gospel-uncovered-list">
            {uncoveredSections.map((section) => (
              <li key={section.index}>
                <span className="gospel-uncovered-number">
                  {section.index + 1}.
                </span>{' '}
                {section.title}
              </li>
            ))}
          </ul>
          {chapter.sourceUrl && (
            <a
              className="gita-source-link"
              href={chapter.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read these in the chapter text
            </a>
          )}
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
