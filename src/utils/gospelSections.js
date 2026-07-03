function primarySectionIndex(talk, sections) {
  if (talk.sectionStart != null && talk.sectionStart >= 0) {
    return talk.sectionStart;
  }

  if (talk.sectionTitles?.length) {
    const indices = talk.sectionTitles
      .map((title) => sections.indexOf(title))
      .filter((index) => index >= 0);
    if (indices.length > 0) {
      return Math.min(...indices);
    }
  }

  return -1;
}

function assignTalk(groups, unassigned, talk, bucketKey) {
  const sections = groups.map((group) => group.sectionTitle);
  const index = primarySectionIndex(talk, sections);

  if (index >= 0 && index < groups.length) {
    groups[index][bucketKey].push(talk);
    return;
  }

  unassigned[bucketKey].push(talk);
}

export function groupGospelChapterContent(chapter, talks, { sarvapriyanandaOnly = false } = {}) {
  const sections = chapter?.sections || [];
  const groups = sections.map((sectionTitle, sectionIndex) => ({
    sectionTitle,
    sectionIndex,
    sarvapriyanandaTalks: [],
    relatedTalks: [],
  }));

  const unassigned = {
    sarvapriyanandaTalks: [],
    relatedTalks: [],
  };

  for (const talk of talks.sarvapriyanandaTalks || []) {
    assignTalk(groups, unassigned, talk, 'sarvapriyanandaTalks');
  }

  if (!sarvapriyanandaOnly) {
    for (const talk of talks.relatedTalks || []) {
      assignTalk(groups, unassigned, talk, 'relatedTalks');
    }
  }

  const hasAssignedTalks = groups.some(
    (group) =>
      group.sarvapriyanandaTalks.length > 0 || group.relatedTalks.length > 0
  );

  return { groups, unassigned, hasAssignedTalks };
}
