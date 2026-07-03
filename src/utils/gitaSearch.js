function tokenizeQuery(query) {
  return String(query || '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function parseVerseRef(token) {
  const dotted = token.match(/^(\d{1,2})\.(\d{1,3})$/);
  if (dotted) {
    return `${parseInt(dotted[1], 10)}.${parseInt(dotted[2], 10)}`;
  }
  return null;
}

function parseVerseRefFromTokens(tokens, index) {
  const single = parseVerseRef(tokens[index]);
  if (single) return single;

  const chapter = parseInt(tokens[index], 10);
  const verse = parseInt(tokens[index + 1], 10);
  if (
    Number.isInteger(chapter) &&
    Number.isInteger(verse) &&
    chapter >= 1 &&
    chapter <= 18 &&
    verse >= 1
  ) {
    return `${chapter}.${verse}`;
  }
  return null;
}

function getMatchingTeachers(otherLectures, tokens) {
  const matches = new Set();
  for (const lecture of otherLectures || []) {
    const swami = (lecture.swami || '').toLowerCase();
    const title = (lecture.title || '').toLowerCase();
    for (const token of tokens) {
      if (swami.includes(token) || title.includes(token)) {
        matches.add(lecture.swami);
      }
    }
  }
  return Array.from(matches);
}

function scoreVerse(verseKey, entry, tokens) {
  let score = 0;
  const searchText = entry.searchText || '';
  const keywordSet = new Set((entry.keywords || []).map((k) => k.toLowerCase()));
  const themeKeywords = new Set(
    (entry.keywords || [])
      .map((k) => k.toLowerCase())
      .filter((k) => k.includes(' ') || ['karma', 'yoga', 'devotion', 'atman', 'gunas', 'meditation', 'detachment', 'grief', 'peace'].includes(k))
  );
  const matchingTeachers = getMatchingTeachers(entry.otherLectures, tokens);

  if (matchingTeachers.length > 0) {
    score += 20 * matchingTeachers.length;
  }

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const verseRef = parseVerseRefFromTokens(tokens, i);

    if (verseRef) {
      if (verseRef === verseKey) {
        score += 1000;
      }
      if (token.includes('.')) {
        continue;
      }
      if (Number.isInteger(parseInt(tokens[i + 1], 10))) {
        i += 1;
      }
      continue;
    }

    if (keywordSet.has(token)) {
      score += themeKeywords.has(token) ? 12 : 8;
    } else if (searchText.includes(token)) {
      score += 2;
    }
  }

  return { score, matchingTeachers };
}

export function searchVerses(data, query, { limit = 30 } = {}) {
  if (!data?.verseMap) return [];

  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return [];

  const results = [];

  for (const [verseKey, entry] of Object.entries(data.verseMap)) {
    const { score, matchingTeachers } = scoreVerse(verseKey, entry, tokens);
    if (score <= 0) continue;

    const translation = entry.translation?.text || '';
    results.push({
      verseKey,
      chapter: parseInt(verseKey.split('.')[0], 10),
      verse: parseInt(verseKey.split('.')[1], 10),
      score,
      matchingTeachers,
      snippet: translation.length > 160
        ? `${translation.slice(0, 157).trim()}…`
        : translation,
      chapterName: data.chapterNames?.[verseKey.split('.')[0]]
        || data.chapterNames?.[parseInt(verseKey.split('.')[0], 10)]
        || '',
    });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const [aCh, aV] = a.verseKey.split('.').map(Number);
    const [bCh, bV] = b.verseKey.split('.').map(Number);
    if (aCh !== bCh) return aCh - bCh;
    return aV - bV;
  });

  return results.slice(0, limit);
}
