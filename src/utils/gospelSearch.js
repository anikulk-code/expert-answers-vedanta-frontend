function tokenizeQuery(query) {
  return String(query || '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function parseChapterRef(token) {
  if (/^\d{1,2}$/.test(token)) {
    const chapter = parseInt(token, 10);
    if (chapter >= 1 && chapter <= 52) return chapter;
  }
  return null;
}

function scoreChapter(chapter, tokens) {
  let score = 0;
  const searchText = chapter.searchText || '';
  const keywordSet = new Set((chapter.keywords || []).map((k) => k.toLowerCase()));

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const chapterRef = parseChapterRef(token);

    if (chapterRef === chapter.chapterNumber) {
      score += 1000;
      continue;
    }

    if (keywordSet.has(token)) {
      score += 10;
    } else if (searchText.includes(token)) {
      score += 3;
    }
  }

  return score;
}

export function searchGospelChapters(data, query, { limit = 30 } = {}) {
  if (!data?.chapters) return [];

  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return [];

  const results = data.chapters
    .map((chapter) => ({
      chapter,
      score: scoreChapter(chapter, tokens),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.chapter.chapterNumber - b.chapter.chapterNumber;
    })
    .slice(0, limit)
    .map((item) => item.chapter);

  return results;
}
