import React from 'react';
import { useGitaTeacherFilter } from '../../hooks/useGitaTeacherFilter';
import './Gita.css';

function youtubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

function GitaLectureCard({ lecture, heading }) {
  if (!lecture?.videoId) return null;

  return (
    <article className="gita-lecture-card">
      {heading && <p className="gita-lecture-speaker">{heading}</p>}
      <p className="gita-lecture-title">{lecture.title}</p>
      <div className="gita-video-wrap">
        <iframe
          title={lecture.title}
          src={youtubeEmbedUrl(lecture.videoId)}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
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
  );
}

function GitaOtherLectureLink({ lecture }) {
  return (
    <article className="gita-lecture-card gita-lecture-card-compact">
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
  );
}

function GitaLectureList({ primaryLecture, otherLectures }) {
  const { sarvapriyanandaOnly } = useGitaTeacherFilter();

  return (
    <>
      {primaryLecture && (
        <section className="gita-lecture-block">
          <h3 className="gita-section-label">Lecture · Swami Sarvapriyananda</h3>
          <GitaLectureCard lecture={primaryLecture} />
        </section>
      )}

      {!sarvapriyanandaOnly && otherLectures?.length > 0 && (
        <section className="gita-lecture-block">
          <h3 className="gita-section-label">Other teachers on this verse</h3>
          <div className="gita-lecture-list">
            {otherLectures.map((lecture) => (
              <GitaOtherLectureLink
                key={`${lecture.videoId}-${lecture.swami}`}
                lecture={lecture}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default GitaLectureList;
