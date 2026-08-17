/**
 * Gospel talks map many-to-one onto chapter sections: a single talk usually
 * covers a contiguous run of sections, and most sections have no talk at all.
 * These helpers group by talk (the unit that actually exists) and report the
 * sections left uncovered, rather than pinning each talk to one section.
 */

function coveredSectionIndexes(talk, sections) {
  const total = sections.length;
  if (total === 0) return [];

  const start = Number.isInteger(talk.sectionStart) ? talk.sectionStart : null;
  const end = Number.isInteger(talk.sectionEnd) ? talk.sectionEnd : null;

  if (start != null && start >= 0 && start < total) {
    const last = end != null && end >= start ? Math.min(end, total - 1) : start;
    const indexes = [];
    for (let index = start; index <= last; index += 1) {
      indexes.push(index);
    }
    return indexes;
  }

  if (talk.sectionTitles?.length) {
    const indexes = talk.sectionTitles
      .map((title) => sections.indexOf(title))
      .filter((index) => index >= 0);
    return [...new Set(indexes)].sort((a, b) => a - b);
  }

  return [];
}

function toTalkGroup(talk, sections, kind) {
  const sectionIndexes = coveredSectionIndexes(talk, sections);

  return {
    talk,
    kind,
    sectionIndexes,
    sectionTitles: sectionIndexes.map((index) => sections[index]),
    // Talks with no section mapping sort to the end of their block.
    sortKey: sectionIndexes.length ? sectionIndexes[0] : Number.MAX_SAFE_INTEGER,
  };
}

function sortTalkGroups(groups) {
  return groups.sort(
    (a, b) => a.sortKey - b.sortKey || (a.talk.part ?? 0) - (b.talk.part ?? 0)
  );
}

export function groupGospelChapterTalks(
  chapter,
  talks,
  { sarvapriyanandaOnly = false } = {}
) {
  const sections = chapter?.sections || [];

  const sarvapriyanandaGroups = sortTalkGroups(
    (talks.sarvapriyanandaTalks || []).map((talk) =>
      toTalkGroup(talk, sections, 'sarvapriyananda')
    )
  );

  const relatedGroups = sarvapriyanandaOnly
    ? []
    : sortTalkGroups(
        (talks.relatedTalks || []).map((talk) =>
          toTalkGroup(talk, sections, 'related')
        )
      );

  // Coverage reflects what is actually rendered, so the teacher filter changes it.
  const covered = new Set();
  for (const group of [...sarvapriyanandaGroups, ...relatedGroups]) {
    for (const index of group.sectionIndexes) {
      covered.add(index);
    }
  }

  const uncoveredSections = sections
    .map((title, index) => ({ title, index }))
    .filter((section) => !covered.has(section.index));

  return {
    sarvapriyanandaGroups,
    relatedGroups,
    uncoveredSections,
    sectionCount: sections.length,
    coveredSectionCount: covered.size,
    talkCount: sarvapriyanandaGroups.length + relatedGroups.length,
  };
}

/**
 * The Gospel HTML source lists every sitting date in a chapter, but only the
 * first was ever surfaced — which read as though a multi-day chapter happened
 * on one day. Returns the de-duplicated list in source order.
 */
export function gospelChapterDates(chapter) {
  const dates = chapter?.dateTexts?.length
    ? chapter.dateTexts
    : [chapter?.dateText];
  return [...new Set(dates.filter(Boolean))];
}
