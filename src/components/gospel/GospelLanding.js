import React from 'react';
import { Link } from 'react-router-dom';
import { useGospelData } from '../../context/GospelDataContext';
import { useGospelTeacherFilter } from '../../hooks/useGospelTeacherFilter';
import '../gita/Gita.css';

function GospelLanding() {
  const { data, loading, error } = useGospelData();
  const { withTeacherQuery } = useGospelTeacherFilter();

  if (loading) {
    return <div className="gita-status">Loading Gospel talks…</div>;
  }

  if (error) {
    return <div className="gita-status gita-status-error">{error}</div>;
  }

  return (
    <div className="gita-page">
      <header className="gita-header">
        <p className="gita-kicker">The Gospel of Sri Ramakrishna</p>
        <h2 className="gita-title">Swami Sarvapriyananda</h2>
        <p className="gita-subtitle">
          Browse by Gospel chapter. Each chapter links to Swamiji&apos;s talks and,
          by default, related talks from other teachers.
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

      <div className="gita-chapter-grid">
        {(data.chapters || []).map((chapter) => (
          <Link
            key={chapter.chapterNumber}
            to={withTeacherQuery(`/gospel/${chapter.chapterNumber}`)}
            className="gita-chapter-card"
          >
            <span className="gita-chapter-number">
              Chapter {chapter.chapterNumber}
            </span>
            <span className="gita-chapter-name">{chapter.title}</span>
            <span className="gita-chapter-meta">
              {chapter.dateText || 'Gospel chapter'}
              {chapter.sarvapriyanandaTalkCount > 0
                ? ` · ${chapter.sarvapriyanandaTalkCount} talk${chapter.sarvapriyanandaTalkCount === 1 ? '' : 's'}`
                : ' · talks coming soon'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default GospelLanding;
