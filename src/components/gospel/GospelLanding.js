import React from 'react';
import { Link } from 'react-router-dom';
import { useGospelData } from '../../context/GospelDataContext';
import { useGospelTeacherFilter } from '../../hooks/useGospelTeacherFilter';
import { gospelChapterDates } from '../../utils/gospelSections';
import '../gita/Gita.css';

function GospelLanding() {
  const { data, loading, error } = useGospelData();
  const { withTeacherQuery, showAllTeachers } = useGospelTeacherFilter();

  if (loading) {
    return <div className="gita-status">Loading Gospel talks…</div>;
  }

  if (error) {
    return <div className="gita-status gita-status-error">{error}</div>;
  }

  const chapters = data.chapters || [];
  const coveredCount = chapters.filter((chapter) =>
    showAllTeachers
      ? chapter.sarvapriyanandaTalkCount + chapter.relatedTalkCount > 0
      : chapter.sarvapriyanandaTalkCount > 0
  ).length;

  return (
    <div className="gita-page">
      <header className="gita-header">
        <p className="gita-kicker">The Gospel of Sri Ramakrishna</p>
        <h2 className="gita-title">Swami Sarvapriyananda</h2>
        <p className="gita-subtitle">
          Browse by Gospel chapter. Swami Sarvapriyananda&apos;s talks are shown
          by default.
        </p>
        {data?.sources?.sarvapriyanandaPlaylist?.url && (
          <a
            className="gita-source-link"
            href={data.sources.sarvapriyanandaPlaylist.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Full playlist on YouTube
          </a>
        )}
      </header>

      <p className="gospel-landing-note">
        {coveredCount} of {chapters.length} chapters have{' '}
        {showAllTeachers ? 'mapped talks' : 'a Swami Sarvapriyananda talk'}.
        Chapters marked <em>text only</em> have no video yet.
      </p>

      <div className="gita-chapter-grid">
        {chapters.map((chapter) => {
          const talkCount = showAllTeachers
            ? chapter.sarvapriyanandaTalkCount + chapter.relatedTalkCount
            : chapter.sarvapriyanandaTalkCount;
          const dates = gospelChapterDates(chapter);

          return (
            <Link
              key={chapter.chapterNumber}
              to={withTeacherQuery(`/gospel/${chapter.chapterNumber}`)}
              className={`gita-chapter-card${talkCount === 0 ? ' gita-chapter-card-empty' : ''}`}
            >
              <span className="gita-chapter-number">
                Chapter {chapter.chapterNumber}
              </span>
              <span className="gita-chapter-name">{chapter.title}</span>
              <span className="gita-chapter-meta">
                {dates[0] || 'Gospel chapter'}
                {dates.length > 1 ? ` +${dates.length - 1} more` : ''}
              </span>
              <span
                className={`gospel-chapter-badge${talkCount === 0 ? ' gospel-chapter-badge-empty' : ''}`}
              >
                {talkCount === 0
                  ? 'Text only'
                  : `${talkCount} talk${talkCount === 1 ? '' : 's'}`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default GospelLanding;
